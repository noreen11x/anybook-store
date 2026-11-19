"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Book } from "@/lib/data";
import { fmt, hasUsed, usedFrom } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Cover } from "./Cover";

/** Reusable product card (BookCard.dc.html). `preview` disables actions for the admin shop preview. */
export function BookCard({ book, preview = false }: { book: Book; preview?: boolean }) {
  const isFav = useStore((s) => s.favs.includes(book.id));
  const toggleFav = useStore((s) => s.toggleFav);
  const addToCart = useStore((s) => s.addToCart);
  const href = `/books/${book.id}`;

  const media = (
    <div className="cover-wrap">
      <Cover book={book} />
    </div>
  );

  return (
    <div className="bc">
      <div className="bc-media">
        {preview ? (
          <div className="bc-open">{media}</div>
        ) : (
          <Link href={href} className="bc-open" aria-label={`Open ${book.title}`}>
            {media}
          </Link>
        )}
        <button
          className="fav-btn"
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={isFav}
          onClick={() => !preview && toggleFav(book.id)}
        >
          {isFav ? (
            <Heart key="on" size={16} className="pop" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth={1.6} />
          ) : (
            <Heart key="off" size={16} strokeWidth={1.6} />
          )}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div className="card-kicker">{book.category}</div>
        {preview ? (
          <span className="bc-title">{book.title}</span>
        ) : (
          <Link href={href} className="bc-title">{book.title}</Link>
        )}
        <div className="text-muted" style={{ fontSize: 13, fontStyle: "italic" }}>{book.author}</div>
        <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>
          {hasUsed(book) ? `Used from ${fmt(usedFrom(book))}` : "New copies only"}
        </div>
        <div className="num" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-neutral-700)" }}>
          <Star size={12} fill="var(--color-accent)" stroke="none" />
          <span>{book.reviewCount ? book.rating.toFixed(1) : "New"}</span>
          <span className="text-muted">({book.reviewCount})</span>
        </div>
      </div>
      <div className="bc-foot">
        <span className="num" style={{ fontSize: 15 }}>{fmt(book.priceNew)}</span>
        <button
          className="btn btn-primary bc-add"
          disabled={!preview && book.stockNew === 0}
          onClick={() => !preview && addToCart(book.id, "new", 1, book.title)}
        >
          {book.stockNew === 0 && !preview ? "Sold out" : "Add to basket"}
        </button>
      </div>
    </div>
  );
}

export function BookGrid({ books, row = false }: { books: Book[]; row?: boolean }) {
  return (
    <div className={row ? "book-row" : "book-grid"}>
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
