"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Thumb } from "@/components/Cover";
import { ConfirmDelete } from "@/components/Dialog";
import { Seg } from "@/components/Seg";
import { fmt, plural } from "@/lib/format";
import { adjustStock, deleteBooks, setBooksStatus } from "@/app/actions/admin";
import { useAdmin, useRun } from "../AdminProvider";

type Filter = "all" | "pub" | "draft" | "low";

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { books, settings } = useAdmin();
  const lowAt = settings.lowAt;
  const { run, pending } = useRun();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const filter = (params.get("filter") ?? "all") as Filter;
  const [sel, setSel] = useState<string[]>([]);
  const [delId, setDelId] = useState<string | null>(null);
  const [bulkDel, setBulkDel] = useState(false);

  useEffect(() => setQuery(params.get("q") ?? ""), [params]);

  const setFilter = (f: Filter) => {
    const next = new URLSearchParams(params.toString());
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const isLow = (b: (typeof books)[number]) => b.stockNew <= lowAt;
  const aq = query.trim().toLowerCase();
  const list = books.filter(
    (b) =>
      (filter === "all" || (filter === "pub" && b.status === "Published") || (filter === "draft" && b.status === "Draft") || (filter === "low" && isLow(b))) &&
      (!aq || `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(aq)),
  );
  const allSel = list.length > 0 && list.every((b) => sel.includes(b.id));
  const delBook = delId ? books.find((b) => b.id === delId) : null;

  const bulk = (fn: () => Promise<{ ok?: boolean; error?: string }>, msg: string, clear = true) =>
    run(fn, msg).then((r) => r.ok && clear && setSel([]));

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <div className="text-muted num" style={{ fontSize: 13 }}>{list.length} of {plural(books.length, "product")}</div>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary" style={{ padding: "10px 18px" }}>+ Add product</Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-3)" }}>
        <input className="input" type="search" placeholder="Search by title, author or ISBN" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: "1 1 220px", maxWidth: 340 }} />
        <Seg<Filter> name="afilter" value={filter} onChange={setFilter} options={[["all", "All"], ["pub", "Published"], ["draft", "Drafts"], ["low", "Low stock"]]} />
      </div>

      {sel.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-2)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", animation: "abUp .3s var(--ease) both" }}>
          <span style={{ fontSize: 13, marginRight: "auto" }}>{plural(sel.length, "product")} selected</span>
          <button className="btn btn-secondary" onClick={() => bulk(() => setBooksStatus(sel, "Published"), "Products published")} style={{ padding: "5px 12px", fontSize: 13 }}>Publish</button>
          <button className="btn btn-secondary" onClick={() => bulk(() => setBooksStatus(sel, "Draft"), "Products set as draft")} style={{ padding: "5px 12px", fontSize: 13 }}>Set as draft</button>
          <button className="btn btn-secondary" onClick={() => bulk(() => adjustStock(sel, 10), "Stock updated", false)} style={{ padding: "5px 12px", fontSize: 13 }}>+10 stock</button>
          <button className="btn btn-ghost" onClick={() => setBulkDel(true)} style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Delete</button>
        </div>
      )}

      <div className="table-scroll">
        <table className="table" style={{ minWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                <input type="checkbox" className="cb" checked={allSel} aria-label="Select all" onChange={() => setSel(allSel ? [] : list.map((b) => b.id))} />
              </th>
              <th style={{ width: 52 }} />
              <th>Title</th><th>Category</th><th>Price</th><th>New stock</th><th>Used (VG / G)</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={9} className="text-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>No products match.</td></tr>
            )}
            {list.map((b) => {
              const on = sel.includes(b.id);
              const low = isLow(b);
              return (
                <tr key={b.id} className="fade-in" style={{ background: on ? "var(--color-accent-100)" : undefined }}>
                  <td><input type="checkbox" className="cb" checked={on} aria-label={`Select ${b.title}`} onChange={() => setSel(on ? sel.filter((i) => i !== b.id) : [...sel, b.id])} /></td>
                  <td><Thumb book={b} width={36} label={b.title[0]} /></td>
                  <td>
                    <Link href={`/admin/products/${b.id}`} className="plain hover-accent" style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-text)", textDecoration: "none" }}>{b.title}</Link>
                    <div className="text-muted" style={{ fontSize: 12, fontStyle: "italic" }}>{b.author}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{b.category}</td>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>
                    {fmt(b.priceNew)}
                    <div className="text-muted" style={{ fontSize: 11 }}>Used {fmt(b.priceGood)}–{b.priceVG.toLocaleString("en-US")}</div>
                  </td>
                  <td>
                    <div className="stepper" style={{ borderColor: low ? "var(--color-accent)" : undefined }}>
                      <button className="btn btn-icon" aria-label="Less" disabled={pending || b.stockNew === 0} onClick={() => run(() => adjustStock([b.id], -1))} style={{ width: 28, height: 28 }}>−</button>
                      <span key={b.stockNew} className="val pop" style={{ fontSize: 13, color: low ? "var(--color-accent-800)" : undefined, animationDuration: ".35s" }}>{b.stockNew}</span>
                      <button className="btn btn-icon" aria-label="More" disabled={pending} onClick={() => run(() => adjustStock([b.id], 1))} style={{ width: 28, height: 28 }}>+</button>
                    </div>
                  </td>
                  <td className="num" style={{ fontSize: 13 }}>{b.stockVG} / {b.stockGood}</td>
                  <td>
                    <button className={`tag tag-btn ${b.status === "Draft" ? "tag-neutral" : "tag-accent"}`} title="Click to toggle" onClick={() => run(() => setBooksStatus([b.id], b.status === "Draft" ? "Published" : "Draft"))}>
                      {b.status}
                    </button>
                  </td>
                  <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    <Link href={`/admin/products/${b.id}`} className="btn btn-ghost" style={{ fontSize: 13 }}>Edit</Link>
                    <button className="btn btn-ghost" onClick={() => setDelId(b.id)} style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {delBook && (
        <ConfirmDelete
          title={delBook.title}
          onCancel={() => setDelId(null)}
          onConfirm={() => {
            const id = delBook.id;
            setDelId(null);
            run(() => deleteBooks([id]), "Product deleted").then(() => setSel((s) => s.filter((i) => i !== id)));
          }}
        />
      )}
      {bulkDel && (
        <ConfirmDelete
          title={`${sel.length} ${sel.length === 1 ? "product" : "products"}`}
          onCancel={() => setBulkDel(false)}
          onConfirm={() => {
            setBulkDel(false);
            bulk(() => deleteBooks(sel), `${sel.length} deleted`);
          }}
        />
      )}
    </>
  );
}
