"use server";

import { revalidatePath } from "next/cache";
import type { BookStatus, OrderStatus, Role, UserStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { CATS, round5 } from "@/lib/data";
import { db } from "@/lib/db";
import type { Result } from "./shop";

const refresh = () => revalidatePath("/", "layout");
const int = (v: unknown, min = 0, max = 1_000_000) => Math.min(max, Math.max(min, Math.floor(Number(v) || 0)));
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

async function guard<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    await requireStaff();
    return await fn();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/** Keeps a book's aggregate rating in step when a review enters (+1) or leaves (−1) the shop. */
async function shiftRating(bookId: string, stars: number, sign: 1 | -1) {
  const b = await db.book.findUnique({ where: { id: bookId } });
  if (!b) return;
  const n = Math.max(0, b.reviewCount + sign);
  const rating = n ? Math.min(5, Math.max(0, (b.rating * b.reviewCount + sign * stars) / n)) : 0;
  await db.book.update({ where: { id: bookId }, data: { reviewCount: n, rating } });
}

/* ───────── products ───────── */

export interface BookInput {
  title: string; author: string; category: string; isbn: string; year: number; pages: number; description: string;
  priceNew: number; priceVG: number; priceGood: number; stockNew: number; stockVG: number; stockGood: number;
  coverImageUrl: string | null; coverTone: number; status: BookStatus;
}

export async function saveBook(input: BookInput, id: string | null): Promise<Result<{ id: string }>> {
  return guard(async () => {
    const title = str(input.title), author = str(input.author, 120);
    const priceNew = int(input.priceNew);
    if (!title || !author || !(priceNew > 0)) return { error: "Please add a title, an author and a new price before saving." };
    const cover = input.coverImageUrl && /^\/api\/uploads\/[\w-]+$/.test(input.coverImageUrl) ? input.coverImageUrl : null;
    const data = {
      title, author, category: CATS.includes(input.category) ? input.category : "Fiction", isbn: str(input.isbn, 40),
      year: int(input.year, 0, 3000) || new Date().getFullYear(), pages: int(input.pages, 0, 100000), description: str(input.description, 5000),
      priceNew, priceVG: int(input.priceVG) || round5(priceNew * 0.6), priceGood: int(input.priceGood) || round5(priceNew * 0.45),
      stockNew: int(input.stockNew), stockVG: int(input.stockVG), stockGood: int(input.stockGood),
      coverImageUrl: cover, coverTone: int(input.coverTone, 0, 5), status: input.status === "Draft" ? ("Draft" as const) : ("Published" as const),
    };
    const book = id ? await db.book.update({ where: { id }, data }) : await db.book.create({ data });
    refresh();
    return { ok: true as const, id: book.id };
  });
}

export async function deleteBooks(ids: string[]): Promise<Result> {
  return guard(async () => {
    await db.book.deleteMany({ where: { id: { in: ids } } });
    refresh();
    return { ok: true as const };
  });
}

export async function setBooksStatus(ids: string[], status: BookStatus): Promise<Result> {
  return guard(async () => {
    await db.book.updateMany({ where: { id: { in: ids } }, data: { status: status === "Draft" ? "Draft" : "Published" } });
    refresh();
    return { ok: true as const };
  });
}

export async function adjustStock(ids: string[], delta: number): Promise<Result> {
  return guard(async () => {
    const d = Math.round(delta);
    if (d >= 0) await db.book.updateMany({ where: { id: { in: ids } }, data: { stockNew: { increment: d } } });
    else {
      await db.book.updateMany({ where: { id: { in: ids }, stockNew: { gte: -d } }, data: { stockNew: { increment: d } } });
      await db.book.updateMany({ where: { id: { in: ids }, stockNew: { lt: -d } }, data: { stockNew: 0 } });
    }
    refresh();
    return { ok: true as const };
  });
}

export async function setStock(id: string, field: "stockNew" | "stockVG" | "stockGood", value: number): Promise<Result> {
  return guard(async () => {
    if (!["stockNew", "stockVG", "stockGood"].includes(field)) return { error: "Unknown field." };
    await db.book.update({ where: { id }, data: { [field]: int(value) } });
    refresh();
    return { ok: true as const };
  });
}

const MAX_UPLOAD = 1.5 * 1024 * 1024;
export async function uploadCover(form: FormData): Promise<Result<{ url: string }>> {
  return guard(async () => {
    const file = form.get("file");
    if (!(file instanceof File)) return { error: "No file received." };
    if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) return { error: "Please upload a JPG, PNG or WebP image." };
    if (file.size > MAX_UPLOAD) return { error: "That image is larger than 1.5 MB — please choose a smaller file." };
    const up = await db.upload.create({ data: { mime: file.type, data: Buffer.from(await file.arrayBuffer()) } });
    return { ok: true as const, url: `/api/uploads/${up.id}` };
  });
}

/* ───────── collections ───────── */

export async function createCollection(): Promise<Result<{ id: string }>> {
  return guard(async () => {
    const c = await db.collection.create({ data: { name: "New collection" } });
    refresh();
    return { ok: true as const, id: c.id };
  });
}

export async function saveCollection(
  id: string,
  input: { name: string; description: string; status: "Live" | "Hidden"; showOnHome: boolean; bookIds: string[] },
): Promise<Result> {
  return guard(async () => {
    const name = str(input.name, 80) || "Untitled";
    await db.$transaction([
      db.collection.update({
        where: { id },
        data: { name, description: str(input.description, 500), status: input.status === "Live" ? "Live" : "Hidden", showOnHome: !!input.showOnHome },
      }),
      db.collectionBook.deleteMany({ where: { collectionId: id } }),
      db.collectionBook.createMany({ data: [...new Set(input.bookIds)].map((bookId, position) => ({ collectionId: id, bookId, position })), skipDuplicates: true }),
    ]);
    refresh();
    return { ok: true as const };
  });
}

export async function deleteCollection(id: string): Promise<Result> {
  return guard(async () => {
    await db.collection.delete({ where: { id } });
    refresh();
    return { ok: true as const };
  });
}

/* ───────── orders ───────── */

const STOCK_FIELD = { new: "stockNew", vg: "stockVG", good: "stockGood" } as const;

export async function setOrderStatus(no: string, status: OrderStatus): Promise<Result> {
  return guard(async () => {
    if (!["Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) return { error: "Unknown status." };
    const order = await db.order.findUnique({ where: { no }, include: { lines: true } });
    if (!order) return { error: "Order not found." };
    if (order.status === status) return { ok: true as const };
    // Cancelling returns the copies to stock; un-cancelling takes them out again.
    const restock = status === "Cancelled" ? 1 : order.status === "Cancelled" ? -1 : 0;
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { no }, data: { status } });
      if (restock) {
        for (const l of order.lines) {
          if (!l.bookId) continue;
          const f = STOCK_FIELD[l.cond];
          const b = await tx.book.findUnique({ where: { id: l.bookId } });
          if (!b) continue;
          await tx.book.update({ where: { id: l.bookId }, data: { [f]: Math.max(0, b[f] + restock * l.qty) } });
        }
      }
    });
    refresh();
    return { ok: true as const };
  });
}

/* ───────── customers ───────── */

export async function updateUser(id: string, patch: { role?: Role; status?: UserStatus }): Promise<Result> {
  try {
    const me = await requireStaff();
    if (id === me.id) return { error: "You can’t change your own role or status." };
    if (patch.role && me.role !== "Admin") return { error: "Only admins can change roles." };
    const data: { role?: Role; status?: UserStatus } = {};
    if (patch.role && ["Customer", "Staff", "Admin"].includes(patch.role)) data.role = patch.role;
    if (patch.status && ["Active", "Blocked"].includes(patch.status)) data.status = patch.status;
    await db.user.update({ where: { id }, data });
    if (data.status === "Blocked") await db.session.deleteMany({ where: { userId: id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/* ───────── discounts ───────── */

export async function createPromo(input: { code: string; type: "pct" | "abs"; value: number }): Promise<Result> {
  return guard(async () => {
    const code = str(input.code, 30).toUpperCase().replace(/\s/g, "");
    const value = int(input.value);
    const type = input.type === "abs" ? "abs" : "pct";
    if (!code || !(value > 0)) return { error: "Enter a code and a value." };
    if (type === "pct" && value > 100) return { error: "A percentage can’t be more than 100." };
    if (await db.promoCode.findUnique({ where: { code } })) return { error: "That code already exists." };
    await db.promoCode.create({ data: { code, type, value } });
    refresh();
    return { ok: true as const };
  });
}

export async function togglePromo(code: string): Promise<Result> {
  return guard(async () => {
    const p = await db.promoCode.findUnique({ where: { code } });
    if (p) await db.promoCode.update({ where: { code }, data: { active: !p.active } });
    refresh();
    return { ok: true as const };
  });
}

export async function deletePromo(code: string): Promise<Result> {
  return guard(async () => {
    await db.promoCode.deleteMany({ where: { code } });
    refresh();
    return { ok: true as const };
  });
}

/* ───────── reviews ───────── */

export async function setReviewStatus(id: string, status: "Published" | "Hidden"): Promise<Result> {
  return guard(async () => {
    const r = await db.review.findUnique({ where: { id } });
    if (!r || r.status === status) return { ok: true as const };
    await db.review.update({ where: { id }, data: { status } });
    if (status === "Published") await shiftRating(r.bookId, r.stars, 1);
    else if (r.status === "Published") await shiftRating(r.bookId, r.stars, -1);
    refresh();
    return { ok: true as const };
  });
}

export async function deleteReview(id: string): Promise<Result> {
  return guard(async () => {
    const r = await db.review.findUnique({ where: { id } });
    if (!r) return { ok: true as const };
    await db.review.delete({ where: { id } });
    if (r.status === "Published") await shiftRating(r.bookId, r.stars, -1);
    refresh();
    return { ok: true as const };
  });
}

/* ───────── settings ───────── */

export async function saveSettings(input: {
  storeName: string; email: string; phone: string; address: string; std: number; exp: number; freeOver: number; lowAt: number;
  payments: { card: boolean; cod: boolean; wallet: boolean };
}): Promise<Result> {
  return guard(async () => {
    const data = {
      storeName: str(input.storeName, 80) || "AnyBook", email: str(input.email), phone: str(input.phone, 40), address: str(input.address, 300),
      std: int(input.std), exp: int(input.exp), freeOver: int(input.freeOver), lowAt: int(input.lowAt, 0, 1000),
      payCard: !!input.payments.card, payCod: !!input.payments.cod, payWallet: !!input.payments.wallet,
    };
    await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    refresh();
    return { ok: true as const };
  });
}
