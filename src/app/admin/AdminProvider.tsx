"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useTransition } from "react";
import type { Book, Collection, Me, Order, PromoCode, Review, Settings, User } from "@/lib/data";
import { useStore } from "@/lib/store";

export interface AdminValue {
  me: Me;
  books: Book[];
  collections: Collection[];
  orders: Order[];
  users: User[];
  promos: PromoCode[];
  reviews: Review[];
  settings: Settings;
}

const Ctx = createContext<AdminValue | null>(null);

export function AdminProvider({ value, children }: { value: AdminValue; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used inside <AdminProvider>");
  return v;
}

type ActionResult = { ok?: boolean; error?: string } | void;

/**
 * Runs a server action, toasts `success` (or the server's error), then refreshes server data.
 * Returns the action's result so callers can read ids etc.
 */
export function useRun() {
  const router = useRouter();
  const flash = useStore((s) => s.flash);
  const [pending, start] = useTransition();
  const run = useCallback(
    <R extends ActionResult>(action: () => Promise<R>, success?: string) =>
      new Promise<R>((resolve) => {
        start(async () => {
          const r = await action();
          if (r && "error" in r && r.error) flash(r.error);
          else if (success) flash(success);
          router.refresh();
          resolve(r);
        });
      }),
    [flash, router],
  );
  return { run, pending };
}
