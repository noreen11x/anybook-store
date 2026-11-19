"use client";

import { useState } from "react";
import { Chips } from "@/components/Seg";
import type { PromoCode } from "@/lib/data";
import { fmt } from "@/lib/format";
import { createPromo, deletePromo, togglePromo } from "@/app/actions/admin";
import { useAdmin, useRun } from "../AdminProvider";

export default function DiscountsPage() {
  const { promos } = useAdmin();
  const { run, pending } = useRun();
  const [code, setCode] = useState("");
  const [type, setType] = useState<PromoCode["type"]>("pct");
  const [v, setV] = useState("");
  const [err, setErr] = useState("");

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const value = +v;
    if (!code || !(value > 0)) return setErr("Enter a code and a value.");
    if (type === "pct" && value > 100) return setErr("A percentage can’t be more than 100.");
    if (promos.some((p) => p.code === code)) return setErr("That code already exists.");
    run(() => createPromo({ code, type, value }), `Code ${code} created`).then((r) => {
      if (!r.ok) return setErr(r.error ?? "");
      setCode("");
      setV("");
      setType("pct");
    });
  };

  return (
    <>
      <h1 style={{ margin: "0 0 var(--space-4)", fontWeight: 400, fontSize: 40 }}>Discounts</h1>
      <form className="card" onSubmit={create} style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card-title">Create a code</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-3)", alignItems: "end" }}>
          <div className="field">
            <label htmlFor="d-code">Code</label>
            <input id="d-code" className="input" placeholder="e.g. EID20" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/\s/g, "")); setErr(""); }} style={{ letterSpacing: ".06em" }} />
          </div>
          <div className="field">
            <label>Type</label>
            <Chips<PromoCode["type"]> options={[["pct", "Percent off"], ["abs", "Fixed EGP off"]]} value={type} onChange={setType} />
          </div>
          <div className="field">
            <label htmlFor="d-v">Value</label>
            <input id="d-v" className="input" type="number" min={0} placeholder="10" value={v} onChange={(e) => { setV(e.target.value); setErr(""); }} />
          </div>
          <button className="btn btn-primary" disabled={pending} style={{ minHeight: 36 }}>Create code</button>
        </div>
        {err && <div role="alert" style={{ fontSize: 12, color: "var(--color-accent-800)" }}>{err}</div>}
      </form>
      <div className="table-scroll">
        <table className="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Times used</th><th>Status</th><th /></tr></thead>
          <tbody>
            {promos.length === 0 && <tr><td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>No codes yet.</td></tr>}
            {promos.map((p) => (
              <tr key={p.code} className="fade-in">
                <td className="num" style={{ letterSpacing: ".06em" }}>{p.code}</td>
                <td>{p.type === "pct" ? `${p.value}% off` : `${fmt(p.value)} off`}</td>
                <td className="num">{p.uses}</td>
                <td>
                  <button className={`tag tag-btn ${p.active ? "tag-accent" : "tag-neutral"}`} title="Click to toggle" disabled={pending} onClick={() => run(() => togglePromo(p.code), p.active ? `${p.code} paused` : `${p.code} active`)}>
                    {p.active ? "Active" : "Paused"}
                  </button>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost" disabled={pending} onClick={() => window.confirm(`Delete code ${p.code}?`) && run(() => deletePromo(p.code), `${p.code} deleted`)} style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
