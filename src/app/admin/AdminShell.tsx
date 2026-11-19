"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Bell, BookOpen, ExternalLink, House, LogOut, Menu, MessageSquare, Package, Percent, Search, SlidersHorizontal, Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/actions/shop";
import { initials } from "@/lib/format";
import { useAdmin } from "./AdminProvider";

type Item = { href: string; label: string; Icon: typeof House; count?: number; sub?: boolean; match?: (p: string) => boolean };

function useNav(): Item[] {
  const { orders, books, reviews, settings } = useAdmin();
  const lowAt = settings.lowAt;
  return [
    { href: "/admin", label: "Home", Icon: House, match: (p) => p === "/admin" },
    { href: "/admin/orders", label: "Orders", Icon: Package, count: orders.filter((o) => o.status === "Processing").length },
    { href: "/admin/products", label: "Products", Icon: BookOpen, match: (p) => p.startsWith("/admin/products") },
    { href: "/admin/collections", label: "Collections", Icon: BookOpen, sub: true },
    { href: "/admin/inventory", label: "Inventory", Icon: BookOpen, sub: true, count: books.filter((b) => b.stockNew <= lowAt).length },
    { href: "/admin/customers", label: "Customers", Icon: Users },
    { href: "/admin/discounts", label: "Discounts", Icon: Percent },
    { href: "/admin/reviews", label: "Reviews", Icon: MessageSquare, count: reviews.filter((r) => r.status === "Pending").length },
  ];
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = useNav();
  const isOn = (it: Item) => (it.match ? it.match(pathname) : pathname.startsWith(it.href));
  return (
    <>
      <div className="admin-logo">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Logo height={28} />
          <span className="text-muted" style={{ fontSize: 11, paddingLeft: 2 }}>Store admin · Zamalek, Cairo</span>
        </div>
      </div>
      <nav aria-label="Admin" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((it) => {
          const on = isOn(it);
          return (
            <Link key={it.href} href={it.href} onClick={onNavigate} className={`anav${on ? " on" : ""}${it.sub ? " sub" : ""}`} aria-current={on ? "page" : undefined}>
              <it.Icon size={17} strokeWidth={1.6} style={{ flex: "none" }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {!!it.count && <span className="count">{it.count}</span>}
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: 2 }}>
        <Link href="/admin/settings" onClick={onNavigate} className={`anav${pathname === "/admin/settings" ? " on" : ""}`}>
          <SlidersHorizontal size={17} strokeWidth={1.6} /> Settings
        </Link>
        <Link href="/" className="anav">
          <ExternalLink size={17} strokeWidth={1.6} /> View store
        </Link>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const { me, orders, reviews, books, settings } = useAdmin();
  const [signingOut, startSignOut] = useTransition();
  const hasAlerts =
    orders.some((o) => o.status === "Processing") || reviews.some((r) => r.status === "Pending") || books.some((b) => b.stockNew <= settings.lowAt);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <div className="admin">
      <aside className="admin-side">
        <NavList />
      </aside>
      {menu && (
        <div className="drawer-backdrop" onClick={() => setMenu(false)}>
          <aside className="drawer" style={{ padding: "var(--space-4) var(--space-3)" }} onClick={(e) => e.stopPropagation()}>
            <NavList onNavigate={() => setMenu(false)} />
          </aside>
        </div>
      )}
      <div className="admin-main">
        <div className="admin-top">
          <button className="btn btn-icon menu-btn" aria-label="Menu" onClick={() => setMenu(true)}>
            <Menu size={20} strokeWidth={1.6} />
          </button>
          <form
            role="search"
            className="search"
            style={{ maxWidth: 520 }}
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/admin/products?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <Search size={16} strokeWidth={1.6} />
            <input
              className="input"
              type="search"
              placeholder="Search products, ISBN or author"
              aria-label="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-100)" }}
            />
          </form>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Link href="/admin" className="btn btn-icon lift" aria-label="Notifications" style={{ position: "relative" }}>
              <Bell size={19} strokeWidth={1.5} />
              {hasAlerts && <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 0 2px var(--color-bg)" }} />}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", paddingLeft: "var(--space-2)", borderLeft: "1px solid var(--color-divider)" }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--color-accent)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--color-accent-800)" }}>{initials(me.name)}</span>
              <span className="admin-owner" style={{ fontSize: 13, lineHeight: 1.2 }}>
                {me.name}<br /><span className="text-muted" style={{ fontSize: 11 }}>{me.role === "Admin" ? "Store owner" : "Staff"}</span>
              </span>
              <button
                className="btn btn-icon lift"
                aria-label="Sign out"
                title="Sign out"
                disabled={signingOut}
                onClick={() => startSignOut(async () => { await signOut(); router.replace("/account"); router.refresh(); })}
              >
                <LogOut size={17} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
        <div className="admin-body">{children}</div>
      </div>
    </div>
  );
}
