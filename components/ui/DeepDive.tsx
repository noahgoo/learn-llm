"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { STAGE_CONTENT } from "@/content/stages";
import { STAGES } from "@/lib/journey";
import { useMobileExperience } from "@/lib/mobile";
import type { Lens } from "@/lib/store";
import { useJourneyStore, useLensStore } from "@/lib/store";

const LENSES: { value: Lens; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "technical", label: "Technical" },
];

/**
 * Opt-in stage explanation behind a three-step depth control:
 * Simple and Technical set the SITE-WIDE lens (beat captions + this
 * drawer's MDX); Read opens the full cited write-up for the active stage.
 * Beat captions stay cinematic and brief; the textbook lives here.
 */
export function DeepDive() {
  const open = useJourneyStore((s) => s.deepDiveOpen);
  const setOpen = useJourneyStore((s) => s.setDeepDiveOpen);
  const entered = useJourneyStore((s) => s.entered);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const lens = useLensStore((s) => s.lens);
  const setLens = useLensStore((s) => s.setLens);
  const stage = STAGES[activeStage];
  const Content = STAGE_CONTENT[stage.id]?.[lens];
  const lensLabel =
    lens === "simple" ? "Simple explanation" : "Technical notes";
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  // Below md the drawer becomes a bottom sheet: slides up, backdrop, drag
  // handle. Same content, same focus contract (MOBILE_PLAN.md §5).
  const mobile = useMobileExperience();

  // Focus management: opening moves focus into the drawer, Escape closes,
  // closing returns focus to the toggle — standard escape-route contract.
  useEffect(() => {
    if (!open) return;
    drawerRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      {/* Depth control is part of the post-scroll chrome; hidden on landing.
          Three steps: Simple | Technical (site-wide lens radio) | Read
          (toggles this drawer, which inherits the lens). */}
      {entered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-auto fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center pane font-mono text-[11px] uppercase tracking-wide2 md:right-6 md:top-5"
        >
          <div role="radiogroup" aria-label="Explanation depth" className="flex items-center">
            {LENSES.map(({ value, label }) => {
              const selected = lens === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLens(value)}
                  className={`pressable px-2.5 py-2 transition-colors duration-200 outline-none focus-visible:bg-accent-dim md:px-3 ${
                    selected ? "bg-ink text-void" : "text-dim hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span aria-hidden className="h-4 w-px bg-line" />
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className={`pressable flex items-center gap-2 px-3 py-2 transition-colors duration-200 outline-none focus-visible:bg-accent-dim ${
              open ? "bg-ink text-void" : "text-dim hover:text-ink"
            }`}
          >
            <span className={open ? "text-void" : "text-accent"}>
              {open ? "✕" : "≡"}
            </span>
            {/* icon-only below md — the pill shares the top row with the
                wordmark and every character counts at 390px */}
            <span className="hidden md:inline">{open ? "Close" : "Read"}</span>
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {open && mobile && (
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
            className="pointer-events-auto fixed inset-0 z-40 bg-void/60 md:hidden"
          />
        )}
        {open && (
          <motion.aside
            key="explanation-drawer"
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-label={`${stage.title} — ${lensLabel}`}
            initial={mobile ? { opacity: 0, y: 48 } : { opacity: 0, x: 24 }}
            animate={mobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
            exit={mobile ? { opacity: 0, y: 48 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            drag={mobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (mobile && (info.offset.y > 110 || info.velocity.y > 600)) {
                setOpen(false);
                toggleRef.current?.focus();
              }
            }}
            className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex h-[85svh] flex-col pane outline-none md:inset-x-auto md:right-6 md:top-16 md:bottom-24 md:h-auto md:w-[26rem] md:max-w-[80vw]"
          >
            {/* drag handle — sheet affordance, mobile only */}
            <div aria-hidden className="flex justify-center pt-2.5 pb-1 md:hidden">
              <span className="h-1 w-10 rounded-full bg-line" />
            </div>
            <div className="border-b border-line px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
                {stage.phase}
              </p>
              <h2 className="mt-1 font-display text-2xl leading-tight text-ink">
                {stage.title}
              </h2>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide2 text-faint">
                {lensLabel}
              </p>
            </div>
            {/* overscroll-contain: reaching the end of the notes must not
                chain into the journey scroll underneath the sheet */}
            <div className="prose-stage flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[14px] leading-relaxed text-dim">
              {Content ? (
                <Content />
              ) : (
                <p>Explanation notes for this station land in a later milestone.</p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
