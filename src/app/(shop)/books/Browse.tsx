"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { BookGrid } from "@/components/BookCard";
import { Chips, Radios, Seg } from "@/components/Seg";
import { CATS } from "@/lib/data";
import { hasUsed, plural } from "@/lib/format";
import { usePublished } from "@/components/CatalogProvider";

type Sort = "featured" | "new" | "lo" | "hi" | "rated";
type Cond = "any" | "new" | "used";
type Price = "any" | "lo" | "mid" | "hi";
const SORTS: [Sort, string][] = [["featured", "Featured"], ["new", "Newest"], ["lo", "Price ↑"], ["hi", "Price ↓"], ["rated", "Top rated"]];

export function Browse() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const books = usePublished();
  const [showFilters, setShowFilters] = useState(false);

  const cat = params.get("cat") ?? "All";
  const cond = (params.get("cond") ?? "any") as Cond;
  const price = (params.get("price") ?? "any") as Price;
  const sort = (params.get("sort") ?? "featured") as Sort;
  const query = params.get("q") ?? "";
  const q = query.trim().toLowerCase();

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "any" || v === "All" || v === "featured" || v === "") next.delete(k);
      else next.set(k, v);
    }
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const priceOK = (p: number) => price === "any" || (price === "lo" ? p < 300 : price === "mid" ? p >= 300 && p <= 600 : p > 600);
  let list = books.filter(
    (b) =>
      (cat === "All" || b.category === cat) &&
      (cond !== "used" || hasUsed(b)) &&
      (cond !== "new" || b.stockNew > 0) &&
      priceOK(b.priceNew) &&
      (!q || `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(q)),
  );
  if (sort === "lo") list = [...list].sort((a, b) => a.priceNew - b.priceNew);
  if (sort === "hi") list = [...list].sort((a, b) => b.priceNew - a.priceNew);
  if (sort === "rated") list = [...list].sort((a, b) => b.rating - a.rating);
  if (sort === "new") list = [...list].sort((a, b) => b.year - a.year);

  const title = q ? `Results for “${query.trim()}”` : cond === "used" ? "Secondhand books" : cat === "All" ? "All books" : cat;
  const count = (c: string) => books.filter((b) => c === "All" || b.category === c).length;
  const activeFilters = (cond !== "any" ? 1 : 0) + (price !== "any" ? 1 : 0);

  return (
    <section className="enter" style={{ paddingTop: "var(--space-6)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--color-divider)" }}>
        <div>
          <div className="text-muted num" style={{ fontSize: 13 }}>{plural(list.length, "title")}</div>
          <h1 className="browse-title">{title}</h1>
        </div>
        <div className="desk-only">
          <Seg<Sort>
            name="sort"
            value={sort}
            onChange={(v) => set({ sort: v })}
            options={SORTS}
          />
        </div>
      </div>

      {/* Mobile toolbar: subject chips, filters toggle, sort select */}
      <div className="mob-only mob-toolbar">
        <div className="chip-scroll" role="group" aria-label="Subject">
          {["All", ...CATS].map((c) => (
            <button key={c} type="button" className={`chip${cat === c ? " on" : ""}`} aria-pressed={cat === c} onClick={() => set({ cat: c })}>
              {c === "All" ? "All" : c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            type="button"
            className={`btn btn-secondary${activeFilters ? " filters-on" : ""}`}
            aria-expanded={showFilters}
            aria-controls="mob-filters"
            onClick={() => setShowFilters((v) => !v)}
            style={{ flex: 1, minHeight: 40 }}
          >
            <SlidersHorizontal size={15} strokeWidth={1.6} />
            Filters{activeFilters ? ` · ${activeFilters}` : ""}
          </button>
          <label className="sort-select">
            <span className="sr-only">Sort by</span>
            <select className="input" value={sort} onChange={(e) => set({ sort: e.target.value })}>
              {SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <ChevronDown size={15} strokeWidth={1.6} aria-hidden />
          </label>
        </div>
        {showFilters && (
          <div id="mob-filters" className="card mob-filters">
            <div className="field">
              <label>Condition</label>
              <Chips<Cond> value={cond} onChange={(v) => set({ cond: v })} options={[["any", "New & used"], ["new", "New"], ["used", "Secondhand"]]} />
            </div>
            <div className="field">
              <label>Price</label>
              <Chips<Price> value={price} onChange={(v) => set({ price: v })} options={[["any", "Any"], ["lo", "Under 300"], ["mid", "300–600"], ["hi", "Over 600"]]} />
            </div>
            {activeFilters > 0 && (
              <button type="button" className="btn btn-ghost" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => set({ cond: null, price: null })}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="browse-body">
        <aside className="filters desk-only" aria-label="Filters">
          <div>
            <h6 style={{ margin: "0 0 var(--space-2)" }}>Subject</h6>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {["All", ...CATS].map((c) => (
                <button key={c} className={`side-cat slide-hover${cat === c ? " on" : ""}`} onClick={() => set({ cat: c })}>
                  <span>{c === "All" ? "All subjects" : c}</span>
                  <span className="text-muted num">{count(c)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h6 style={{ margin: "0 0 var(--space-2)" }}>Condition</h6>
            <Radios<Cond> name="cond" value={cond} onChange={(v) => set({ cond: v })} options={[["any", "New & used"], ["new", "New"], ["used", "Secondhand"]]} />
          </div>
          <div>
            <h6 style={{ margin: "0 0 var(--space-2)" }}>Price</h6>
            <Radios<Price>
              name="price"
              value={price}
              onChange={(v) => set({ price: v })}
              options={[["any", "Any price"], ["lo", "Under EGP 300"], ["mid", "EGP 300–600"], ["hi", "Over EGP 600"]]}
            />
          </div>
        </aside>
        <div style={{ flex: "999 1 480px", minWidth: 0 }}>
          {list.length === 0 ? (
            <div className="empty">
              <h3>No books match those filters.</h3>
              <button className="btn btn-secondary" onClick={() => router.replace(pathname, { scroll: false })}>Clear filters</button>
            </div>
          ) : (
            <BookGrid books={list} />
          )}
        </div>
      </div>
    </section>
  );
}
