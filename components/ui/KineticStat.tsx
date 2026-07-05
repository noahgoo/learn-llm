"use client";

import { useEffect, useState } from "react";
import { useJourneyStore } from "@/lib/store";
import { STAGES, type StageId } from "@/lib/journey";

/**
 * One number per stage that earns it, counting up on arrival (Apple
 * keynote-style kinetic stat). Time-based rather than scroll-scrubbed:
 * snap gravity parks readers exactly on beat boundaries, where a
 * scrubbed count would sit frozen at 0. Real GPT-2 small figures.
 */
const STATS: Partial<Record<StageId, { value: number; label: string }>> = {
  tokenization: { value: 50257, label: "words and pieces in the vocabulary" },
  embeddings: { value: 768, label: "numbers describing each token" },
  "multi-head": { value: 144, label: "attention heads · 12 per layer × 12 layers" },
  weights: { value: 124439808, label: "learned parameters" },
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const COUNT_MS = 1100;

export function KineticStat() {
  const entered = useJourneyStore((s) => s.entered);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const traveling = useJourneyStore((s) => s.traveling);
  const [n, setN] = useState(0);

  const stat = STATS[STAGES[activeStage]?.id];

  useEffect(() => {
    if (!stat) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(stat.value);
      return;
    }
    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - t0) / COUNT_MS);
      setN(Math.round(stat.value * smooth(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStage]);

  if (!entered || !stat) return null;

  return (
    <aside
      aria-live="off"
      className={`pointer-events-none fixed bottom-24 left-16 z-10 hidden transition-opacity duration-300 md:block ${
        traveling ? "opacity-0" : "opacity-100"
      }`}
    >
      <p className="font-mono text-4xl tabular-nums tracking-tight text-signal [text-shadow:_0_1px_16px_rgb(6_4_12_/_0.9)]">
        {n.toLocaleString("en-US")}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide2 text-faint">
        {stat.label}
      </p>
    </aside>
  );
}
