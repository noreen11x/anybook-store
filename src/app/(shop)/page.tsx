"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Check, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { BookGrid } from "@/components/BookCard";
import { Cover } from "@/components/Cover";
import { ShelfArt } from "@/components/ShelfArt";
import { CATS } from "@/lib/data";
import { fmt } from "@/lib/format";
import { useCatalog, usePublished } from "@/components/CatalogProvider";
import { subscribe } from "@/app/actions/shop";
import { useStore } from "@/lib/store";

const READERS: [string, string][] = [
  ["NA", "var(--color-accent-200)"],
  ["OK", "var(--color-neutral-200)"],
  ["SM", "var(--color-accent-100)"],
  ["HS", "var(--color-accent-300)"],
];

export default function HomePage() {
  const books = usePublished();
  const { collections, settings: { freeOver } } = useCatalog();

  const byId = (id: string) => books.find((b) => b.id === id);
  const heroBooks = ["b9", "b2", "b5"].map(byId).filter((b): b is NonNullable<typeof b> => !!b);
  const newArrivals = books.filter((b) => b.year >= 2025).slice(0, 4);
  const bestsellers = [...books].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6);
  const homeCollections = collections
    .filter((c) => c.showOnHome && c.status === "Live")
    .map((c) => ({ ...c, books: c.bookIds.map(byId).filter((b): b is NonNullable<typeof b> => !!b) }))
    .filter((c) => c.books.length);

  const trust = [
    { title: "Free delivery", sub: `On orders over ${fmt(+freeOver)}`, Icon: Truck },
    { title: "Easy returns", sub: "14 days, no fuss", Icon: RotateCcw },
    { title: "Secure checkout", sub: "Card, wallet or cash", Icon: ShieldCheck },
    { title: "Graded secondhand", sub: "Checked page by page", Icon: BadgeCheck },
  ];

  return (
    <div className="enter">
      <section className="hero" aria-label="Welcome">
        <div className="hero-text">
          <h6 className="kicker" style={{ animation: "abUp .7s var(--ease) .05s both" }}>New &amp; secondhand books · Cairo</h6>
          <h1 style={{ animation: "abUp .8s var(--ease) .15s both" }}>
            Every book, <em>new or well&#8209;read.</em>
          </h1>
          <p className="justify" style={{ margin: 0, maxWidth: 480, fontSize: 16, color: "var(--color-neutral-800)", animation: "abUp .8s var(--ease) .28s both" }}>
            New releases at publisher price and hand-graded secondhand copies for less — delivered anywhere in Egypt.
          </p>
          <div className="hero-ctas" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", animation: "abUp .8s var(--ease) .4s both" }}>
            <Link href="/books" className="btn btn-primary" style={{ padding: "13px 22px", fontSize: 15 }}>Browse the shop →</Link>
            <Link href="/books?cond=used" className="btn btn-secondary" style={{ padding: "13px 22px", fontSize: 15 }}>Shop secondhand</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", animation: "abUp .8s var(--ease) .5s both" }}>
            <div style={{ display: "flex", paddingLeft: 5 }}>
              {READERS.map(([i, bg]) => (
                <span key={i} style={{ width: 30, height: 30, marginLeft: -5, borderRadius: "50%", border: "1px solid var(--color-accent-400)", boxShadow: "0 0 0 2px var(--color-bg)", background: bg, display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--color-accent-900)" }}>
                  {i}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <span style={{ color: "var(--color-accent)", letterSpacing: 2, fontSize: 12 }} aria-hidden>★★★★★</span>
              <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>Loved by 12,000+ readers in Egypt</span>
            </div>
          </div>
        </div>
        <div className="hero-visual" style={{ animation: "abUp .9s var(--ease) .1s both" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
            <ShelfArt rows={3} seed={3} />
          </div>
          <div className="hero-covers">
            {heroBooks.map((b, i) => {
              const delay = `${0.25 + i * 0.15}s`;
              return (
                <Link
                  key={b.id}
                  href={`/books/${b.id}`}
                  className="hero-cover cover-wrap"
                  aria-label={b.title}
                  style={{ flex: `0 0 ${i === 1 ? "34%" : "28%"}`, marginBottom: i === 1 ? 28 : 0, animation: `abUp 1s var(--ease) ${delay} both` }}
                >
                  <div style={{ animation: `abFloat 6s ease-in-out ${delay} infinite` }}>
                    <Cover book={b} />
                  </div>
                </Link>
              );
            })}
          </div>
          <Link href="/books?sort=new" className="hero-badge">
            <span style={{ fontSize: 20 }}>New</span>
            <span style={{ fontSize: 15, fontStyle: "italic" }}>arrivals</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 3 }}>this week</span>
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 56 }} aria-label="Why AnyBook">
        <div className="card elev-sm trust" style={{ animation: "abUp .7s var(--ease) .3s both" }}>
          {trust.map(({ title, sub, Icon }) => (
            <div key={title} className="trust-item">
              <span className="trust-icon"><Icon size={18} strokeWidth={1.5} /></span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>{title}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h6>Shop by subject</h6><h2>Find your next read</h2></div>
          <Link href="/books" className="btn btn-ghost" style={{ whiteSpace: "nowrap" }}>View all →</Link>
        </div>
        <div className="subject-row">
          {CATS.map((c) => {
            const inCat = books.filter((b) => b.category === c);
            return (
              <Link key={c} href={`/books?cat=${encodeURIComponent(c)}`} className="subject-tile">
                <div className="subject-art">
                  <div style={{ position: "absolute", inset: "12% 6% 10%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {inCat.slice(0, 3).map((b, i, arr) => (
                      <div
                        key={b.id}
                        className="cover-wrap"
                        style={{
                          width: arr.length === 1 ? "62%" : "60%", flex: "none", marginLeft: i ? "-38%" : 0,
                          transform: `rotate(${(i - (arr.length - 1) / 2) * 7}deg) translateY(${i === 1 ? -6 : 0}%)`,
                          zIndex: i === 1 ? 2 : 1,
                        }}
                      >
                        <Cover book={b} />
                      </div>
                    ))}
                  </div>
                </div>
                <span style={{ display: "flex", flexDirection: "column", padding: "0 2px" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 19, lineHeight: 1.1 }}>{c}</span>
                  <span className="text-muted num" style={{ fontSize: 12 }}>{inCat.length} titles</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h6>Just in</h6><h2>New this season</h2></div>
          <Link href="/books?sort=new" className="btn btn-ghost" style={{ whiteSpace: "nowrap" }}>View all →</Link>
        </div>
        <BookGrid books={newArrivals} row />
      </section>

      {homeCollections.map((c) => (
        <section key={c.id} className="section">
          <div className="section-head">
            <div><h6>Collection</h6><h2>{c.name}</h2></div>
            <p style={{ margin: 0, maxWidth: 420, fontSize: 14, color: "var(--color-neutral-700)", fontStyle: "italic" }}>{c.description}</p>
          </div>
          <BookGrid books={c.books} row />
        </section>
      ))}

      <section className="section band-used">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h6 className="kicker">Secondhand</h6>
          <h2 style={{ margin: 0, fontWeight: 400 }}>Honestly graded, <em>fairly priced.</em></h2>
          <p style={{ margin: 0, color: "var(--color-neutral-800)" }}>
            Every used copy is checked page by page. If it doesn’t match the description, we’ll take it back.
          </p>
          <div><Link href="/books?cond=used" className="btn btn-primary">Browse secondhand</Link></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="grade-row" style={{ borderBottom: "1px solid var(--color-divider)" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>Very good</span>
            <span style={{ fontSize: 14, color: "var(--color-neutral-800)" }}>Clean pages, intact spine. About 40% off.</span>
          </div>
          <div className="grade-row">
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>Good</span>
            <span style={{ fontSize: 14, color: "var(--color-neutral-800)" }}>Visible wear, text complete. About 55% off.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><h6>Bestsellers</h6><h2>Readers’ favourites</h2></div>
          <Link href="/books?sort=rated" className="btn btn-ghost" style={{ whiteSpace: "nowrap" }}>View all →</Link>
        </div>
        <BookGrid books={bestsellers} row />
      </section>

      <Newsletter />
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const flash = useStore((s) => s.flash);
  return (
    <section className="section newsletter">
      <div style={{ padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-3)", justifyContent: "center" }}>
        <h6 className="kicker">The AnyBook letter</h6>
        <h2 style={{ margin: 0, fontWeight: 400 }}>New arrivals &amp; rare finds, <em>once a month.</em></h2>
        {done ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-accent-800)", animation: "abUp .4s var(--ease) both" }}>
            <Check size={18} strokeWidth={1.8} /> You’re on the list — see you next month.
          </div>
        ) : (
          <>
            <form
              style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}
              onSubmit={(e) => {
                e.preventDefault();
                subscribe(email).then((r) => (r.ok ? setDone(true) : flash(r.error)));
              }}
            >
              <input className="input" type="email" placeholder="Your email" aria-label="Your email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: "1 1 200px", minHeight: 42 }} />
              <button className="btn btn-primary" style={{ flex: "0 0 auto", minHeight: 42, padding: "0 20px" }}>Subscribe</button>
            </form>
            <span className="text-muted" style={{ fontSize: 12 }}>No spam. Unsubscribe anytime.</span>
          </>
        )}
      </div>
      <div style={{ position: "relative", minHeight: 220 }}>
        <ShelfArt rows={2} seed={7} />
      </div>
    </section>
  );
}
