import { getMe, getMyOrders } from "@/lib/queries";
import { AccountView, SignInView } from "./AccountClient";

export const metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; denied?: string }> }) {
  const sp = await searchParams;
  const me = await getMe();
  // only allow same-site relative redirects
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/account";
  if (!me) return <SignInView next={next} initialMode={sp.mode === "up" ? "up" : "in"} />;
  const orders = await getMyOrders(me.id);
  return <AccountView me={me} orders={orders} denied={sp.denied === "1"} />;
}
