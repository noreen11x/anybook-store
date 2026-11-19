import type { Book, Condition } from "./data";

export const fmt = (n: number) => "EGP " + Math.round(n).toLocaleString("en-US");

export const priceOf = (b: Book, c: Condition) => (c === "new" ? b.priceNew : c === "vg" ? b.priceVG : b.priceGood);
export const stockOf = (b: Book, c: Condition) => (c === "new" ? b.stockNew : c === "vg" ? b.stockVG : b.stockGood);
export const hasUsed = (b: Book) => b.stockVG + b.stockGood > 0;
export const usedFrom = (b: Book) => (b.stockGood ? b.priceGood : b.priceVG);

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-");

export const initials = (name: string) => name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 3);

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

export const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const fmtDay = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
