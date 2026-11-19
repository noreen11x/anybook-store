import { Suspense } from "react";
import { CatalogProvider } from "@/components/CatalogProvider";
import { ShopFooter, ShopHeader } from "@/components/ShopChrome";
import { getCatalog } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <CatalogProvider value={catalog}>
      <div className="site">
        <Suspense fallback={<div style={{ height: 120 }} />}>
          <ShopHeader />
        </Suspense>
        <main className="page-main container">{children}</main>
        <ShopFooter />
      </div>
    </CatalogProvider>
  );
}
