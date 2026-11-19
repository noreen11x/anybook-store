"use client";

import { useEffect, type ReactNode } from "react";

export function Dialog({ onClose, children, width, label }: { onClose: () => void; children: ReactNode; width?: number; label: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" style={{ zIndex: 60, animation: "abFade .25s both" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={label} style={{ width: width ? `min(${width}px, 100%)` : undefined, animation: "abToast .35s var(--ease) both" }}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDelete({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog onClose={onCancel} label={`Delete ${title}`}>
      <div className="dialog-title">Delete “{title}”?</div>
      <div className="dialog-body">This removes the product and its stock from the shop. Past orders are not affected.</div>
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={onCancel} autoFocus>Cancel</button>
        <button className="btn btn-primary" onClick={onConfirm}>Delete product</button>
      </div>
    </Dialog>
  );
}
