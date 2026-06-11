"use client";

import citations from "@/content/citations.json";

export type CitationId = keyof typeof citations;

/**
 * Inline citation marker. Hover/focus reveals the source; the References
 * page aggregates everything in content/citations.json.
 */
export function Cite({ id }: { id: CitationId }) {
  const c = citations[id];
  if (!c) return null;
  return (
    <span className="group/cite relative inline-block">
      <a
        href={c.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Source: ${c.title}`}
        className="px-0.5 align-super font-mono text-[9px] text-accent no-underline transition-colors hover:text-lavender"
      >
        [{c.year}]
      </a>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 border border-line bg-abyss p-3 text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover/cite:visible group-hover/cite:opacity-100"
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
      </span>
    </span>
  );
}
