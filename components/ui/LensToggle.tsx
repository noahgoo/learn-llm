"use client";

import type { Lens } from "@/lib/store";
import { useLensStore } from "@/lib/store";

const LENSES: { value: Lens; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "technical", label: "Technical" },
];

/**
 * Segmented Simple/Technical explanation switch. Persisted (localStorage)
 * so the chosen lens follows the reader across stages and visits.
 */
export function LensToggle() {
  const lens = useLensStore((s) => s.lens);
  const setLens = useLensStore((s) => s.setLens);

  return (
    <div
      role="radiogroup"
      aria-label="Explanation style"
      className="pointer-events-auto flex items-center border border-line"
    >
      {LENSES.map(({ value, label }) => {
        const selected = lens === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLens(value)}
            className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide2 transition-colors duration-200 outline-none focus-visible:bg-accent-dim ${
              selected
                ? "bg-ink text-void"
                : "text-dim hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
