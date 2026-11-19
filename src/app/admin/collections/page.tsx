"use client";

import { useEffect, useState } from "react";
import { createCollection, deleteCollection, saveCollection } from "@/app/actions/admin";
import { Seg } from "@/components/Seg";
import { Collection, TONES } from "@/lib/data";
import { plural } from "@/lib/format";
import { useAdmin, useRun } from "../AdminProvider";

export default function CollectionsPage() {
  const { collections, books } = useAdmin();
  const { run, pending } = useRun();
  const [colId, setColId] = useState<string | undefined>(collections[0]?.id);
  const [draft, setDraft] = useState<Collection | null>(null);

  const [awaiting, setAwaiting] = useState<string | null>(null);
  const found = collections.some((c) => c.id === colId);
  useEffect(() => {
    // fall back to the first collection when the selected one is deleted (but not while a new one is arriving)
    if (!found && colId !== awaiting) setColId(collections[0]?.id);
    if (found && colId === awaiting) setAwaiting(null);
  }, [collections, colId, found, awaiting]);
  // load the selected collection into an editable draft — only when switching, so unsaved edits survive refreshes
  useEffect(() => {
    setDraft(collections.find((c) => c.id === colId) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colId, found]);

  const saved = collections.find((c) => c.id === colId);
  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);
  const patch = (p: Partial<Collection>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const pick = (id: string) => {
    if (dirty && !window.confirm("Discard unsaved changes to this collection?")) return;
    setColId(id);
  };

  return (
    <>
      <div className="admin-head" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1>Collections</h1>
          <div className="text-muted" style={{ fontSize: 13 }}>Curated shelves shown on the home page and in the shop</div>
        </div>
        <button
          className="btn btn-primary"
          disabled={pending}
          onClick={() =>
            run(() => createCollection()).then((r) => {
              if (r.ok) {
                setAwaiting(r.id);
                setColId(r.id);
              }
            })
          }
          style={{ padding: "10px 18px" }}
        >
          + New collection
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {collections.length === 0 && <p className="text-muted">No collections yet.</p>}
          {collections.map((c) => (
            <button key={c.id} onClick={() => pick(c.id)} className={`card col-item${c.id === colId ? " on" : ""}`} aria-pressed={c.id === colId}>
              <span className="card-title">{c.name || "Untitled"}</span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span className="card-meta num">{plural(c.bookIds.length, "book")}</span>
                <span className={`tag ${c.status === "Live" ? "tag-accent" : "tag-neutral"}`}>{c.status}</span>
                {c.showOnHome && <span className="tag tag-outline">On home</span>}
              </span>
            </button>
          ))}
        </div>
        <div style={{ flex: "999 1 380px", minWidth: 0 }}>
          {draft && (
            <div key={draft.id} className="card" style={{ padding: "var(--space-6)", gap: "var(--space-4)", animation: "abUp .4s var(--ease) both" }}>
              <div className="field">
                <label htmlFor="c-name">Collection name</label>
                <input id="c-name" className="input" value={draft.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} style={{ fontFamily: "var(--font-heading)", fontSize: 20 }} />
              </div>
              <div className="field">
                <label htmlFor="c-desc">Description</label>
                <textarea id="c-desc" className="input" value={draft.description} maxLength={500} onChange={(e) => patch({ description: e.target.value })} style={{ minHeight: 70 }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div className="field"><label>Status</label><Seg<"Live" | "Hidden"> name="cstatus" value={draft.status} onChange={(status) => patch({ status })} options={[["Live", "Live"], ["Hidden", "Hidden"]]} /></div>
                <div className="field"><label>Home page</label><Seg<boolean> name="chome" value={draft.showOnHome} onChange={(showOnHome) => patch({ showOnHome })} options={[[true, "Show"], [false, "Hide"]]} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}>
                <h6 style={{ margin: 0 }}>Books in this collection</h6>
                <span className="text-muted num" style={{ fontSize: 12 }}>{draft.bookIds.length} selected</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-2)" }}>
                {books.map((b) => {
                  const on = draft.bookIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      className={`pick-row${on ? " on" : ""}`}
                      aria-pressed={on}
                      onClick={() => patch({ bookIds: on ? draft.bookIds.filter((i) => i !== b.id) : [...draft.bookIds, b.id] })}
                    >
                      <span style={{ width: 26, aspectRatio: "2/3", borderRadius: 2, background: b.coverImageUrl ? `center/cover url("${b.coverImageUrl}")` : TONES[b.coverTone][0] }} />
                      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, lineHeight: 1.15 }}>{b.title}</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>{b.author}{b.status === "Draft" ? " · Draft" : ""}</span>
                      </span>
                      <span className="dot" />
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)", borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}>
                <button
                  className="btn btn-ghost"
                  disabled={pending}
                  onClick={() => window.confirm(`Delete “${draft.name}”? The books themselves stay in the shop.`) && run(() => deleteCollection(draft.id), "Collection deleted")}
                  style={{ color: "var(--color-neutral-700)" }}
                >
                  Delete collection
                </button>
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  {dirty && <span className="text-muted" style={{ fontSize: 12 }}>Unsaved changes</span>}
                  <button className="btn btn-primary" disabled={pending || !dirty} onClick={() => run(() => saveCollection(draft.id, draft), `Collection “${draft.name}” saved`)}>
                    {pending ? "Saving…" : "Save collection"}
                  </button>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
