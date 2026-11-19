"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BookGrid } from "@/components/BookCard";
import { BIOS } from "@/lib/data";
import { initials, plural, slugify } from "@/lib/format";
import { usePublished } from "@/components/CatalogProvider";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const books = usePublished();
  const mine = books.filter((b) => slugify(b.author) === slug);
  const name = mine[0]?.author ?? Object.keys(BIOS).find((n) => slugify(n) === slug);

  if (!name) {
    return (
      <div className="empty enter">
        <h3>We couldn’t find that author.</h3>
        <Link href="/books" className="btn btn-primary">Browse books</Link>
      </div>
    );
  }

  const avg = mine.length ? (mine.reduce((t, b) => t + b.rating, 0) / mine.length).toFixed(1) : "—";

  return (
    <section className="enter" style={{ paddingTop: "var(--space-8)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6) var(--space-8)", alignItems: "flex-start", paddingBottom: "var(--space-6)", borderBottom: "1px solid var(--color-divider)" }}>
        <div className="monogram" aria-hidden>{initials(name)}</div>
        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h6 className="kicker">Author</h6>
          <h1 style={{ margin: 0, fontWeight: 400, fontSize: "clamp(40px, 5vw, 58px)" }}>{name}</h1>
          {BIOS[name] && <p className="justify" style={{ margin: 0, maxWidth: 640, fontSize: 16, lineHeight: 1.65 }}>{BIOS[name]}</p>}
          <div className="num" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)", fontSize: 13, color: "var(--color-neutral-700)" }}>
            <span>{plural(mine.length, "book")} at AnyBook</span>
            <span>Average rating {avg}</span>
          </div>
        </div>
      </div>
      <h2 style={{ margin: "var(--space-6) 0", fontWeight: 400, fontSize: 32 }}>Books by {name}</h2>
      <BookGrid books={mine} />
    </section>
  );
}
