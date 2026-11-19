import Link from "next/link";
import { cookies } from "next/headers";
import { Check } from "lucide-react";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, fmt, fmtDay } from "@/lib/format";
import { toOrder } from "@/lib/queries";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const { no } = await searchParams;
  const [user, jar] = await Promise.all([getUser(), cookies()]);
  const guestOrders = (jar.get("ab_orders")?.value ?? "").split(",");
  const row = no ? await db.order.findUnique({ where: { no }, include: { lines: true } }) : null;
  // Only the buyer can see their confirmation: their account, or the browser that placed it.
  const allowed = row && ((user && row.userId === user.id) || guestOrders.includes(row.no));

  if (!row || !allowed) {
    return (
      <div className="empty enter">
        <h3>No recent order to show.</h3>
        <Link href="/books" className="btn btn-primary">Browse books</Link>
      </div>
    );
  }

  const order = toOrder(row);
  const placed = row.createdAt;
  const eta = order.shipMethod === "exp" ? fmtDay(addDays(placed, 1)) : `${fmtDay(addDays(placed, 2))} – ${fmtDay(addDays(placed, 4))}`;

  return (
    <section className="enter" style={{ padding: "80px 0", maxWidth: 620, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid var(--color-accent)", display: "grid", placeItems: "center", color: "var(--color-accent)", animation: "abPop .8s var(--ease) .2s both", boxShadow: "0 0 0 8px var(--color-accent-100)" }}>
        <Check size={28} strokeWidth={1.6} />
      </div>
      <h1 className="page-title">Thank you, {order.customer.split(" ")[0]}.</h1>
      <p style={{ margin: 0, fontSize: 16, color: "var(--color-neutral-800)" }}>
        Your order <strong className="num" style={{ fontWeight: 600 }}>{order.no}</strong> is confirmed. We&apos;ll send updates to {order.email}.
      </p>
      <table className="table" style={{ maxWidth: 420, fontSize: 14, textAlign: "left" }}>
        <tbody>
          {order.lines.map((l, i) => (
            <tr key={i}>
              <td>{l.title} <span className="text-muted">× {l.qty}</span></td>
              <td className="num" style={{ textAlign: "right" }}>{fmt(l.unit * l.qty)}</td>
            </tr>
          ))}
          <tr><td className="text-muted">Total</td><td className="num" style={{ textAlign: "right" }}>{fmt(order.total)}</td></tr>
          <tr><td className="text-muted">Estimated delivery</td><td style={{ textAlign: "right" }}>{eta}</td></tr>
          <tr><td className="text-muted">Payment</td><td style={{ textAlign: "right" }}>{order.payment}</td></tr>
        </tbody>
      </table>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", justifyContent: "center" }}>
        {user ? (
          <Link href="/account" className="btn btn-primary">Track my order</Link>
        ) : (
          <Link href="/account?mode=up" className="btn btn-primary">Create an account to track it</Link>
        )}
        <Link href="/books" className="btn btn-secondary">Keep browsing</Link>
      </div>
    </section>
  );
}
