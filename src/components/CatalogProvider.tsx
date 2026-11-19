"use client";

import { createContext, useContext } from "react";
import type { Book, Collection, Me, Settings } from "@/lib/data";

export interface CatalogValue {
  books: Book[]; // published only
  collections: Collection[]; // live only
  settings: Settings;
  me: Me | null;
}

const Ctx = createContext<CatalogValue | null>(null);

/** Server-fetched storefront data, refreshed on navigation and after server actions. */
export function CatalogProvider({ value, children }: { value: CatalogValue; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return v;
}

export const usePublished = () => useCatalog().books;
