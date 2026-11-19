"use client";

import { useEffect, useState } from "react";
import { saveSettings } from "@/app/actions/admin";
import type { Settings } from "@/lib/data";
import { useAdmin, useRun } from "../AdminProvider";

export default function SettingsPage() {
  const { settings } = useAdmin();
  const { run, pending } = useRun();
  const [st, setSt] = useState<Settings>(settings);
  useEffect(() => setSt(settings), [settings]);
  const dirty = JSON.stringify(st) !== JSON.stringify(settings);
  const set = (p: Partial<Settings>) => setSt((x) => ({ ...x, ...p }));

  const text = (k: "storeName" | "email" | "phone" | "address") => ({
    value: st[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ [k]: e.target.value }),
  });
  const num = (k: "std" | "exp" | "freeOver" | "lowAt") => ({
    type: "number" as const,
    min: 0,
    value: st[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ [k]: Math.max(0, +e.target.value || 0) } as Partial<Settings>),
  });
  const pays: [keyof Settings["payments"], string][] = [["card", "Credit / debit card (on delivery)"], ["cod", "Cash on delivery"], ["wallet", "Mobile wallet"]];
  const noPay = !Object.values(st.payments).some(Boolean);

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => saveSettings(st), "Settings saved"); }}>
      <div className="admin-head" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Settings</h1>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          {dirty && <span className="text-muted" style={{ fontSize: 12 }}>Unsaved changes</span>}
          <button className="btn btn-primary" disabled={pending || !dirty || noPay} style={{ padding: "10px 20px" }}>{pending ? "Saving…" : "Save settings"}</button>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "var(--space-6)", alignItems: "start" }}>
        <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
          <div className="card-title" style={{ fontSize: 22 }}>Store details</div>
          <div className="field"><label htmlFor="s-name">Store name</label><input id="s-name" className="input" {...text("storeName")} /></div>
          <div className="field"><label htmlFor="s-email">Support email</label><input id="s-email" className="input" type="email" {...text("email")} /></div>
          <div className="field"><label htmlFor="s-phone">Phone</label><input id="s-phone" className="input" {...text("phone")} /></div>
          <div className="field"><label htmlFor="s-addr">Shop address</label><textarea id="s-addr" className="input" style={{ minHeight: 64 }} {...text("address")} /></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 22 }}>Delivery</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "var(--space-3)" }}>
              <div className="field"><label htmlFor="s-std">Standard (EGP)</label><input id="s-std" className="input num" {...num("std")} /></div>
              <div className="field"><label htmlFor="s-exp">Express (EGP)</label><input id="s-exp" className="input num" {...num("exp")} /></div>
              <div className="field"><label htmlFor="s-free">Free over (EGP)</label><input id="s-free" className="input num" {...num("freeOver")} /></div>
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>Applies to the basket, checkout and the site banner as soon as you save.</div>
          </div>
          <div className="card" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <div className="card-title" style={{ fontSize: 22 }}>Inventory &amp; payments</div>
            <div className="field"><label htmlFor="s-low">Low-stock alert at (new copies)</label><input id="s-low" className="input num" {...num("lowAt")} style={{ maxWidth: 140 }} /></div>
            <div className="field">
              <label>Payment methods</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pays.map(([k, label]) => {
                  const on = st.payments[k];
                  return (
                    <button type="button" key={k} role="switch" aria-checked={on} className="plain" onClick={() => set({ payments: { ...st.payments, [k]: !on } })} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 14 }}>
                      <span className={`switch${on ? " on" : ""}`}><i /></span>
                      {label}
                    </button>
                  );
                })}
              </div>
              {noPay && <div role="alert" style={{ fontSize: 12, color: "var(--color-accent-800)", marginTop: 6 }}>Keep at least one payment method on, or customers can’t check out.</div>}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
