"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { adjustStock } from "@/app/actions/admin";
import { Seg } from "@/components/Seg";
import type { Order } from "@/lib/data";
import { fmt } from "@/lib/format";
import { useAdmin, useRun } from "./AdminProvider";

type Range = "1" | "7" | "30";
const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Buckets real orders into the selected window and the one before it. */
function analyse(orders: Order[], rng: Range) {
  const now = new Date();
  const live = orders.filter((o) => o.status !== "Cancelled").map((o) => ({ ...o, t: new Date(o.createdAt).getTime() }));
  let start: number, step: number, N: number;
  if (rng === "1") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    step = 2 * 3600000;
    N = 12;
  } else {
    N = +rng;
    step = DAY;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - (N - 1) * DAY;
  }
  const span = N * step;
  const bucket = (from: number) => {
    const a = Array<number>(N).fill(0);
    const c = Array<number>(N).fill(0);
    for (const o of live) {
      const i = Math.floor((o.t - from) / step);
      if (i >= 0 && i < N) {
        a[i] += o.total;
        c[i] += 1;
      }
    }
    return { sales: a, counts: c };
  };
  const cur = bucket(start);
  const prev = bucket(start - span);
  const inCur = live.filter((o) => o.t >= start && o.t < start + span);
  const inPrev = live.filter((o) => o.t >= start - span && o.t < start);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const returningPct = (list: typeof live, from: number) => {
    const buyers = new Set(list.map((o) => o.userId ?? o.email));
    if (!buyers.size) return 0;
    const before = new Set(live.filter((o) => o.t < from).map((o) => o.userId ?? o.email));
    return Math.round(([...buyers].filter((b) => before.has(b)).length / buyers.size) * 100);
  };
  const totals = {
    sales: sum(cur.sales), prevSales: sum(prev.sales),
    orders: inCur.length, prevOrders: inPrev.length,
    aov: inCur.length ? sum(cur.sales) / inCur.length : 0, prevAov: inPrev.length ? sum(prev.sales) / inPrev.length : 0,
    ret: returningPct(inCur, start), prevRet: returningPct(inPrev, start - span),
  };
  const aovSeries = cur.sales.map((v, i) => (cur.counts[i] ? v / cur.counts[i] : 0));
  const labelIdx = rng === "1" ? [0, 3, 6, 9, 11] : rng === "7" ? [0, 1, 2, 3, 4, 5, 6] : [0, 7, 14, 21, 29];
  const labels = labelIdx.map((i) => {
    const d = new Date(start + i * step);
    if (rng === "1") return `${d.getHours() % 12 || 12}${d.getHours() < 12 ? "am" : "pm"}`;
    if (rng === "7") return WD[d.getDay()];
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  });
  // top sellers by copies sold in the window
  const top = new Map<string, { title: string; units: number; rev: number }>();
  for (const o of inCur) for (const l of o.lines) {
    const k = l.bookId ?? l.title;
    const e = top.get(k) ?? { title: l.title, units: 0, rev: 0 };
    e.units += l.qty;
    e.rev += l.qty * l.unit;
    top.set(k, e);
  }
  const topSellers = [...top.values()].sort((a, b) => b.units - a.units || b.rev - a.rev).slice(0, 5);
  return { cur, prev, totals, aovSeries, labels, topSellers, N };
}

const delta = (a: number, b: number) => {
  if (!b) return a ? "New" : "0%";
  const d = ((a - b) / b) * 100;
  return `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}%`;
};

export default function AdminHome() {
  const [rng, setRng] = useState<Range>("30");
  const { books, orders, reviews, settings, me } = useAdmin();
  const { run, pending } = useRun();
  const lowAt = settings.lowAt;

  const a = useMemo(() => analyse(orders, rng), [orders, rng]);
  const isLow = (b: (typeof books)[number]) => b.stockNew <= lowAt;
  const procN = orders.filter((o) => o.status === "Processing").length;
  const pendN = reviews.filter((r) => r.status === "Pending").length;
  const lowN = books.filter(isLow).length;
  const draftN = books.filter((b) => b.status === "Draft").length;

  const { N } = a;
  const mx = Math.max(1, ...a.cur.sales, ...a.prev.sales) * 1.08;
  const X = (i: number) => (N > 1 ? (i / (N - 1)) * 600 : 300);
  const Y = (v: number) => 200 - (v / mx) * 190;
  const path = (arr: number[]) => "M" + arr.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" L");
  const spark = (arr: number[]) => {
    const mn = Math.min(...arr), mxx = Math.max(...arr);
    return arr.map((v, i) => `${((i / Math.max(1, arr.length - 1)) * 100).toFixed(1)},${(29 - ((v - mn) / (mxx - mn || 1)) * 28).toFixed(1)}`).join(" ");
  };
  const t = a.totals;
  const kpis: [string, string, string, number[]][] = [
    ["Total sales", fmt(t.sales), delta(t.sales, t.prevSales), a.cur.sales],
    ["Orders", String(t.orders), delta(t.orders, t.prevOrders), a.cur.counts],
    ["Average order value", fmt(t.aov), delta(t.aov, t.prevAov), a.aovSeries],
    ["Returning customers", `${t.ret}%`, delta(t.ret, t.prevRet), a.cur.counts],
  ];
  const maxU = Math.max(1, ...a.topSellers.map((s) => s.units));
  const todos: [number, string, string][] = [
    [procN, procN === 1 ? "order to fulfil" : "orders to fulfil", "/admin/orders?filter=Processing"],
    [pendN, pendN === 1 ? "review to moderate" : "reviews to moderate", "/admin/reviews?filter=Pending"],
    [lowN, lowN === 1 ? "product low on stock" : "products low on stock", "/admin/inventory"],
    [draftN, draftN === 1 ? "draft product" : "draft products", "/admin/products?filter=draft"],
  ];

  return (
    <>
      <div className="admin-head" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 suppressHydrationWarning>{greeting()}, {me.name.split(" ")[0]}</h1>
          <div className="text-muted" style={{ fontSize: 13 }}>Here’s how AnyBook is doing · {{ "1": "today", "7": "last 7 days", "30": "last 30 days" }[rng]}</div>
        </div>
        <Seg<Range> name="arange" value={rng} onChange={setRng} options={[["1", "Today"], ["7", "7 days"], ["30", "30 days"]]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
        {kpis.map(([label, value, d, arr], i) => (
          <div key={label} className="card lift-card" style={{ padding: "var(--space-4)", gap: 6, animation: `abUp .6s var(--ease) ${i * 0.07}s both` }}>
            <div className="card-kicker" style={{ color: "var(--color-neutral-700)" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)" }}>
              <span key={value} className="num" style={{ fontFamily: "var(--font-heading)", fontSize: 32, lineHeight: 1, animation: "abUp .4s var(--ease)" }}>{value}</span>
              <span className={`tag num ${d.startsWith("−") ? "tag-neutral" : "tag-accent"}`} title="vs previous period">{d}</span>
            </div>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height: 34, overflow: "visible" }} aria-hidden>
              <polyline points={spark(arr)} style={{ fill: "none", stroke: "var(--color-accent)", strokeWidth: 1.5, vectorEffect: "non-scaling-stroke", strokeLinejoin: "round" }} />
            </svg>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        <div className="card" style={{ padding: "var(--space-4) var(--space-6)", gap: "var(--space-3)", gridColumn: "1 / -1", minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-2)" }}>
            <div>
              <div className="card-title" style={{ fontSize: 20 }}>Sales over time</div>
              <div className="num" style={{ fontFamily: "var(--font-heading)", fontSize: 30 }}>{fmt(t.sales)}</div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", fontSize: 12, color: "var(--color-neutral-700)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 2, background: "var(--color-accent)" }} />This period</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, borderTop: "2px dashed var(--color-neutral-400)" }} />Previous</span>
            </div>
          </div>
          <svg viewBox="0 0 600 210" preserveAspectRatio="none" style={{ width: "100%", height: 220, overflow: "visible" }} role="img" aria-label={`Sales over time, total ${fmt(t.sales)}`}>
            <path d="M0 10H600M0 60H600M0 110H600M0 160H600" style={{ stroke: "var(--color-divider)", strokeWidth: 1, vectorEffect: "non-scaling-stroke" }} />
            <path d="M0 200H600" style={{ stroke: "var(--color-neutral-400)", strokeWidth: 1, vectorEffect: "non-scaling-stroke" }} />
            <path key={`a${rng}`} d={`${path(a.cur.sales)} L600 200 L0 200 Z`} style={{ fill: "var(--color-accent-100)", stroke: "none", animation: "abFade 1s both" }} />
            <path d={path(a.prev.sales)} style={{ fill: "none", stroke: "var(--color-neutral-400)", strokeWidth: 1.5, strokeDasharray: "4 4", vectorEffect: "non-scaling-stroke" }} />
            <path key={`l${rng}`} d={path(a.cur.sales)} pathLength={1} style={{ fill: "none", stroke: "var(--color-accent)", strokeWidth: 2, vectorEffect: "non-scaling-stroke", strokeLinejoin: "round", strokeDasharray: 1, strokeDashoffset: 1, animation: "abDraw 1.4s var(--ease) forwards" }} />
          </svg>
          <div className="num" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-neutral-700)" }}>
            {a.labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-4)", gap: 0 }}>
          <div className="card-title" style={{ fontSize: 20, marginBottom: "var(--space-2)" }}>Things to do</div>
          {todos.map(([n, label, href]) => (
            <Link key={label} href={href} className="todo" style={{ textDecoration: "none" }}>
              <span className={`ring${n ? " hot" : ""}`}>{n}</span>
              <span>{label}</span>
              <ChevronRight size={14} strokeWidth={1.6} />
            </Link>
          ))}
        </div>

        <div className="card" style={{ padding: "var(--space-4)", gap: "var(--space-2)" }}>
          <div className="card-title" style={{ fontSize: 20 }}>Top sellers</div>
          {a.topSellers.length === 0 && <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>No sales in this period yet.</p>}
          {a.topSellers.map((s, i) => (
            <div key={s.title} style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", gap: "var(--space-2)", alignItems: "center", fontSize: 13 }}>
              <span className="text-muted num">{i + 1}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, lineHeight: 1.1 }}>{s.title}</span>
                <span style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-200)" }}>
                  <span key={rng} style={{ display: "block", height: "100%", width: `${Math.round((s.units / maxU) * 100)}%`, background: "var(--color-accent-400)", borderRadius: 2, animation: "abGrow 1s var(--ease) both" }} />
                </span>
              </span>
              <span className="num" style={{ textAlign: "right" }}>{s.units} sold<br /><span className="text-muted" style={{ fontSize: 11 }}>{fmt(s.rev)}</span></span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "var(--space-4)", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="card-title" style={{ fontSize: 20 }}>Low stock</div>
            <Link href="/admin/inventory" className="btn btn-ghost" style={{ fontSize: 13 }}>Inventory →</Link>
          </div>
          {lowN === 0 && <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>Everything is well stocked.</p>}
          {books.filter(isLow).slice(0, 5).map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--color-divider)" }}>
              <Link href={`/admin/products/${b.id}`} className="plain hover-accent" style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-text)", textDecoration: "none" }}>{b.title}</Link>
              <span className="num" style={{ color: "var(--color-accent-800)" }}>{b.stockNew === 0 ? "Out of stock" : `${b.stockNew} left`}</span>
              <button className="btn btn-secondary" disabled={pending} onClick={() => run(() => adjustStock([b.id], 10), `Restocked “${b.title}”`)} style={{ padding: "3px 9px", fontSize: 12 }}>+10</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
