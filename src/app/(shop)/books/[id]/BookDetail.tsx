"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Heart, Minus, Plus, Star, Truck } from "lucide-react";
import { BookGrid } from "@/components/BookCard";
import { Cover } from "@/components/Cover";
import { addReview } from "@/app/actions/shop";
import { useCatalog } from "@/components/CatalogProvider";
import { Book, CONDS, Condition, Review } from "@/lib/data";
import { fmt, hasUsed, priceOf, slugify, stars, stockOf, usedFrom } from "@/lib/format";
import { useStore } from "@/lib/store";

export function BookDetail({ book, reviews }: { book: Book; reviews: Review[] }) {
  const id = book.id;
  const router = useRouter();
  const { books, me } = useCatalog();
  const isFav = useStore((s) => s.favs.includes(id));
  const toggleFav = useStore((s) => s.toggleFav);
  const addToCart = useStore((s) => s.addToCart);
  const flash = useStore((s) => s.flash);
  const [posting, startPosting] = useTransition();
  const [rvErr, setRvErr] = useState("");

  const [sel, setSel] = useState<Condition>("new");
  const [qty, setQty] = useState(1);
  const [rvStars, setRvStars] = useState(5);
  const [rvText, setRvText] = useState("");

  // pick the first available copy when the book changes / stock changes
  useEffect(() => {
    if (!book) return;
    if (stockOf(book, sel) === 0) {
      const first = CONDS.find((c) => stockOf(book, c.k) > 0);
      if (first) setSel(first.k);
    }
  }, [book, sel]);
  useEffect(() => {
    setQty(1);
    setRvText("");
    setRvStars(5);
  }, [id]);

  const selC = CONDS.find((c) => c.k === sel)!;
  const selStock = stockOf(book, sel);
  const unit = priceOf(book, sel);
  const savings =
    sel === "new"
      ? hasUsed(book)
        ? `Or buy secondhand and save up to ${Math.round((1 - usedFrom(book) / book.priceNew) * 100)}%`
        : ""
      : `You save ${fmt((book.priceNew - unit) * qty)} vs new`;

  const d5 = Math.max(0, Math.round((book.rating - 3.6) * 60));
  const d4 = Math.max(8, 92 - d5 - 8);
  const dist: [string, number][] = [["5 star", d5], ["4 star", d4], ["3 star", 5], ["2 star", 2], ["1 star", 1]];

  const allReviews = reviews.map((r) => ({ key: r.id, who: r.author, txt: r.text, stars: stars(r.stars), when: r.date, copy: r.copy ?? "Verified purchase" }));

  const related = [
    ...books.filter((b) => b.category === book.category && b.id !== book.id),
    ...books.filter((b) => b.category !== book.category).sort((a, b) => b.rating - a.rating),
  ].slice(0, 4);

  const add = () => selStock > 0 && addToCart(book.id, sel, Math.min(qty, selStock), book.title);
  const ratingLabel = book.reviewCount ? book.rating.toFixed(1) : "New";

  return (
    <section key={book.id} className="enter" style={{ paddingTop: "var(--space-4)" }}>
      <nav aria-label="Breadcrumb" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", fontSize: 13, color: "var(--color-neutral-700)", paddingBottom: "var(--space-4)" }}>
        <Link href="/books" style={{ color: "inherit", textDecoration: "none" }}>Books</Link><span>/</span>
        <Link href={`/books?cat=${encodeURIComponent(book.category)}`} style={{ color: "inherit", textDecoration: "none" }}>{book.category}</Link><span>/</span>
        <span style={{ color: "var(--color-text)" }}>{book.title}</span>
      </nav>

      <div className="detail-grid">
        <div className="detail-cover cover-wrap">
          <Cover book={book} plateWidth={6} style={book.coverImageUrl ? { boxShadow: "var(--shadow-lg)" } : undefined} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <div>
            <div className="card-kicker">{book.category}</div>
            <h1 style={{ margin: "6px 0 4px", fontWeight: 400, fontSize: "clamp(38px, 4.6vw, 54px)" }}>{book.title}</h1>
            <div style={{ fontSize: 16, fontStyle: "italic" }}>
              by <Link href={`/authors/${slugify(book.author)}`} style={{ textUnderlineOffset: 3 }}>{book.author}</Link>
            </div>
          </div>

          <div className="num" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 13 }}>
            <div style={{ display: "flex", gap: 2 }} aria-label={`Rated ${ratingLabel} out of 5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={15} strokeWidth={1.4} stroke="var(--color-accent)" fill={i <= Math.round(book.rating) ? "var(--color-accent)" : "none"} />
              ))}
            </div>
            <span>{ratingLabel}</span>
            <span className="text-muted">· {book.reviewCount} reviews</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }} role="radiogroup" aria-label="Choose a copy">
            <h6 style={{ margin: 0 }}>Choose a copy</h6>
            {CONDS.map((c) => {
              const st = stockOf(book, c.k);
              const on = sel === c.k;
              const stockText =
                c.k === "new" && st > 5 ? "In stock" : c.k === "new" && st ? `Only ${st} left` : st ? `${st} ${st === 1 ? "copy" : "copies"} available` : "Sold out";
              return (
                <button key={c.k} role="radio" aria-checked={on} className={`cond-row${on ? " on" : ""}`} disabled={!st} onClick={() => setSel(c.k)}>
                  <span className="cond-dot" />
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14 }}>{c.label}</span>
                    <span className="text-muted" style={{ fontSize: 12 }}>{stockText}</span>
                  </span>
                  <span className="num" style={{ fontSize: 15 }}>{fmt(priceOf(book, c.k))}</span>
                </button>
              );
            })}
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-neutral-700)", fontStyle: "italic" }}>{selC.note}</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-divider)" }}>
            <div style={{ display: "flex", flexDirection: "column", marginRight: "auto" }}>
              <span key={unit * qty} className="num" style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1.1, animation: "abUp .4s var(--ease)" }}>{fmt(unit * qty)}</span>
              <span style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{savings}</span>
            </div>
            <div className="stepper">
              <button className="btn btn-icon" aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} strokeWidth={1.8} /></button>
              <span className="val" aria-live="polite">{qty}</span>
              <button className="btn btn-icon" aria-label="More" onClick={() => setQty((q) => Math.min(Math.max(1, selStock), q + 1))}><Plus size={14} strokeWidth={1.8} /></button>
            </div>
            <button className="btn btn-primary" onClick={add} disabled={!selStock} style={{ padding: "11px 22px", fontSize: 15 }}>
              {selStock ? "Add to basket" : "Sold out"}
            </button>
            <button className="btn btn-secondary btn-icon" aria-label={isFav ? "Remove from favourites" : "Add to favourites"} aria-pressed={isFav} onClick={() => toggleFav(book.id)} style={{ width: 42, height: 42 }}>
              {isFav ? <Heart key="on" className="pop" size={18} fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth={1.5} /> : <Heart key="off" size={18} strokeWidth={1.5} />}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 13, color: "var(--color-neutral-700)" }}>
            <Truck size={16} strokeWidth={1.5} />
            Delivered in 2–4 days in Cairo &amp; Giza · 3–6 days elsewhere
          </div>

          <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-4)" }}>
            {book.description && <p className="justify" style={{ margin: "0 0 var(--space-4)", fontSize: 16, lineHeight: 1.65 }}>{book.description}</p>}
            <table className="table" style={{ fontSize: 13 }}>
              <tbody>
                <tr><td className="text-muted" style={{ width: 140 }}>Published</td><td className="num">{book.year}</td></tr>
                <tr><td className="text-muted">Pages</td><td className="num">{book.pages || "—"}</td></tr>
                <tr><td className="text-muted">Binding</td><td>Hardcover</td></tr>
                <tr><td className="text-muted">ISBN</td><td className="num">{book.isbn || "—"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 64, borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-6)" }} className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h2 style={{ margin: 0, fontWeight: 400, fontSize: 36 }}>Reader reviews</h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
            <span className="num" style={{ fontFamily: "var(--font-heading)", fontSize: 56, lineHeight: 1 }}>{ratingLabel}</span>
            <span className="text-muted">out of 5 · {book.reviewCount} reviews</span>
          </div>
          {book.reviewCount > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dist.map(([label, pct]) => (
                <div key={label} className="num" style={{ display: "grid", gridTemplateColumns: "44px 1fr 36px", alignItems: "center", gap: "var(--space-2)", fontSize: 12 }}>
                  <span>{label}</span>
                  <span className="dist-bar"><span style={{ width: `${pct}%` }} /></span>
                  <span className="text-muted" style={{ textAlign: "right" }}>{pct}%</span>
                </div>
              ))}
            </div>
          )}
          <form
            className="card"
            style={{ marginTop: "var(--space-3)", gap: "var(--space-3)" }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!rvText.trim()) return;
              startPosting(async () => {
                const r = await addReview({ bookId: book.id, stars: rvStars, text: rvText.trim() });
                if (!r.ok) return setRvErr(r.error);
                setRvErr("");
                setRvText("");
                flash("Thanks — your review is posted");
                router.refresh();
              });
            }}
          >
            <div className="card-title">Write a review</div>
            <div style={{ display: "flex", gap: 4 }} role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" className="star-pick" role="radio" aria-checked={rvStars === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRvStars(i)}>
                  <Star size={22} strokeWidth={1.4} stroke="var(--color-accent)" fill={i <= rvStars ? "var(--color-accent)" : "none"} />
                </button>
              ))}
            </div>
            {me ? (
              <>
                <textarea className="input" placeholder="What did you think?" aria-label="Your review" maxLength={2000} value={rvText} onChange={(e) => setRvText(e.target.value)} />
                {rvErr && <div role="alert" style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{rvErr}</div>}
                <button className="btn btn-primary" disabled={!rvText.trim() || posting} style={{ alignSelf: "flex-start" }}>{posting ? "Posting…" : "Post review"}</button>
              </>
            ) : (
              <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
                <Link href={`/account?next=${encodeURIComponent(`/books/${book.id}`)}`}>Sign in</Link> to write a review.
              </p>
            )}
          </form>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {allReviews.length === 0 && <p className="text-muted">No reviews yet — be the first.</p>}
          {allReviews.map((rv) => (
            <article key={rv.key} className="row-hover" style={{ padding: "var(--space-4) var(--space-2)", borderBottom: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: 6, animation: "abUp .6s var(--ease) both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{rv.who}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{rv.when}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 12, color: "var(--color-accent-700)" }}>
                <span aria-hidden>{rv.stars}</span>
                <span className="text-muted">· {rv.copy}</span>
              </div>
              <p className="justify" style={{ margin: 0, fontSize: 14 }}>{rv.txt}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 64, borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-6)" }}>
        <h2 style={{ margin: "0 0 var(--space-6)", fontWeight: 400, fontSize: 36 }}>Readers also bought</h2>
        <BookGrid books={related} />
      </section>

      <div className="buy-bar" style={{ margin: "var(--space-6) calc(var(--space-4) * -1) -72px" }}>
        <div style={{ display: "flex", flexDirection: "column", marginRight: "auto", lineHeight: 1.2 }}>
          <span className="num" style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{fmt(unit * qty)}</span>
          <span className="text-muted" style={{ fontSize: 11 }}>{selC.label}</span>
        </div>
        <button className="btn btn-primary" onClick={add} disabled={!selStock} style={{ padding: "11px 20px", fontSize: 15, background: "var(--color-bg)" }}>
          Add to basket
        </button>
      </div>
    </section>
  );
}
