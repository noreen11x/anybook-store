"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Seg } from "@/components/Seg";
import type { Review } from "@/lib/data";
import { stars } from "@/lib/format";
import { deleteReview, setReviewStatus } from "@/app/actions/admin";
import { useAdmin, useRun } from "../AdminProvider";

type Filter = "all" | Review["status"];

export default function ReviewsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { reviews, books } = useAdmin();
  const { run, pending } = useRun();
  const filter = (params.get("filter") ?? "all") as Filter;
  const list = reviews.filter((r) => filter === "all" || r.status === filter);
  const pend = reviews.filter((r) => r.status === "Pending").length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Reviews</h1>
          <div className="text-muted" style={{ fontSize: 13 }}>{pend ? `${pend} waiting for approval` : "All caught up"}</div>
        </div>
        <Seg<Filter>
          name="rfilter"
          value={filter}
          onChange={(f) => router.replace(f === "all" ? pathname : `${pathname}?filter=${f}`, { scroll: false })}
          options={[["all", "All"], ["Pending", "Pending"], ["Published", "Published"], ["Hidden", "Hidden"]]}
        />
      </div>
      {list.length === 0 && <p className="text-muted">Nothing here.</p>}
      <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--color-divider)" }}>
        {list.map((r) => (
          <article key={r.id} className="row-hover" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3) var(--space-6)", justifyContent: "space-between", padding: "var(--space-4) var(--space-2)", borderBottom: "1px solid var(--color-divider)", animation: "abUp .4s var(--ease) both" }}>
            <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{books.find((b) => b.id === r.bookId)?.title ?? "Deleted book"}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>· {r.author} · {r.date}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--color-accent-700)" }} aria-label={`${r.stars} out of 5`}>{stars(r.stars)}</div>
              <p className="justify" style={{ margin: 0, fontSize: 14 }}>{r.text}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span className={`tag ${r.status === "Published" ? "tag-accent" : r.status === "Pending" ? "tag-outline" : "tag-neutral"}`}>{r.status}</span>
              {r.status !== "Published" && <button className="btn btn-primary" disabled={pending} onClick={() => run(() => setReviewStatus(r.id, "Published"), "Review published")} style={{ padding: "5px 12px", fontSize: 13 }}>Approve</button>}
              {r.status !== "Hidden" && <button className="btn btn-secondary" disabled={pending} onClick={() => run(() => setReviewStatus(r.id, "Hidden"), "Review hidden")} style={{ padding: "5px 12px", fontSize: 13 }}>Hide</button>}
              <button className="btn btn-ghost" disabled={pending} onClick={() => window.confirm("Delete this review permanently?") && run(() => deleteReview(r.id), "Review deleted")} style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
