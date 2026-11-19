import "server-only";
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import type { Book, Collection, Me, Order, PromoCode, Review, Settings, User } from "./data";
import { PAY_NAMES } from "./data";
import { db } from "./db";
import { fmtDate } from "./format";
import { getUser } from "./auth";

/* ───────── mappers: DB rows → the plain shapes the UI uses ───────── */

type DbBook = Prisma.BookGetPayload<object>;
export const toBook = (b: DbBook): Book => ({
  id: b.id, title: b.title, author: b.author, category: b.category, isbn: b.isbn, year: b.year, pages: b.pages,
  description: b.description, priceNew: b.priceNew, priceVG: b.priceVG, priceGood: b.priceGood,
  stockNew: b.stockNew, stockVG: b.stockVG, stockGood: b.stockGood, coverImageUrl: b.coverImageUrl,
  coverTone: b.coverTone, status: b.status, rating: b.rating, reviewCount: b.reviewCount,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function relDate(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return fmtDate(d);
}

type DbReview = Prisma.ReviewGetPayload<object>;
export const toReview = (r: DbReview): Review => ({
  id: r.id, bookId: r.bookId, author: r.author, stars: r.stars, text: r.text, date: relDate(r.createdAt),
  status: r.status, copy: r.copy, createdAt: r.createdAt.toISOString(),
});

type DbOrder = Prisma.OrderGetPayload<{ include: { lines: true } }>;
export const toOrder = (o: DbOrder): Order => ({
  no: o.no, createdAt: o.createdAt.toISOString(), date: fmtDate(o.createdAt), userId: o.userId, customer: o.customerName,
  email: o.customerEmail, items: o.lines.reduce((n, l) => n + l.qty, 0), subtotal: o.subtotal, discount: o.discount,
  shipping: o.shipping, total: o.total, payment: PAY_NAMES[o.payment as keyof typeof PAY_NAMES] ?? o.payment,
  shipMethod: o.shipMethod, status: o.status,
  lines: o.lines.map((l) => ({ bookId: l.bookId, title: l.title, cond: l.cond, qty: l.qty, unit: l.unit })),
});

type DbSettings = Prisma.SettingsGetPayload<object>;
const toSettings = (s: DbSettings): Settings => ({
  storeName: s.storeName, email: s.email, phone: s.phone, address: s.address, std: s.std, exp: s.exp,
  freeOver: s.freeOver, lowAt: s.lowAt, payments: { card: s.payCard, cod: s.payCod, wallet: s.payWallet },
});

/* ───────── queries ───────── */

export const getSettings = cache(async (): Promise<Settings> => {
  const s = await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return toSettings(s);
});

export const getMe = cache(async (): Promise<Me | null> => {
  const u = await getUser();
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, street: u.street, city: u.city, zip: u.zip, role: u.role };
});

/** Everything the storefront chrome and listing pages need (drafts excluded). */
export async function getCatalog() {
  const [books, cols, settings, me] = await Promise.all([
    db.book.findMany({ where: { status: "Published" }, orderBy: { createdAt: "asc" } }),
    db.collection.findMany({ where: { status: "Live" }, include: { books: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "asc" } }),
    getSettings(),
    getMe(),
  ]);
  const collections: Collection[] = cols.map((c) => ({
    id: c.id, name: c.name, description: c.description, status: c.status, showOnHome: c.showOnHome, bookIds: c.books.map((b) => b.bookId),
  }));
  return { books: books.map(toBook), collections, settings, me };
}

export async function getBookPage(id: string) {
  const book = await db.book.findFirst({ where: { id, status: "Published" } });
  if (!book) return null;
  const reviews = await db.review.findMany({ where: { bookId: id, status: "Published" }, orderBy: { createdAt: "desc" }, take: 30 });
  return { book: toBook(book), reviews: reviews.map(toReview) };
}

export async function getMyOrders(userId: string) {
  const orders = await db.order.findMany({ where: { userId }, include: { lines: true }, orderBy: { createdAt: "desc" } });
  return orders.map(toOrder);
}

/** Everything the admin needs. Staff-only — callers must check access first. */
export async function getAdminData() {
  const [books, cols, orders, users, promos, reviews, settings] = await Promise.all([
    db.book.findMany({ orderBy: { createdAt: "desc" } }),
    db.collection.findMany({ include: { books: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "asc" } }),
    db.order.findMany({ include: { lines: true }, orderBy: { createdAt: "desc" } }),
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    db.review.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    getSettings(),
  ]);
  const orderDtos = orders.map(toOrder);
  const byUser = new Map<string, { orders: number; spent: number }>();
  for (const o of orderDtos) {
    if (!o.userId || o.status === "Cancelled") continue;
    const s = byUser.get(o.userId) ?? { orders: 0, spent: 0 };
    s.orders += 1;
    s.spent += o.total;
    byUser.set(o.userId, s);
  }
  const userDtos: User[] = users.map((u) => ({
    id: u.id, name: u.name, email: u.email, city: u.city, joined: `${MONTHS[u.createdAt.getMonth()]} ${u.createdAt.getFullYear()}`,
    role: u.role, status: u.status, orders: byUser.get(u.id)?.orders ?? 0, spent: byUser.get(u.id)?.spent ?? 0,
  }));
  const collections: Collection[] = cols.map((c) => ({
    id: c.id, name: c.name, description: c.description, status: c.status, showOnHome: c.showOnHome, bookIds: c.books.map((b) => b.bookId),
  }));
  const promoDtos: PromoCode[] = promos.map((p) => ({ code: p.code, type: p.type, value: p.value, uses: p.uses, active: p.active }));
  return { books: books.map(toBook), collections, orders: orderDtos, users: userDtos, promos: promoDtos, reviews: reviews.map(toReview), settings };
}

export type Catalog = Awaited<ReturnType<typeof getCatalog>>;
export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
