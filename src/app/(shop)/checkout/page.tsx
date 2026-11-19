"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SummaryRows } from "@/components/OrderSummary";
import { Chips } from "@/components/Seg";
import { CITIES, PayMethod, Profile, ShipMethod } from "@/lib/data";
import { placeOrder } from "@/app/actions/shop";
import { useCatalog } from "@/components/CatalogProvider";
import { fmt } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useBasket } from "@/lib/totals";

const PAY_OPTS: [PayMethod, string, string][] = [
  ["card", "Credit / debit card", "Card machine on delivery · Visa, Mastercard, Meeza"],
  ["cod", "Cash on delivery", "Pay the courier in cash or by card"],
  ["wallet", "Mobile wallet", "Vodafone Cash, InstaPay"],
];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ship, setShip] = useState<ShipMethod>("std");
  const [pay, setPay] = useState<PayMethod>("card");
  const [err, setErr] = useState("");
  const [placing, startPlacing] = useTransition();
  const [done, setDone] = useState(false);
  const t = useBasket(ship);
  const { me } = useCatalog();
  const clearCart = useStore((s) => s.clearCart);
  const cart = useStore((s) => s.cart);
  const promo = useStore((s) => s.promo);
  const [profile, setProfileState] = useState<Profile>({
    name: me?.name ?? "", phone: me?.phone ?? "", email: me?.email ?? "", street: me?.street ?? "", city: me?.city || "Cairo", zip: me?.zip ?? "",
  });
  const setProfile = (p: Partial<Profile>) => setProfileState((x) => ({ ...x, ...p }));

  const payOpts = PAY_OPTS.filter(([k]) => t.settings.payments[k]);
  useEffect(() => {
    if (payOpts.length && !payOpts.some(([k]) => k === pay)) setPay(payOpts[0][0]);
  }, [payOpts, pay]);

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  if (!t.lines.length && !done) {
    return (
      <section className="enter" style={{ paddingTop: "var(--space-8)" }}>
        <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Checkout</h1>
        <div className="empty" style={{ borderTop: "1px solid var(--color-divider)" }}>
          <h3>Your basket is empty.</h3>
          <Link href="/books" className="btn btn-primary">Browse books</Link>
        </div>
      </section>
    );
  }

  const field = (k: keyof typeof profile, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field">
      <label htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} className="input" value={profile[k]} onChange={(e) => setProfile({ [k]: e.target.value })} {...props} />
    </div>
  );

  const toPayment = () => {
    if (!profile.name.trim() || !profile.phone.trim() || !profile.street.trim() || !/.+@.+\..+/.test(profile.email)) {
      setErr("Please add your name, mobile number, a valid email and a street address.");
      return;
    }
    setErr("");
    go(2);
  };

  const submit = () =>
    startPlacing(async () => {
      const r = await placeOrder({
        lines: cart.map(({ bookId, cond, qty }) => ({ bookId, cond, qty })),
        address: profile, ship, pay, promo: promo?.code ?? null,
      });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setDone(true);
      clearCart();
      router.push(`/checkout/confirmation?no=${encodeURIComponent(r.no)}`);
    });

  const shipOpts: [ShipMethod, string, string, string][] = [
    ["std", "Standard delivery", "2–4 working days", t.freeStd ? "Free" : fmt(+t.settings.std)],
    ["exp", "Express delivery", "Next working day in Cairo & Giza", fmt(+t.settings.exp)],
  ];
  const payLabel = PAY_OPTS.find(([k]) => k === pay)?.[1] ?? "";

  return (
    <section className="enter" style={{ paddingTop: "var(--space-8)" }}>
      <h1 className="page-title" style={{ marginBottom: "var(--space-4)" }}>Checkout</h1>
      <ol className="steps" style={{ listStyle: "none", margin: "0 0 var(--space-6)", paddingLeft: 0 }}>
        {["Delivery", "Payment", "Review"].map((label, i) => {
          const n = i + 1;
          const cls = step === n ? "cur" : step > n ? "done" : "";
          return (
            <li key={label}>
              <button className={`step ${cls}`} disabled={n >= step} onClick={() => go(n)} aria-current={step === n ? "step" : undefined}>
                <span className="n">{n}</span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="two-col">
        <div className="main" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {step === 1 && (
            <>
              <h3 style={{ margin: 0, fontWeight: 400, animation: "abUp .5s var(--ease) both" }}>Delivery details</h3>
              <div className="form-grid">
                {field("name", "Full name", { autoComplete: "name" })}
                {field("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel" })}
              </div>
              {field("email", "Email", { type: "email", autoComplete: "email" })}
              {field("street", "Street address", { autoComplete: "street-address" })}
              <div className="form-grid">
                <div className="field">
                  <label>City</label>
                  <Chips options={CITIES.map((c) => [c, c] as [string, string])} value={profile.city} onChange={(city) => setProfile({ city })} />
                </div>
                {field("zip", "Postal code", { autoComplete: "postal-code", inputMode: "numeric" })}
              </div>
              <h5 style={{ margin: "var(--space-2) 0 0" }}>Delivery method</h5>
              {shipOpts.map(([k, label, eta, price]) => (
                <label key={k} className="radio radio-card" style={{ justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="radio" name="ship" checked={ship === k} onChange={() => setShip(k)} />
                    <span className="dot" />
                    <span>{label}<br /><span className="text-muted" style={{ fontSize: 12 }}>{eta}</span></span>
                  </span>
                  <span className="num">{price}</span>
                </label>
              ))}
              {err && <div role="alert" style={{ border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", fontSize: 14, color: "var(--color-accent-800)" }}>{err}</div>}
              <button className="btn btn-primary" onClick={toPayment} style={{ alignSelf: "flex-start", padding: "11px 22px", fontSize: 15 }}>Continue to payment</button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ margin: 0, fontWeight: 400, animation: "abUp .5s var(--ease) both" }}>Payment</h3>
              {payOpts.length === 0 && <p className="text-muted">No payment methods are enabled right now.</p>}
              {payOpts.map(([k, label, note]) => (
                <label key={k} className="radio radio-card">
                  <input type="radio" name="pay" checked={pay === k} onChange={() => setPay(k)} />
                  <span className="dot" />
                  <span>{label}<br /><span className="text-muted" style={{ fontSize: 12 }}>{note}</span></span>
                </label>
              ))}
              {pay === "card" && (
                <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
                  Our courier carries a card machine — pay with Visa, Mastercard or Meeza when your books arrive.
                </p>
              )}
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className="btn btn-secondary" onClick={() => go(1)}>Back</button>
                <button className="btn btn-primary" disabled={!payOpts.length} onClick={() => go(3)} style={{ padding: "11px 22px", fontSize: 15 }}>Review order</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ margin: 0, fontWeight: 400, animation: "abUp .5s var(--ease) both" }}>Review &amp; place order</h3>
              <div className="form-grid">
                <div className="card">
                  <div className="card-kicker">Deliver to</div>
                  <div style={{ fontSize: 14 }}>{profile.name}<br />{profile.street}<br />{profile.city} {profile.zip}<br />{profile.phone}</div>
                  <button className="btn btn-ghost" onClick={() => go(1)} style={{ alignSelf: "flex-start", fontSize: 13 }}>Edit</button>
                </div>
                <div className="card">
                  <div className="card-kicker">Delivery &amp; payment</div>
                  <div style={{ fontSize: 14 }}>{ship === "exp" ? "Express delivery" : "Standard delivery"}<br />{payLabel}</div>
                  <button className="btn btn-ghost" onClick={() => go(2)} style={{ alignSelf: "flex-start", fontSize: 13 }}>Edit</button>
                </div>
              </div>
              {err && <div role="alert" style={{ border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", fontSize: 14, color: "var(--color-accent-800)" }}>{err} <Link href="/basket">Review basket</Link></div>}
              <button className="btn btn-primary" onClick={submit} disabled={placing || t.stockIssues.length > 0} style={{ alignSelf: "flex-start", padding: "12px 26px", fontSize: 16 }}>
                {placing ? "Placing order…" : <>Place order · <span className="num">{fmt(t.total)}</span></>}
              </button>
              <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>By placing your order you agree to AnyBook&apos;s terms of sale and returns policy.</p>
            </>
          )}
        </div>

        <aside className="card side" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
          <div className="card-title" style={{ fontSize: 22 }}>In your basket</div>
          {t.lines.map((l) => (
            <div key={l.key} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontSize: 13, paddingBottom: "var(--space-2)", borderBottom: "1px solid var(--color-divider)" }}>
              <span>
                {l.book.title} <span className="text-muted">× {l.qty}</span>
                <br />
                <span className="text-muted" style={{ fontSize: 12 }}>{l.condLabel}</span>
              </span>
              <span className="num" style={{ whiteSpace: "nowrap" }}>{fmt(l.total)}</span>
            </div>
          ))}
          <SummaryRows t={t} />
          <div className="total-row"><span>Total</span><span style={{ fontSize: 24 }}>{fmt(t.total)}</span></div>
        </aside>
      </div>
    </section>
  );
}
