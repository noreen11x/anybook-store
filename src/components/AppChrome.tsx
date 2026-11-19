"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export function Toast() {
  const toast = useStore((s) => s.toast);
  const dismiss = useStore((s) => s.dismissToast);
  if (!toast) return null;
  const basket = /basket/i.test(toast.msg);
  return (
    <div key={toast.id} className="card elev-lg toast" role="status" aria-live="polite">
      <span style={{ fontSize: 14 }}>{toast.msg}</span>
      {basket && (
        <Link href="/basket" className="btn btn-primary" onClick={dismiss} style={{ padding: "6px 12px", fontSize: 13, whiteSpace: "nowrap" }}>
          View basket
        </Link>
      )}
    </div>
  );
}
