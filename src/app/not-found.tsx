import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="empty" style={{ minHeight: "100vh", justifyContent: "center" }}>
      <Link href="/" aria-label="AnyBook home"><Logo height={40} /></Link>
      <h1 style={{ margin: "var(--space-6) 0 0", fontWeight: 400, fontSize: 44 }}>Page not found</h1>
      <p className="text-muted" style={{ margin: 0 }}>That page has wandered off the shelf.</p>
      <Link href="/books" className="btn btn-primary">Browse books</Link>
    </main>
  );
}
