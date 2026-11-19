"use client";

import Link from "next/link";
import { BookGrid } from "@/components/BookCard";
import { plural } from "@/lib/format";
import { usePublished } from "@/components/CatalogProvider";
import { useStore } from "@/lib/store";

export default function FavouritesPage() {
  const favs = useStore((s) => s.favs);
  const list = usePublished().filter((b) => favs.includes(b.id));
  return (
    <section className="enter" style={{ paddingTop: "var(--space-8)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)", borderBottom: "1px solid var(--color-divider)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <h1 className="page-title">Favourites</h1>
        <span className="text-muted num" style={{ fontSize: 13 }}>{plural(list.length, "book")} saved</span>
      </div>
      {list.length === 0 ? (
        <div className="empty" style={{ padding: "48px 0" }}>
          <h3>Nothing saved yet.</h3>
          <p className="text-muted" style={{ margin: 0 }}>Tap the heart on any book to keep it here.</p>
          <Link href="/books" className="btn btn-primary">Browse books</Link>
        </div>
      ) : (
        <BookGrid books={list} />
      )}
    </section>
  );
}
