"use client";

import { useJourneyStore } from "@/lib/store";
import { STAGES, type StageId } from "@/lib/journey";

/**
 * One number per stage that earns it, counting up as the stage's dwell
 * advances (Apple keynote-style kinetic stat). Scrubbed by beat progress,
 * so scrolling back winds it down. Real GPT-2 small figures.
 */
const STATS: Partial<
  Record<StageId, { value: number; label: string }>
> = {
  tokenization: { value: 50257, label: "words and pieces in the vocabulary" },
  embeddings: { value: 768, label: "numbers describing each token" },
  "multi-head": { value: 144, label: "attention heads · 12 per layer × 12 layers" },
  weights: { value: 124439808, label: "learned parameters" },
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * High-frequency subscriber by design (see CLAUDE.md pattern): this small
 * leaf re-renders while its number counts; nothing above it does.
 */
export function KineticStat() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const traveling = useJourneyStore((s) => s.traveling);
  const dwell = useJourneyStore((s) => {
    const beats = STAGES[s.activeStage]?.beats ?? 1;
    return Math.min(1, (s.beat + s.beatProgress) / beats);
  });

  const stat = STATS[STAGES[activeStage]?.id];
  if (!stat) return null;

  // finish counting two-thirds of the way through the dwell
  const n = Math.round(stat.value * smooth(Math.min(1, dwell * 1.5)));

  return (
    <aside
      aria-live="off"
      className={`pointer-events-none fixed bottom-24 left-16 z-10 transition-opacity duration-300 ${
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
