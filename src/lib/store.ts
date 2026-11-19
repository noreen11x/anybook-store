"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine, Condition } from "./data";

/**
 * Browser-only state: the basket, favourites, an applied promo code and toasts.
 * Everything else (catalogue, orders, accounts, settings) lives in the database.
 */

export interface Toast { id: number; msg: string }
export interface AppliedPromo { code: string; type: "pct" | "abs"; value: number }

interface State {
  cart: CartLine[];
  favs: string[];
  promo: AppliedPromo | null;
  toast: Toast | null;
}

interface Actions {
  flash: (msg: string) => void;
  dismissToast: () => void;
  toggleFav: (id: string) => void;
  addToCart: (id: string, cond: Condition, qty: number, title?: string) => void;
  setQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  moveToFavs: (key: string) => void;
  setPromo: (p: AppliedPromo | null) => void;
  clearCart: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      cart: [],
      favs: [],
      promo: null,
      toast: null,

      flash: (msg) => {
        clearTimeout(toastTimer);
        set({ toast: { id: Date.now(), msg } });
        toastTimer = setTimeout(() => set({ toast: null }), 3200);
      },
      dismissToast: () => set({ toast: null }),

      toggleFav: (id) => set((s) => ({ favs: s.favs.includes(id) ? s.favs.filter((f) => f !== id) : [...s.favs, id] })),

      addToCart: (id, cond, qty, title) => {
        const key = `${id}|${cond}`;
        set((s) => {
          const ex = s.cart.find((l) => l.key === key);
          return {
            cart: ex ? s.cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { key, bookId: id, cond, qty }],
          };
        });
        get().flash(title ? `“${title}” added to your basket` : "Added to your basket");
      },
      setQty: (key, d) => set((s) => ({ cart: s.cart.map((l) => (l.key === key ? { ...l, qty: Math.max(1, l.qty + d) } : l)) })),
      removeLine: (key) => set((s) => ({ cart: s.cart.filter((l) => l.key !== key) })),
      moveToFavs: (key) =>
        set((s) => {
          const line = s.cart.find((l) => l.key === key);
          if (!line) return {};
          return { cart: s.cart.filter((l) => l.key !== key), favs: s.favs.includes(line.bookId) ? s.favs : [...s.favs, line.bookId] };
        }),
      setPromo: (promo) => set({ promo }),
      clearCart: () => set({ cart: [], promo: null }),
    }),
    {
      // Hydrates from localStorage as soon as the module loads on the client. React's hydration
      // pass still reads the store's initial (empty) state as the server snapshot, so SSR markup matches.
      name: "anybook-basket-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cart, favs, promo }) => ({ cart, favs, promo }),
    },
  ),
);
