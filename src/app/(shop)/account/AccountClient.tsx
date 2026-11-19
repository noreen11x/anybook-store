"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changePassword, signIn, signOut, signUp, updateProfile } from "@/app/actions/shop";
import { Chips, Seg } from "@/components/Seg";
import { CITIES, Me, Order } from "@/lib/data";
import { fmt } from "@/lib/format";
import { useStore } from "@/lib/store";

const TAG: Record<string, string> = { Delivered: "tag-neutral", Processing: "tag-accent", Shipped: "tag-outline", Cancelled: "tag-neutral" };
const alert = (msg: string) => (
  <div role="alert" style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{msg}</div>
);

export function SignInView({ next, initialMode }: { next: string; initialMode: "in" | "up" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const flash = useStore((s) => s.flash);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    start(async () => {
      const r = mode === "up" ? await signUp({ name, email, password }) : await signIn({ email, password });
      if (!r.ok) return setErr(r.error);
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <section className="enter" style={{ padding: "64px 0", display: "flex", justifyContent: "center" }}>
      <form className="card elev-sm" onSubmit={submit} style={{ width: "min(440px, 100%)", padding: "var(--space-8)", gap: "var(--space-4)" }} noValidate>
        <h1 style={{ margin: 0, fontWeight: 400, fontSize: 40, textAlign: "center" }}>{mode === "up" ? "Create an account" : "Welcome back"}</h1>
        <Seg<"in" | "up"> name="auth" stretch value={mode} onChange={(m) => { setMode(m); setErr(""); }} options={[["in", "Sign in"], ["up", "Create account"]]} />
        {mode === "up" && (
          <div className="field"><label htmlFor="a-name">Full name</label><input id="a-name" className="input" placeholder="Nour Adel" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" className="input" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field">
          <label htmlFor="a-pw">Password{mode === "up" ? " (8+ characters)" : ""}</label>
          <input id="a-pw" className="input" type="password" placeholder="••••••••" autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && alert(err)}
        <button className="btn btn-primary btn-block" disabled={pending} style={{ padding: 12, fontSize: 15 }}>
          {pending ? "One moment…" : mode === "up" ? "Create account" : "Sign in"}
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); flash("Password reset by email is coming soon — please contact us."); }}>Forgot password?</a>
          <Link href="/checkout" className="btn btn-ghost" style={{ fontSize: 13 }}>Checkout as guest</Link>
        </div>
      </form>
    </section>
  );
}

export function AccountView({ me, orders, denied }: { me: Me; orders: Order[]; denied: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "profile" | "addr">("orders");
  const [pending, start] = useTransition();
  const flash = useStore((s) => s.flash);
  const [p, setP] = useState({ name: me.name, phone: me.phone, street: me.street, city: me.city || "Cairo", zip: me.zip });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [err, setErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const staff = me.role !== "Customer";

  const tabs: [typeof tab, string][] = [["orders", "Orders"], ["profile", "Profile"], ["addr", "Address"]];

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await updateProfile(p);
      if (!r.ok) return setErr(r.error);
      setErr("");
      flash("Profile saved");
    });
  };
  const savePw = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await changePassword(pw);
      if (!r.ok) return setPwErr(r.error);
      setPwErr("");
      setPw({ current: "", next: "" });
      flash("Password changed");
    });
  };

  return (
    <section className="enter two-col" style={{ paddingTop: "var(--space-8)" }}>
      <aside style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, marginBottom: "var(--space-3)" }}>Hello, {me.name.split(" ")[0]}</div>
        {tabs.map(([k, label]) => (
          <button
            key={k}
            className="plain slide-hover"
            aria-current={tab === k ? "page" : undefined}
            onClick={() => setTab(k)}
            style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 14, color: tab === k ? "var(--color-accent-700)" : "var(--color-text)" }}
          >
            {label}
          </button>
        ))}
        {staff && <Link href="/admin" className="btn btn-secondary" style={{ alignSelf: "flex-start", marginTop: "var(--space-4)" }}>Store admin →</Link>}
        <button
          className="btn btn-ghost"
          disabled={pending}
          onClick={() => start(async () => { await signOut(); router.replace("/"); router.refresh(); })}
          style={{ alignSelf: "flex-start", marginTop: "var(--space-3)", color: "var(--color-neutral-700)" }}
        >
          Sign out
        </button>
      </aside>
      <div className="main" style={{ flex: "999 1 480px" }}>
        {denied && (
          <div role="alert" style={{ border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-4)", fontSize: 14, color: "var(--color-accent-800)" }}>
            The store admin is only open to staff accounts.
          </div>
        )}
        {tab === "orders" && (
          <>
            <h2 style={{ margin: "0 0 var(--space-4)", fontWeight: 400, fontSize: 36 }}>Orders</h2>
            {orders.length === 0 ? (
              <p className="text-muted">No orders yet. <Link href="/books">Start browsing</Link>.</p>
            ) : (
              <div className="table-scroll">
                <table className="table">
                  <thead><tr><th>Order</th><th>Date</th><th>Books</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.no}>
                        <td className="num">{o.no}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{o.date}</td>
                        <td style={{ fontSize: 13 }}>{o.lines.map((l) => `${l.title}${l.qty > 1 ? ` ×${l.qty}` : ""}`).join(", ")}</td>
                        <td className="num" style={{ whiteSpace: "nowrap" }}>{fmt(o.total)}</td>
                        <td><span className={`tag ${TAG[o.status]}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === "profile" && (
          <>
            <form onSubmit={saveProfile}>
              <h2 style={{ margin: "0 0 var(--space-4)", fontWeight: 400, fontSize: 36 }}>Profile</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)", maxWidth: 640 }}>
                <div className="field"><label htmlFor="p-name">Full name</label><input id="p-name" className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
                <div className="field"><label htmlFor="p-email">Email</label><input id="p-email" className="input" value={me.email} readOnly disabled /></div>
                <div className="field"><label htmlFor="p-phone">Mobile</label><input id="p-phone" className="input" autoComplete="tel" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
              </div>
              {err && alert(err)}
              <button className="btn btn-primary" disabled={pending} style={{ marginTop: "var(--space-4)" }}>Save changes</button>
            </form>
            <form onSubmit={savePw} style={{ marginTop: "var(--space-8)", maxWidth: 640 }}>
              <h3 style={{ margin: "0 0 var(--space-3)", fontWeight: 400 }}>Change password</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
                <div className="field"><label htmlFor="pw-cur">Current password</label><input id="pw-cur" className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
                <div className="field"><label htmlFor="pw-new">New password (8+ characters)</label><input id="pw-new" className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
              </div>
              {pwErr && alert(pwErr)}
              <button className="btn btn-secondary" disabled={pending || !pw.current || !pw.next} style={{ marginTop: "var(--space-4)" }}>Update password</button>
            </form>
          </>
        )}
        {tab === "addr" && (
          <form onSubmit={saveProfile} style={{ maxWidth: 640 }}>
            <h2 style={{ margin: "0 0 var(--space-4)", fontWeight: 400, fontSize: 36 }}>Delivery address</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div className="field"><label htmlFor="ad-street">Street address</label><input id="ad-street" className="input" autoComplete="street-address" value={p.street} onChange={(e) => setP({ ...p, street: e.target.value })} /></div>
              <div className="form-grid">
                <div className="field"><label>City</label><Chips options={CITIES.map((c) => [c, c] as [string, string])} value={p.city} onChange={(city) => setP({ ...p, city })} /></div>
                <div className="field"><label htmlFor="ad-zip">Postal code</label><input id="ad-zip" className="input" autoComplete="postal-code" value={p.zip} onChange={(e) => setP({ ...p, zip: e.target.value })} /></div>
              </div>
            </div>
            {err && alert(err)}
            <p className="text-muted" style={{ fontSize: 13 }}>We’ll fill this in for you at checkout.</p>
            <button className="btn btn-primary" disabled={pending}>Save address</button>
          </form>
        )}
      </div>
    </section>
  );
}
