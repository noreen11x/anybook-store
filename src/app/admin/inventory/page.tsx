"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setStock } from "@/app/actions/admin";
import type { Book } from "@/lib/data";
import { useAdmin, useRun } from "../AdminProvider";

type Field = "stockNew" | "stockVG" | "stockGood";
const LABEL: Record<Field, string> = { stockNew: "new", stockVG: "very good", stockGood: "good" };

/** Edits locally; saves to the database on blur or Enter. */
function StockCell({ book, field, low }: { book: Book; field: Field; low?: boolean }) {
  const { run } = useRun();
  const [v, setV] = useState(String(book[field]));
  const [saving, setSaving] = useState(false);
  useEffect(() => setV(String(book[field])), [book, field]);
  const commit = () => {
    const n = Math.max(0, parseInt(v, 10) || 0);
    setV(String(n));
    if (n === book[field]) return;
    setSaving(true);
    run(() => setStock(book.id, field, n), `Saved ${book.title} (${LABEL[field]}: ${n})`).finally(() => setSaving(false));
  };
  return (
    <input
      className="input num"
      type="number"
      min={0}
      inputMode="numeric"
      aria-label={`${book.title} ${LABEL[field]} copies`}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      style={{ minHeight: 30, padding: "3px 8px", borderColor: low ? "var(--color-accent)" : undefined, opacity: saving ? 0.6 : 1 }}
    />
  );
}

export default function InventoryPage() {
  const { books, settings } = useAdmin();
  const lowAt = settings.lowAt;
  const units = books.reduce((n, b) => n + b.stockNew + b.stockVG + b.stockGood, 0);
  const lowN = books.filter((b) => b.stockNew <= lowAt).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Inventory</h1>
          <div className="text-muted num" style={{ fontSize: 13 }}>{units} copies on hand · {lowN} low on stock · changes save automatically</div>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: "var(--space-4)" }}>Product</th><th>ISBN / SKU</th>
              <th style={{ width: 110 }}>New</th><th style={{ width: 110 }}>Very good</th><th style={{ width: 110 }}>Good</th>
              <th style={{ textAlign: "right", paddingRight: "var(--space-4)" }}>On hand</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td style={{ paddingLeft: "var(--space-4)" }}>
                  <Link href={`/admin/products/${b.id}`} style={{ fontFamily: "var(--font-heading)", fontSize: 17, color: "var(--color-text)", textDecoration: "none" }}>{b.title}</Link>
                  <div className="text-muted" style={{ fontSize: 12, fontStyle: "italic" }}>{b.author}</div>
                </td>
                <td className="num" style={{ fontSize: 12 }}>{b.isbn || "—"}</td>
                <td><StockCell book={b} field="stockNew" low={b.stockNew <= lowAt} /></td>
                <td><StockCell book={b} field="stockVG" /></td>
                <td><StockCell book={b} field="stockGood" /></td>
                <td className="num" style={{ textAlign: "right", paddingRight: "var(--space-4)" }}>{b.stockNew + b.stockVG + b.stockGood}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
