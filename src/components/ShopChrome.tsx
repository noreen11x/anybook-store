"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { subscribe } from "@/app/actions/shop";
import { useCatalog } from "./CatalogProvider";
import { fmt } from "@/lib/format";
import { Logo } from "./Logo";

const NAV: { label: string; href: string; match: (p: URLSearchParams) => boolean }[] = [
  { label: "All books", href: "/books", match: (p) => !p.get("cat") && !p.get("cond") && !p.get("q") },
  ...["Fiction", "History", "Arabic Literature", "Poetry", "Children's"].map((c) => ({
    label: c,
    href: `/books?cat=${encodeURIComponent(c)}`,
    match: (p: URLSearchParams) => p.get("cat") === c,
  })),
  { label: "Secondhand", href: "/books?cond=used", match: (p) => p.get("cond") === "used" },
];

export function Wordmark({ height = 34 }: { height?: number }) {
  return (
    <Link href="/" className="wordmark" aria-label="AnyBook home">
      <Logo height={height} title="AnyBook" />
    </Link>
  );
}

export function ShopHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const favCount = useStore((s) => s.favs.length);
  const cartCount = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const { settings: { freeOver }, me } = useCatalog();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    setMenu(false);
    setSearchOpen(false);
  }, [pathname, params]);
  useEffect(() => {
    if (pathname === "/books") setQ(params.get("q") ?? "");
  }, [pathname, params]);

  const onBrowse = pathname === "/books";
  const navItems = NAV.map((n) => ({ ...n, on: onBrowse && n.match(params) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/books?q=${encodeURIComponent(v)}` : "/books");
    setSearchOpen(false);
  };

  return (
    <>
      <div className="announce">
        <span className="desk-inline">Free delivery across Egypt on orders over <span className="num">{fmt(+freeOver)}</span> · 14-day returns</span>
        <span className="mob-inline">Free delivery over <span className="num">{fmt(+freeOver)}</span> · 14-day returns</span>
      </div>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container header-row">
          <button className="btn btn-icon menu-btn" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <Menu size={20} strokeWidth={1.6} />
          </button>
          <Wordmark />
          <div className="header-icons">
            <button
              className={`btn btn-icon lift${searchOpen ? " on" : ""}`}
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="site-search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/favourites" className="btn btn-icon lift" aria-label="Favourites" style={{ position: "relative" }}>
              <Heart size={20} strokeWidth={1.5} />
              {favCount > 0 && <span key={favCount} className="badge">{favCount}</span>}
            </Link>
            <Link href="/account" className={`btn btn-icon lift${me ? " on" : ""}`} aria-label={me ? `Account (${me.name})` : "Sign in"} title={me ? me.name : "Sign in"}>
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/basket" className="btn btn-icon lift" aria-label="Basket" style={{ position: "relative" }}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && <span key={cartCount} className="badge">{cartCount}</span>}
            </Link>
          </div>
          <nav className="cat-nav" aria-label="Categories">
            {navItems.map((n) => (
              <Link key={n.label} href={n.href} className={n.on ? "on" : undefined} aria-current={n.on ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        {searchOpen && (
          <div id="site-search" className="search-drop">
            <form className="container search-drop-row" role="search" onSubmit={submit}>
              <Search size={20} strokeWidth={1.5} aria-hidden />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search titles or authors"
                aria-label="Search titles or authors"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button type="submit" className="btn btn-primary" style={{ flex: "none" }}>Search</button>
              <button type="button" className="btn btn-icon" aria-label="Close search" onClick={() => setSearchOpen(false)}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        )}
      </header>
      {searchOpen && <div className="search-scrim" onClick={() => setSearchOpen(false)} />}
      {menu && (
        <div className="drawer-backdrop" onClick={() => setMenu(false)}>
          <aside className="drawer" aria-label="Browse" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "0 var(--space-2) var(--space-4)", borderBottom: "1px solid var(--color-divider)", marginBottom: "var(--space-2)" }}>
              <Wordmark height={30} />
            </div>
            <h6 style={{ margin: "var(--space-2) var(--space-2) var(--space-1)", color: "var(--color-accent-700)" }}>Browse</h6>
            {navItems.map((n) => (
              <Link key={n.label} href={n.href} className={`drawer-link${n.on ? " on" : ""}`} onClick={() => setMenu(false)}>
                {n.label}
              </Link>
            ))}
          </aside>
        </div>
      )}
    </>
  );
}

export function ShopFooter() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const flash = useStore((s) => s.flash);
  const { settings: { address }, me } = useCatalog();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Logo height={34} style={{ marginBottom: 4 }} />
          <span className="text-muted" style={{ fontSize: 13 }}>
            New &amp; secondhand books.
            <br />
            {address}
          </span>
        </div>
        <div className="footer-col">
          <h6 style={{ margin: "0 0 4px" }}>Shop</h6>
          <Link href="/books">All books</Link>
          <Link href="/books?cond=used">Secondhand</Link>
        </div>
        <div className="footer-col">
          <h6 style={{ margin: "0 0 4px" }}>Help</h6>
          <a href="#" onClick={(e) => e.preventDefault()}>Delivery &amp; returns</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Sell us your books</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
          {me && me.role !== "Customer" && <Link href="/admin">Store admin</Link>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h6 style={{ margin: 0 }}>Newsletter</h6>
          <span className="text-muted" style={{ fontSize: 13 }}>One letter a month: new arrivals and rare finds.</span>
          {joined ? (
            <span style={{ fontSize: 13, color: "var(--color-accent-800)" }}>You’re on the list.</span>
          ) : (
            <form
              style={{ display: "flex", gap: "var(--space-2)" }}
              onSubmit={(e) => {
                e.preventDefault();
                subscribe(email).then((r) => (r.ok ? setJoined(true) : flash(r.error)));
              }}
            >
              <input className="input" type="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-primary">Join</button>
            </form>
          )}
        </div>
      </div>
    </footer>
  );
}
