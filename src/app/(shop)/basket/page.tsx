"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { BookGrid } from "@/components/BookCard";
import { Thumb } from "@/components/Cover";
import { SummaryRows } from "@/components/OrderSummary";
import { fmt } from "@/lib/format";
import { usePublished } from "@/components/CatalogProvider";
import { useStore } from "@/lib/store";
import { checkPromo } from "@/app/actions/shop";
import { useBasket } from "@/lib/totals";

export default function BasketPage() {
  const t = useBasket("std");
  const books = usePublished();
  const setQty = useStore((s) => s.setQty);
  const removeLine = useStore((s) => s.removeLine);
  const moveToFavs = useStore((s) => s.moveToFavs);
  const setPromo = useStore((s) => s.setPromo);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const inCart = new Set(t.lines.map((l) => l.bookId));
  const recs = books.filter((b) => !inCart.has(b.id)).sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <section className="enter" style={{ paddingTop: "var(--space-8)" }}>
      <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Your basket</h1>
      {t.lines.length === 0 ? (
        <div className="empty" style={{ borderTop: "1px solid var(--color-divider)" }}>
          <h3>Your basket is empty.</h3>
          <Link href="/books" className="btn btn-primary">Browse books</Link>
        </div>
      ) : (
        <>
          {(t.unavailable > 0 || t.stockIssues.length > 0) && (
            <div role="alert" style={{ border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-4)", fontSize: 14, color: "var(--color-accent-800)" }}>
              {t.unavailable > 0 && <div>{t.unavailable === 1 ? "One item is" : `${t.unavailable} items are`} no longer available and {t.unavailable === 1 ? "was" : "were"} left out.</div>}
              {t.stockIssues.map((l) => (
                <div key={l.key}>{l.stock ? `Only ${l.stock} of “${l.book.title}” (${l.condLabel}) left — please lower the quantity.` : `“${l.book.title}” (${l.condLabel}) is sold out — please remove it.`}</div>
              ))}
            </div>
          )}
          <div className="two-col">
            <div className="main" style={{ borderTop: "1px solid var(--color-divider)" }}>
              {t.lines.map((l) => (
                <div key={l.key} className="line row-hover">
                  <Link href={`/books/${l.bookId}`} aria-label={l.book.title}><Thumb book={l.book} /></Link>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 160 }}>
                      <Link href={`/books/${l.bookId}`} style={{ fontFamily: "var(--font-heading)", fontSize: 21, color: "var(--color-text)", textDecoration: "none" }}>{l.book.title}</Link>
                      <span className="text-muted" style={{ fontSize: 13, fontStyle: "italic" }}>{l.book.author}</span>
                      <span className="num" style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{l.condLabel} · {fmt(l.unit)} each</span>
                      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-1)" }}>
                        <button className="btn btn-ghost" onClick={() => moveToFavs(l.key)} style={{ fontSize: 13, padding: "2px 4px" }}>Move to favourites</button>
                        <button className="btn btn-ghost" onClick={() => removeLine(l.key)} style={{ fontSize: 13, padding: "2px 4px", color: "var(--color-neutral-700)" }}>Remove</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                      <div className="stepper">
                        <button className="btn btn-icon" aria-label="Fewer" onClick={() => setQty(l.key, -1)} style={{ width: 32, height: 32 }}><Minus size={13} strokeWidth={1.8} /></button>
                        <span className="val" style={{ minWidth: 20, fontSize: 14 }}>{l.qty}</span>
                        <button className="btn btn-icon" aria-label="More" onClick={() => setQty(l.key, 1)} style={{ width: 32, height: 32 }}><Plus size={13} strokeWidth={1.8} /></button>
                      </div>
                      <span key={l.total} className="num fade-in" style={{ minWidth: 90, textAlign: "right" }}>{fmt(l.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="card side" style={{ padding: "var(--space-6)", gap: "var(--space-3)", position: "sticky", top: 140 }}>
              <div className="card-title" style={{ fontSize: 24 }}>Order summary</div>
              <SummaryRows t={t} />
              <div className="text-muted" style={{ fontSize: 12 }}>{t.freeHint}</div>
              <form
                style={{ display: "flex", gap: "var(--space-2)" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  checkPromo(code).then((r) => {
                    if (r.ok) {
                      setPromo({ code: r.code, type: r.type, value: r.value });
                      setMsg(`Code ${r.code} applied.`);
                    } else setMsg(r.error);
                  });
                }}
              >
                <input className="input" placeholder="Promo code" aria-label="Promo code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button className="btn btn-secondary">Apply</button>
              </form>
              {msg && <div role="status" style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{msg}</div>}
              <div className="total-row">
                <span>Total</span>
                <span key={t.total} style={{ animation: "abUp .4s var(--ease)" }}>{fmt(t.total)}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary btn-block" style={{ padding: 12, fontSize: 15 }}>Checkout</Link>
              <div className="text-muted" style={{ fontSize: 12, textAlign: "center" }}>Try codes READ10 or WELCOME50</div>
            </aside>
          </div>
          {recs.length > 0 && (
            <section style={{ marginTop: 64, borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-6)" }}>
              <h2 style={{ margin: "0 0 var(--space-6)", fontWeight: 400, fontSize: 32 }}>You might also like</h2>
              <BookGrid books={recs} />
            </section>
          )}
        </>
      )}
    </section>
  );
}
