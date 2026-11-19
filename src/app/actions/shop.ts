"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { createSession, destroySession, getUser, requireUser } from "@/lib/auth";
import { CITIES, Condition, PayMethod, ShipMethod } from "@/lib/data";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSettings } from "@/lib/queries";

export type Result<T = object> = ({ ok: true } & T) | { ok?: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (s: unknown, max = 200) => String(s ?? "").trim().slice(0, max);

/* ───────── accounts ───────── */

export async function signIn(input: { email: string; password: string }): Promise<Result> {
  const email = clean(input.email).toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(String(input.password ?? ""), user.passwordHash))) return { error: "That email and password don’t match." };
  if (user.status === "Blocked") return { error: "This account has been suspended. Please contact us." };
  await createSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<Result> {
  const name = clean(input.name, 80);
  const email = clean(input.email).toLowerCase();
  const password = String(input.password ?? "");
  if (!name) return { error: "Please enter your name." };
  if (!EMAIL.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.passwordHash) return { error: "An account with that email already exists — try signing in." };
  const passwordHash = await hashPassword(password);
  // A guest who ordered before keeps their history when they register.
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { name, passwordHash } })
    : await db.user.create({ data: { name, email, passwordHash } });
  await db.order.updateMany({ where: { customerEmail: email, userId: null }, data: { userId: user.id } });
  await createSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  await destroySession();
  revalidatePath("/", "layout");
}

export async function updateProfile(input: { name: string; phone: string; street: string; city: string; zip: string }): Promise<Result> {
  const u = await requireUser();
  const name = clean(input.name, 80);
  if (!name) return { error: "Name can’t be empty." };
  await db.user.update({
    where: { id: u.id },
    data: { name, phone: clean(input.phone, 40), street: clean(input.street), city: clean(input.city, 60), zip: clean(input.zip, 20) },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(input: { current: string; next: string }): Promise<Result> {
  const u = await requireUser();
  if (!(await verifyPassword(String(input.current ?? ""), u.passwordHash))) return { error: "Your current password isn’t right." };
  if (String(input.next ?? "").length < 8) return { error: "Use a new password of at least 8 characters." };
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(input.next) } });
  return { ok: true };
}

/* ───────── basket & checkout ───────── */

export async function checkPromo(code: string): Promise<Result<{ code: string; type: "pct" | "abs"; value: number }>> {
  const c = clean(code, 40).toUpperCase();
  if (!c) return { error: "" };
  const p = await db.promoCode.findUnique({ where: { code: c } });
  if (!p || !p.active) return { error: "That code isn’t valid." };
  return { ok: true, code: p.code, type: p.type, value: p.value };
}

interface PlaceOrderInput {
  lines: { bookId: string; cond: Condition; qty: number }[];
  address: { name: string; phone: string; email: string; street: string; city: string; zip: string };
  ship: ShipMethod;
  pay: PayMethod;
  promo: string | null;
}

const STOCK_FIELD = { new: "stockNew", vg: "stockVG", good: "stockGood" } as const;
const PRICE_FIELD = { new: "priceNew", vg: "priceVG", good: "priceGood" } as const;
const COND_LABEL = { new: "New", vg: "Used · Very good", good: "Used · Good" } as const;

class CheckoutError extends Error {}

export async function placeOrder(input: PlaceOrderInput): Promise<Result<{ no: string }>> {
  const a = input.address;
  const addr = {
    name: clean(a.name, 80), phone: clean(a.phone, 40), email: clean(a.email).toLowerCase(),
    street: clean(a.street), city: CITIES.includes(a.city) ? a.city : "Cairo", zip: clean(a.zip, 20),
  };
  if (!addr.name || !addr.phone || !addr.street || !EMAIL.test(addr.email)) return { error: "Please complete your delivery details." };
  const ship: ShipMethod = input.ship === "exp" ? "exp" : "std";
  const settings = await getSettings();
  const payOk = { card: settings.payments.card, cod: settings.payments.cod, wallet: settings.payments.wallet }[input.pay];
  if (!payOk) return { error: "That payment method isn’t available right now." };

  // merge duplicate lines, sanitise quantities
  const merged = new Map<string, { bookId: string; cond: Condition; qty: number }>();
  for (const l of input.lines ?? []) {
    if (!["new", "vg", "good"].includes(l.cond)) continue;
    const qty = Math.min(50, Math.max(1, Math.floor(Number(l.qty) || 0)));
    const k = `${l.bookId}|${l.cond}`;
    const prev = merged.get(k);
    merged.set(k, { bookId: String(l.bookId), cond: l.cond, qty: (prev?.qty ?? 0) + qty });
  }
  const lines = [...merged.values()];
  if (!lines.length) return { error: "Your basket is empty." };

  const user = await getUser();
  try {
    const order = await db.$transaction(async (tx) => {
      const books = await tx.book.findMany({ where: { id: { in: lines.map((l) => l.bookId) }, status: "Published" } });
      const priced = lines.map((l) => {
        const b = books.find((x) => x.id === l.bookId);
        if (!b) throw new CheckoutError("A book in your basket is no longer available. Please review your basket.");
        return { ...l, book: b, unit: b[PRICE_FIELD[l.cond]] };
      });
      // reserve stock — the guarded update fails if someone else bought the last copy first
      for (const l of priced) {
        const field = STOCK_FIELD[l.cond];
        const r = await tx.book.updateMany({ where: { id: l.bookId, [field]: { gte: l.qty } }, data: { [field]: { decrement: l.qty } } });
        if (r.count !== 1) {
          const left = l.book[field];
          throw new CheckoutError(
            left > 0
              ? `Only ${left} ${left === 1 ? "copy" : "copies"} of “${l.book.title}” (${COND_LABEL[l.cond]}) left — please lower the quantity.`
              : `“${l.book.title}” (${COND_LABEL[l.cond]}) just sold out — please remove it from your basket.`,
          );
        }
      }
      const subtotal = priced.reduce((t, l) => t + l.unit * l.qty, 0);
      let discount = 0;
      let promoCode: string | null = null;
      if (input.promo) {
        const p = await tx.promoCode.findUnique({ where: { code: clean(input.promo, 40).toUpperCase() } });
        if (p?.active) {
          discount = Math.round(p.type === "pct" ? (subtotal * p.value) / 100 : Math.min(p.value, subtotal));
          promoCode = p.code;
          await tx.promoCode.update({ where: { code: p.code }, data: { uses: { increment: 1 } } });
        }
      }
      const shipping = ship === "exp" ? settings.exp : subtotal - discount >= settings.freeOver ? 0 : settings.std;
      const last = await tx.order.findFirst({ orderBy: { createdAt: "desc" }, select: { no: true } });
      let n = (parseInt(last?.no.slice(3) ?? "20000", 10) || 20000) + 1;
      while (await tx.order.findUnique({ where: { no: `AB-${n}` }, select: { id: true } })) n++;
      return tx.order.create({
        data: {
          no: `AB-${n}`, userId: user?.id ?? null, customerName: addr.name, customerEmail: user?.email ?? addr.email, phone: addr.phone,
          street: addr.street, city: addr.city, zip: addr.zip, shipMethod: ship, payment: input.pay,
          subtotal, discount, shipping, total: subtotal - discount + shipping, promoCode,
          lines: { create: priced.map((l) => ({ bookId: l.bookId, title: l.book.title, author: l.book.author, cond: l.cond, qty: l.qty, unit: l.unit })) },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // remember the address for next time
    if (user && !user.street) {
      await db.user.update({ where: { id: user.id }, data: { phone: addr.phone, street: addr.street, city: addr.city, zip: addr.zip } });
    }
    // lets a guest see their own confirmation page
    const jar = await cookies();
    const mine = (jar.get("ab_orders")?.value ?? "").split(",").filter(Boolean).slice(-9);
    jar.set("ab_orders", [...mine, order.no].join(","), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    revalidatePath("/", "layout");
    return { ok: true, no: order.no };
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") return { error: "The shop was busy — please try again." };
    throw e;
  }
}

/* ───────── reviews & newsletter ───────── */

export async function addReview(input: { bookId: string; stars: number; text: string }): Promise<Result> {
  const u = await getUser();
  if (!u) return { error: "Please sign in to write a review." };
  const stars = Math.min(5, Math.max(1, Math.round(Number(input.stars) || 5)));
  const text = clean(input.text, 2000);
  if (text.length < 3) return { error: "Please write a few words." };
  const book = await db.book.findFirst({ where: { id: input.bookId, status: "Published" } });
  if (!book) return { error: "That book isn’t available." };
  const bought = await db.orderLine.findFirst({ where: { bookId: book.id, order: { userId: u.id, status: { not: "Cancelled" } } } });
  const n = book.reviewCount + 1;
  await db.$transaction([
    db.review.create({ data: { bookId: book.id, userId: u.id, author: u.name, stars, text, status: "Published", copy: bought ? "Verified purchase" : "Reader review" } }),
    db.book.update({ where: { id: book.id }, data: { reviewCount: n, rating: (book.rating * book.reviewCount + stars) / n } }),
  ]);
  revalidatePath(`/books/${book.id}`);
  return { ok: true };
}

export async function subscribe(email: string): Promise<Result> {
  const e = clean(email).toLowerCase();
  if (!EMAIL.test(e)) return { error: "Please enter a valid email." };
  await db.subscriber.upsert({ where: { email: e }, update: {}, create: { email: e } });
  return { ok: true };
}
