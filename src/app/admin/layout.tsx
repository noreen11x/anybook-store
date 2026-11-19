import { Suspense } from "react";
import { requireStaffPage } from "@/lib/auth";
import { getAdminData, getMe } from "@/lib/queries";
import { AdminProvider } from "./AdminProvider";
import { AdminShell } from "./AdminShell";

export const metadata = { title: { default: "Store admin", template: "%s · AnyBook admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPage();
  const [data, me] = await Promise.all([getAdminData(), getMe()]);
  return (
    <AdminProvider value={{ ...data, me: me! }}>
      <AdminShell>
        <Suspense>{children}</Suspense>
      </AdminShell>
    </AdminProvider>
  );
}
