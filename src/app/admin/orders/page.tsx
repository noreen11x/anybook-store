"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chips, Seg } from "@/components/Seg";
import type { OrderStatus } from "@/lib/data";
import { fmt } from "@/lib/format";
import { useState } from "react";
import { setOrderStatus } from "@/app/actions/admin";
import { CONDS } from "@/lib/data";
import { useAdmin, useRun } from "../AdminProvider";

type Filter = "all" | OrderStatus;
const STATUSES: OrderStatus[] = ["Processing", "Shipped", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { orders } = useAdmin();
  const { run, pending } = useRun();
  const [open, setOpen] = useState<string | null>(null);
  const filter = (params.get("filter") ?? "all") as Filter;
  const procN = orders.filter((o) => o.status === "Processing").length;
  const list = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <div className="text-muted num" style={{ fontSize: 13 }}>{orders.length} orders · {procN} unfulfilled</div>
        </div>
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <Seg<Filter>
            name="ofilter"
            value={filter}
            onChange={(f) => router.replace(f === "all" ? pathname : `${pathname}?filter=${f}`, { scroll: false })}
            options={[["all", "All"], ["Processing", "Unfulfilled"], ["Shipped", "Shipped"], ["Delivered", "Delivered"], ["Cancelled", "Cancelled"]]}
          />
        </div>
      </div>
      <div className="table-scroll">
        <table className="table" style={{ minWidth: 1040 }}>
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>No orders here.</td></tr>}
            {list.map((o) => [
              <tr key={o.no}>
                <td className="num"><button className="plain hover-accent" aria-expanded={open === o.no} onClick={() => setOpen(open === o.no ? null : o.no)} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{o.no}</button></td>
                <td>{o.date}</td>
                <td>{o.customer || "—"}<div className="text-muted" style={{ fontSize: 12 }}>{o.email}</div></td>
                <td className="num">{o.items}</td>
                <td className="num">{fmt(o.total)}</td>
                <td>
                  <span className="tag tag-neutral">
                    {o.payment.replace("Credit / debit card", "Card")}
                  </span>
                </td>
                <td style={{ minWidth: 380 }}>
                  <Chips<OrderStatus> options={STATUSES.map((s) => [s, s])} value={o.status} onChange={(s) => !pending && run(() => setOrderStatus(o.no, s), s === "Cancelled" ? `${o.no} cancelled — stock returned` : `${o.no} marked ${s.toLowerCase()}`)} />
                </td>
              </tr>,
              open === o.no && (
                <tr key={`${o.no}-d`} style={{ background: "var(--color-neutral-100)" }}>
                  <td colSpan={7} style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)", fontSize: 13 }}>
                      <div style={{ flex: "2 1 300px" }}>
                        {o.lines.map((l, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", padding: "3px 0" }}>
                            <span>{l.title} <span className="text-muted">· {CONDS.find((c) => c.k === l.cond)?.label} × {l.qty}</span></span>
                            <span className="num">{fmt(l.unit * l.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="num" style={{ flex: "1 1 180px" }}>
                        <div>Subtotal {fmt(o.subtotal)}</div>
                        {o.discount > 0 && <div>Discount − {fmt(o.discount)}</div>}
                        <div>Delivery {o.shipping ? fmt(o.shipping) : "Free"} ({o.shipMethod === "exp" ? "Express" : "Standard"})</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ),
            ])}
          </tbody>
        </table>
      </div>
    </>
  );
}
