import type { CSSProperties } from "react";
import { TONES } from "@/lib/data";

interface CoverBook { title: string; author: string; coverTone: number; coverImageUrl: string | null }

/**
 * Book cover. Uploaded images get the `.plate` treatment; otherwise a typographic
 * placeholder in a cloth colour (double rule, title, author).
 * Parent must be a container (`.cover-wrap`) so cqw font sizes resolve.
 */
export function Cover({ book, plateWidth = 3, style }: { book: CoverBook; plateWidth?: number; style?: CSSProperties }) {
  if (book.coverImageUrl) {
    return (
      <div
        role="img"
        aria-label={`Cover of ${book.title}`}
        className="plate cover-img"
        style={{ borderWidth: plateWidth, backgroundImage: `url("${book.coverImageUrl}")`, boxShadow: "var(--shadow-md)", ...style }}
      />
    );
  }
  const [bg, ink] = TONES[book.coverTone] ?? TONES[0];
  return (
    <div className="cover" style={{ background: bg, color: ink, ...style }} aria-label={`Cover of ${book.title}`}>
      <div className="rule" />
      <div className="ct">{book.title}</div>
      <div className="ca">{book.author}</div>
    </div>
  );
}

/** Small thumbnail used in basket rows and admin tables. */
export function Thumb({ book, width, label }: { book: CoverBook; width?: number; label?: string }) {
  if (book.coverImageUrl) {
    return (
      <div
        role="img"
        aria-label={`Cover of ${book.title}`}
        className="cover-img"
        style={{ width, borderRadius: 2, boxShadow: "var(--shadow-sm)", backgroundImage: `url("${book.coverImageUrl}")` }}
      />
    );
  }
  const [bg, ink] = TONES[book.coverTone] ?? TONES[0];
  return (
    <div className="thumb-cover" style={{ width, background: bg, color: ink, fontSize: label ? 13 : 11 }}>
      {label ?? book.title}
    </div>
  );
}
