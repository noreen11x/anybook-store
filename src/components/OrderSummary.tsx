"use client";

import { fmt } from "@/lib/format";
import type { useBasket } from "@/lib/totals";

type Basket = ReturnType<typeof useBasket>;

export function SummaryRows({ t }: { t: Basket }) {
  return (
    <>
      <div className="sum-row"><span>Subtotal</span><span>{fmt(t.subtotal)}</span></div>
      {t.discount > 0 && (
        <div className="sum-row" style={{ color: "var(--color-accent-700)" }}>
          <span>Promo {t.promoCode}</span><span>− {fmt(t.discount)}</span>
        </div>
      )}
      <div className="sum-row"><span>Delivery</span><span>{t.shipping === 0 ? "Free" : fmt(t.shipping)}</span></div>
    </>
  );
}
