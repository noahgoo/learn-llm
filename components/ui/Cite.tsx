"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import citations from "@/content/citations.json";

export type CitationId = keyof typeof citations;

const CARD_W = 264;

/**
 * Inline citation marker. The hover card renders in a portal with fixed,
 * viewport-clamped coordinates — the stage panel clips and fades its
 * overflow, so an in-flow tooltip would be cut off near the edges.
 */
export function Cite({ id }: { id: CitationId }) {
  const c = citations[id];
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  if (!c) return null;

  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const half = CARD_W / 2 + 8;
    setPos({
      x: Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half),
      y: r.top - 8,
    });
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={(e) => show(e.currentTarget)}
      onMouseLeave={() => setPos(null)}
    >
      <a
        href={c.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Source: ${c.title}`}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setPos(null)}
        className="px-0.5 align-super font-mono text-[9px] text-accent no-underline transition-colors hover:text-lavender"
      >
        [{c.year}]
      </a>
      {pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ left: pos.x, top: pos.y, width: CARD_W }}
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full border border-line bg-abyss p-3 text-left shadow-xl"
          >
            <span className="block text-[12px] leading-snug text-ink">
              {c.title}
            </span>
            <span className="mt-1 block font-mono text-[10px] text-dim">
              {c.authors}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-faint">
              {c.venue} · {c.year}
            </span>
          </span>,
          document.body,
        )}
    </span>
  );
}
