"use client";

import type { CSSProperties } from "react";

/** Segmented control (.seg / .seg-opt) driven by a value + onChange. */
export function Seg<T extends string | boolean>({
  name, options, value, onChange, stretch, style,
}: {
  name: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  stretch?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className="seg" role="radiogroup" style={{ ...(stretch ? { display: "flex" } : {}), ...style }}>
      {options.map(([k, label]) => (
        <label key={String(k)} className="seg-opt" style={stretch ? { flex: 1, justifyContent: "center" } : undefined}>
          <input type="radio" name={name} checked={value === k} onChange={() => onChange(k)} />
          {label}
        </label>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(([k, label]) => (
        <button key={k} type="button" className={`chip${value === k ? " on" : ""}`} aria-pressed={value === k} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Radios<T extends string>({ name, options, value, onChange }: { name: string; options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {options.map(([k, label]) => (
        <label key={k} className="radio">
          <input type="radio" name={name} checked={value === k} onChange={() => onChange(k)} />
          <span className="dot" />
          {label}
        </label>
      ))}
    </div>
  );
}
