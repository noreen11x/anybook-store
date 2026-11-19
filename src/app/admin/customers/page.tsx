"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Chips, Seg } from "@/components/Seg";
import type { User } from "@/lib/data";
import { fmt, initials } from "@/lib/format";
import { updateUser } from "@/app/actions/admin";
import { useAdmin, useRun } from "../AdminProvider";

type Filter = "all" | "cust" | "staff" | "blocked";
const TAG: Record<string, string> = { Delivered: "tag-neutral", Processing: "tag-accent", Shipped: "tag-outline", Cancelled: "tag-neutral" };

export default function CustomersPage() {
  const { users, orders, me } = useAdmin();
  const { run, pending } = useRun();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const stat = (u: User) => ({ orders: u.orders, spent: u.spent, mine: orders.filter((o) => o.userId === u.id).slice(0, 8) });

  const q = query.trim().toLowerCase();
  const list = users.filter(
    (u) =>
      (filter === "all" || (filter === "cust" && u.role === "Customer") || (filter === "staff" && u.role !== "Customer") || (filter === "blocked" && u.status === "Blocked")) &&
      (!q || `${u.name} ${u.email} ${u.city}`.toLowerCase().includes(q)),
  );
  const cu = users.find((u) => u.id === openId);
  const cuStat = cu ? stat(cu) : null;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Customers</h1>
          <div className="text-muted num" style={{ fontSize: 13 }}>
            {users.filter((u) => u.role === "Customer").length} customers · {users.filter((u) => u.role !== "Customer").length} staff
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-3)" }}>
        <input className="input" type="search" placeholder="Search name, email or city" aria-label="Search customers" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: "1 1 220px", maxWidth: 340 }} />
        <Seg<Filter> name="ufilter" value={filter} onChange={setFilter} options={[["all", "All"], ["cust", "Customers"], ["staff", "Staff"], ["blocked", "Blocked"]]} />
      </div>
      <div className="table-scroll">
        <table className="table" style={{ minWidth: 720 }}>
          <thead><tr><th>User</th><th>City</th><th>Joined</th><th>Orders</th><th>Spent</th><th>Role</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={8} className="text-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>No one matches.</td></tr>}
            {list.map((u) => {
              const st = stat(u);
              return (
                <tr key={u.id} className="fade-in">
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", border: "1px solid var(--color-accent-300)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--color-accent-800)" }}>{initials(u.name)}</span>
                      <span>
                        <button className="plain hover-accent" onClick={() => setOpenId(u.id)} style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>{u.name}</button>
                        <div className="text-muted" style={{ fontSize: 12 }}>{u.email}</div>
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.city}</td>
                  <td style={{ fontSize: 13 }}>{u.joined}</td>
                  <td className="num">{st.orders}</td>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>{fmt(st.spent)}</td>
                  <td><span className={`tag ${u.role === "Customer" ? "tag-neutral" : "tag-outline"}`}>{u.role}</span></td>
                  <td><span className={`tag ${u.status === "Active" ? "tag-accent" : "tag-neutral"}`}>{u.status}</span></td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost" onClick={() => setOpenId(u.id)} style={{ fontSize: 13 }}>View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cu && cuStat && (
        <Dialog onClose={() => setOpenId(null)} width={520} label={cu.name}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid var(--color-accent)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-accent-800)" }}>{initials(cu.name)}</span>
            <div style={{ flex: 1 }}>
              <div className="dialog-title">{cu.name}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>{cu.email} · {cu.city}</div>
            </div>
            <button className="btn btn-icon" onClick={() => setOpenId(null)} aria-label="Close"><X size={18} strokeWidth={1.6} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--color-divider)", borderBottom: "1px solid var(--color-divider)" }}>
            {[["Orders", String(cuStat.orders)], ["Spent", fmt(cuStat.spent)], ["Joined", cu.joined]].map(([k, v]) => (
              <div key={k} style={{ padding: "var(--space-3) 0" }}>
                <div className="card-kicker">{k}</div>
                <div className="num" style={{ fontFamily: "var(--font-heading)", fontSize: 26 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "flex-end" }}>
            <div className="field">
              <label>Role</label>
              <Chips<User["role"]> options={[["Customer", "Customer"], ["Staff", "Staff"], ["Admin", "Admin"]]} value={cu.role} onChange={(role) => run(() => updateUser(cu.id, { role }), `${cu.name} is now ${role}`)} />
            </div>
            <button className="btn btn-secondary" disabled={pending || cu.id === me.id} onClick={() => run(() => updateUser(cu.id, { status: cu.status === "Blocked" ? "Active" : "Blocked" }), cu.status === "Blocked" ? "User unblocked" : "User blocked and signed out")}>
              {cu.status === "Blocked" ? "Unblock user" : "Block user"}
            </button>
          </div>
          <div>
            <h6 style={{ margin: "0 0 var(--space-2)" }}>Recent orders</h6>
            {cuStat.mine.length === 0 && <div className="text-muted" style={{ fontSize: 13 }}>No orders yet.</div>}
            {cuStat.mine.map((o) => (
              <div key={o.no} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <span className="num">{o.no} · {o.date}</span>
                <span><span className="num">{fmt(o.total)}</span> <span className={`tag ${TAG[o.status]}`}>{o.status}</span></span>
              </div>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
