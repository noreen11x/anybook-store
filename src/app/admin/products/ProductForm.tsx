"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { BookCard } from "@/components/BookCard";
import { ConfirmDelete } from "@/components/Dialog";
import { Chips, Seg } from "@/components/Seg";
import { Book, BookStatus, CATS, TONES, round5 } from "@/lib/data";
import { fmt } from "@/lib/format";
import { deleteBooks, saveBook, uploadCover } from "@/app/actions/admin";
import { useAdmin, useRun } from "../AdminProvider";

interface Form {
  title: string; author: string; category: string; isbn: string; year: string; pages: string; description: string;
  priceNew: string; priceVG: string; priceGood: string; stockNew: string; stockVG: string; stockGood: string;
  coverTone: number; coverImageUrl: string | null; status: BookStatus;
}

const BLANK: Form = {
  title: "", author: "", category: "Fiction", isbn: "", year: "2026", pages: "", description: "",
  priceNew: "", priceVG: "", priceGood: "", stockNew: "10", stockVG: "0", stockGood: "0",
  coverTone: 0, coverImageUrl: null, status: "Published",
};

const toForm = (b: Book): Form => ({
  title: b.title, author: b.author, category: b.category, isbn: b.isbn, year: String(b.year), pages: String(b.pages || ""),
  description: b.description, priceNew: String(b.priceNew), priceVG: String(b.priceVG), priceGood: String(b.priceGood),
  stockNew: String(b.stockNew), stockVG: String(b.stockVG), stockGood: String(b.stockGood),
  coverTone: b.coverTone, coverImageUrl: b.coverImageUrl, status: b.status,
});

const MAX_IMG = 1.5 * 1024 * 1024;

export function ProductForm({ book }: { book?: Book }) {
  const router = useRouter();
  const { settings } = useAdmin();
  const lowAt = settings.lowAt;
  const { run, pending } = useRun();
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState<Form>(book ? toForm(book) : BLANK);
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const [askDel, setAskDel] = useState(false);
  const editing = !!book;

  const set = (patch: Partial<Form>) => {
    setF((x) => ({ ...x, ...patch }));
    setErr("");
  };
  const bind = (k: keyof Form) => ({ value: f[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ [k]: e.target.value }) });

  const readImg = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Please choose an image file.");
    if (file.size > MAX_IMG) return setErr("That image is larger than 1.5 MB — please choose a smaller file.");
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    const r = await uploadCover(fd);
    setUploading(false);
    if (!r.ok) return setErr(r.error);
    set({ coverImageUrl: r.url });
  };

  const p = +f.priceNew || 0;
  const n = (v: string) => Math.max(0, parseInt(v, 10) || 0);

  const save = () => {
    if (!f.title.trim() || !f.author.trim() || !(p > 0)) {
      setErr("Please add a title, an author and a new price before saving.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    run(() => saveBook(
      {
        title: f.title.trim(), author: f.author.trim(), category: f.category, isbn: f.isbn.trim(),
        year: +f.year || 2026, pages: +f.pages || 0, description: f.description.trim(),
        priceNew: p, priceVG: +f.priceVG || round5(p * 0.6), priceGood: +f.priceGood || round5(p * 0.45),
        stockNew: n(f.stockNew), stockVG: n(f.stockVG), stockGood: n(f.stockGood),
        coverImageUrl: f.coverImageUrl, coverTone: f.coverTone, status: f.status,
      },
      book?.id ?? null,
    ), editing ? "Changes saved" : `“${f.title.trim()}” added to the shop`).then((r) => {
      if (r.ok) router.push("/admin/products");
    });
  };

  const preview: Book = {
    id: "preview", title: f.title || "Untitled", author: f.author || "Author name", category: f.category, isbn: "", year: 2026,
    pages: 0, description: "", priceNew: p, priceVG: +f.priceVG || round5(p * 0.6), priceGood: +f.priceGood || round5(p * 0.45),
    stockNew: n(f.stockNew), stockVG: n(f.stockVG), stockGood: n(f.stockGood), coverImageUrl: f.coverImageUrl, coverTone: f.coverTone,
    status: f.status, rating: book?.rating ?? 0, reviewCount: book?.reviewCount ?? 0,
  };

  return (
    <>
      <div className="admin-head" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <Link href="/admin/products" className="btn btn-ghost" style={{ paddingLeft: 0 }}>← All products</Link>
          <h1>{editing ? "Edit product" : "Add a product"}</h1>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Link href="/admin/products" className="btn btn-secondary">Cancel</Link>
          <button className="btn btn-primary" onClick={save} disabled={pending || uploading} style={{ padding: "10px 20px" }}>{pending ? "Saving…" : editing ? "Save changes" : "Publish product"}</button>
        </div>
      </div>
      {err && (
        <div role="alert" style={{ border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-4)", fontSize: 14, color: "var(--color-accent-800)", animation: "abUp .3s var(--ease)" }}>
          {err}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "flex-start" }}>
        <div style={{ flex: "999 1 400px", minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 22 }}>Book details</div>
            <div className="field"><label htmlFor="pf-t">Title *</label><input id="pf-t" className="input" placeholder="e.g. The Quiet Archive" {...bind("title")} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
              <div className="field"><label htmlFor="pf-a">Author *</label><input id="pf-a" className="input" placeholder="Full name" {...bind("author")} /></div>
              <div className="field"><label>Category</label><Chips options={CATS.map((c) => [c, c] as [string, string])} value={f.category} onChange={(category) => set({ category })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "var(--space-3)" }}>
              <div className="field"><label htmlFor="pf-isbn">ISBN</label><input id="pf-isbn" className="input" placeholder="978-…" {...bind("isbn")} /></div>
              <div className="field"><label htmlFor="pf-y">Year</label><input id="pf-y" className="input" type="number" {...bind("year")} /></div>
              <div className="field"><label htmlFor="pf-pg">Pages</label><input id="pf-pg" className="input" type="number" min={0} {...bind("pages")} /></div>
            </div>
            <div className="field"><label htmlFor="pf-d">Description</label><textarea id="pf-d" className="input" placeholder="A short, honest description for the book page." style={{ minHeight: 120 }} {...bind("description")} /></div>
          </div>

          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-2)" }}>
              <div className="card-title" style={{ fontSize: 22 }}>Pricing</div>
              <button className="btn btn-ghost" onClick={() => p && set({ priceVG: String(round5(p * 0.6)), priceGood: String(round5(p * 0.45)) })} style={{ fontSize: 13 }}>Suggest used prices</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-3)" }}>
              <div className="field"><label htmlFor="pf-p">New price (EGP) *</label><input id="pf-p" className="input" type="number" min={0} {...bind("priceNew")} /></div>
              <div className="field"><label htmlFor="pf-pvg">Used · Very good</label><input id="pf-pvg" className="input" type="number" min={0} {...bind("priceVG")} /></div>
              <div className="field"><label htmlFor="pf-pgd">Used · Good</label><input id="pf-pgd" className="input" type="number" min={0} {...bind("priceGood")} /></div>
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {p
                ? `Used copies typically sell at 60% (Very good) and 45% (Good) of new: ${fmt(round5(p * 0.6))} and ${fmt(round5(p * 0.45))}.`
                : "Set a new price to see suggested used prices."}
            </div>
          </div>

          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 22 }}>Inventory</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-3)" }}>
              <div className="field"><label htmlFor="pf-sn">New copies</label><input id="pf-sn" className="input" type="number" min={0} {...bind("stockNew")} /></div>
              <div className="field"><label htmlFor="pf-u0">Used · Very good</label><input id="pf-u0" className="input" type="number" min={0} {...bind("stockVG")} /></div>
              <div className="field"><label htmlFor="pf-u1">Used · Good</label><input id="pf-u1" className="input" type="number" min={0} {...bind("stockGood")} /></div>
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Total on hand: {n(f.stockNew) + n(f.stockVG) + n(f.stockGood)} copies. Items with {lowAt} or fewer new copies are flagged as low stock.
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "var(--space-6)", position: "sticky", top: 70 }}>
          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 22 }}>Cover image</div>
            <div
              className={`dropzone${over ? " over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); readImg(e.dataTransfer.files?.[0]); }}
            >
              <Upload size={22} strokeWidth={1.5} color="var(--color-accent)" />
              <span style={{ fontSize: 13 }}>{uploading ? "Uploading…" : "Drop an image here, or"}</span>
              <label className="btn btn-secondary" style={{ fontSize: 13 }}>
                Choose file
                <input type="file" accept="image/*" onChange={(e) => readImg(e.target.files?.[0])} style={{ display: "none" }} />
              </label>
              <span className="text-muted" style={{ fontSize: 11 }}>JPG or PNG, portrait 2:3 works best</span>
            </div>
            {f.coverImageUrl ? (
              <>
                <div className="plate cover-img" style={{ width: 140, alignSelf: "center", boxShadow: "var(--shadow-md)", backgroundImage: `url("${f.coverImageUrl}")`, animation: "abPop .5s var(--ease)" }} />
                <button className="btn btn-ghost" onClick={() => set({ coverImageUrl: null })} style={{ alignSelf: "flex-start", fontSize: 13, color: "var(--color-neutral-700)" }}>Remove image</button>
              </>
            ) : (
              <div className="field">
                <label>No image? Pick a cloth colour</label>
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  {TONES.map(([bg], i) => (
                    <button key={i} className={`swatch${f.coverTone === i ? " on" : ""}`} aria-label={`Cloth colour ${i + 1}`} aria-pressed={f.coverTone === i} onClick={() => set({ coverTone: i })} style={{ background: bg }} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 22 }}>Visibility</div>
            <Seg<BookStatus> name="fstatus" stretch value={f.status} onChange={(status) => set({ status })} options={[["Published", "Published"], ["Draft", "Draft"]]} />
            <div className="text-muted" style={{ fontSize: 12 }}>Drafts are hidden from the shop.</div>
          </div>
          <div>
            <h6 style={{ margin: "0 0 var(--space-2)" }}>Shop preview</h6>
            <div style={{ maxWidth: 220 }}><BookCard book={preview} preview /></div>
          </div>
          {editing && (
            <button className="btn btn-ghost" onClick={() => setAskDel(true)} style={{ alignSelf: "flex-start", color: "var(--color-neutral-700)" }}>Delete this product</button>
          )}
        </div>
      </div>
      {askDel && book && (
        <ConfirmDelete
          title={book.title}
          onCancel={() => setAskDel(false)}
          onConfirm={() => {
            setAskDel(false);
            router.push("/admin/products");
            run(() => deleteBooks([book.id]), "Product deleted");
          }}
        />
      )}
    </>
  );
}
