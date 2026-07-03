"use client";

import { motion } from "motion/react";
import { ACTS, STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";
import { scrollToStage } from "./ScrollTrack";

/**
 * The rail doubles as a miniature architecture diagram: stages grouped into
 * the model's three acts (see ACTS in journey.ts — input pipeline → the
 * repeated transformer block → output head). Round nodes are tensors
 * flowing between parts; diamond nodes live inside the block, which
 * repeats ×12.
 */
const GROUPS = ACTS.map((act) => ({
  label: act.title,
  repeat: act.badge,
  stages: Array.from(
    { length: act.range[1] - act.range[0] + 1 },
    (_, i) => act.range[0] + i,
  ),
}));

/**
 * Isolated high-frequency subscriber (see CLAUDE.md per-frame pattern):
 * continuous journey progress as a fill rising along the spine. One tiny
 * span re-renders per scroll frame; transform only, no layout.
 */
function SpineFill() {
  const progress = useJourneyStore((s) => s.progress);
  return (
    <span
      aria-hidden
      className="absolute top-1 bottom-1 left-[3.5px] w-px origin-top bg-gradient-to-b from-peri via-accent to-signal"
      style={{ transform: `scaleY(${progress})` }}
    />
  );
}

function StageNode({ index, square }: { index: number; square: boolean }) {
  const active = useJourneyStore((s) => s.activeStage === index);
  const stage = STAGES[index];
  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => scrollToStage(index)}
        aria-current={active ? "step" : undefined}
        aria-label={`Go to ${stage.title}`}
        className="group relative -m-2 flex items-center p-2 outline-none"
      >
        <span
          className={`relative block h-2.5 w-2.5 transition-colors duration-300 ${
            square ? "rounded-[1px] rotate-45 scale-90" : "rounded-full"
          } ${
            active
              ? "bg-accent glow-accent"
              : "bg-dim group-hover:bg-ink group-focus-visible:bg-ink"
          }`}
        />
        {/* label chip: revealed on hover/focus, pinned open while active */}
        <span
          className={`pointer-events-none absolute left-full z-30 ml-3 pane px-2 py-1 font-mono text-[11px] whitespace-nowrap uppercase tracking-wide2 transition-all duration-300 ${
            active ? "text-accent" : "text-dim"
          } ${
            active
              ? "translate-x-0 opacity-100"
              : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
          }`}
        >
          {String(index + 1).padStart(2, "0")} / {stage.short}
        </span>
      </button>
    </li>
  );
}

/**
 * Vertical mission rail on the left edge — Progress Rail v2. One node per
 * stage, grouped as the model's real architecture. Clicking a node flies
 * the camera there. Hidden on the landing screen; fades in once `entered`.
 */
export function ProgressRail() {
  const entered = useJourneyStore((s) => s.entered);

  if (!entered) return null;

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      aria-label="Journey stages"
      className="pointer-events-auto fixed left-6 top-1/2 z-20 -translate-y-1/2"
    >
      <div className="relative flex flex-col gap-3">
        {/* spine + rising progress fill */}
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-[3.5px] w-px bg-line"
        />
        <SpineFill />
        {GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p
              aria-hidden
              className="ml-5 font-mono text-[9px] uppercase tracking-wide3 text-faint"
            >
              {group.label}
              {group.repeat && (
                <span className="ml-1.5 text-accent-dim">{group.repeat}</span>
              )}
            </p>
            <ol
              className={`flex flex-col gap-4 ${
                group.repeat
                  ? "relative ml-0 before:absolute before:top-0 before:bottom-0 before:left-[9px] before:w-px before:bg-accent-dim/40"
                  : ""
              }`}
            >
              {group.stages.map((i) => (
                <StageNode key={STAGES[i].id} index={i} square={!!group.repeat} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </motion.nav>
  );
}
