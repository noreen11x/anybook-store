"use client";

import { useCatalog } from "@/components/CatalogProvider";
import { CONDS, ShipMethod } from "./data";
import { fmt, priceOf, stockOf } from "./format";
import { useStore } from "./store";

/** Basket lines + pricing rules (README "Business rules"). The server re-checks all of this at checkout. */
export function useBasket(ship: ShipMethod = "std") {
  const cart = useStore((s) => s.cart);
  const promo = useStore((s) => s.promo);
  const { books, settings } = useCatalog();

  const lines = cart.flatMap((l) => {
    const book = books.find((b) => b.id === l.bookId);
    if (!book) return [];
    const unit = priceOf(book, l.cond);
    const stock = stockOf(book, l.cond);
    return [{ ...l, book, unit, stock, total: unit * l.qty, condLabel: CONDS.find((c) => c.k === l.cond)!.label }];
  });
  const unavailable = cart.length - lines.length;

  const subtotal = lines.reduce((t, l) => t + l.total, 0);
  const discount = promo ? Math.round(promo.type === "pct" ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal)) : 0;
  const afterDisc = subtotal - discount;
  const freeStd = afterDisc >= settings.freeOver;
  const shipping = !lines.length ? 0 : ship === "exp" ? settings.exp : freeStd ? 0 : settings.std;
  const total = afterDisc + shipping;
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const stockIssues = lines.filter((l) => l.qty > l.stock);

  return {
    lines, count, subtotal, discount, shipping, total, freeStd, unavailable, stockIssues,
    promoCode: promo?.code ?? null,
    freeHint: freeStd ? "You qualify for free standard delivery." : `Add ${fmt(settings.freeOver - afterDisc)} more for free delivery.`,
    settings,
  };
}
