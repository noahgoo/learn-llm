"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMobileExperience } from "@/lib/mobile";
import { useModelStore } from "@/lib/model/client";
import { useActiveOutput } from "@/lib/model/data";
import { MAX_TOKENS } from "@/lib/model/protocol";
import { useJourneyStore } from "@/lib/store";
import { SUGGESTIONS } from "@/lib/suggestions";

function pickThree(exclude?: string): string[] {
  const pool = SUGGESTIONS.filter((s) => s !== exclude);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

/**
 * The user's text — the payload that flies through the model.
 * Debounced into the inference worker; the worker lazy-loads the
 * model on first run.
 */
export function PromptInput() {
  const prompt = useJourneyStore((s) => s.prompt);
  const setPrompt = useJourneyStore((s) => s.setPrompt);
  const entered = useJourneyStore((s) => s.entered);
  const status = useModelStore((s) => s.status);
  const loadProgress = useModelStore((s) => s.progress);
  const backend = useModelStore((s) => s.backend);
  const load = useModelStore((s) => s.load);
  const run = useModelStore((s) => s.run);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // GPT-2 small rambles on arbitrary text; offer prompts it handles well.
  // Deterministic initial chips (hydration-safe); shuffle is user-driven.
  const [chips, setChips] = useState<string[]>(() => SUGGESTIONS.slice(0, 3));
  const manuallyOpen = useJourneyStore((s) => s.payloadOpen);
  const setManuallyOpen = useJourneyStore((s) => s.setPayloadOpen);
  const autoOpened = useRef(false);
  // Fixtures-only on mobile (MOBILE_PLAN.md §6): the panel becomes a chip
  // picker — no free text, and `run` is never called so the worker (and the
  // 168 MB model download) never spawns.
  const mobile = useMobileExperience();

  const expanded = manuallyOpen;

  // run the initial prompt once the model becomes ready
  useEffect(() => {
    if (status === "ready") run(useJourneyStore.getState().prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Auto-open the panel once, the first time the user scrolls in, so they
  // notice they can set their own text. After that it's theirs to hide/show.
  // Not on mobile: the expanded panel would sit on the caption strip's lane,
  // and the chip picker is discoverable from its top-right toggle.
  useEffect(() => {
    if (entered && !autoOpened.current && !mobile) {
      autoOpened.current = true;
      setManuallyOpen(true);
    }
  }, [entered, setManuallyOpen, mobile]);

  // …and auto-collapse it once they move past the first station: expanded,
  // it covers the bottom third of the scene through the whole journey. One
  // shot only — reopening after that is a user decision we don't override.
  const activeStage = useJourneyStore((s) => s.activeStage);
  const autoClosed = useRef(false);
  useEffect(() => {
    if (activeStage > 0 && !autoClosed.current) {
      autoClosed.current = true;
      setManuallyOpen(false);
    }
  }, [activeStage, setManuallyOpen]);

  const onChange = (text: string) => {
    setPrompt(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => run(text), 400);
  };

  const choose = (text: string) => {
    setPrompt(text);
    if (!mobile) run(text);
    setChips(pickThree(text));
  };

  // Honest token count: only when the resolved output is actually for the
  // typed text (live result or exact fixture match) — never the fallback.
  const output = useActiveOutput(prompt);
  const counted = output && output.text === prompt.trim() ? output : null;
  const atCap = counted !== null && (counted.truncated || counted.seq >= MAX_TOKENS);

  // No prompt panel on the landing; it reveals with the rest of the chrome.
  if (!entered) return null;

  return (
    <AnimatePresence mode="wait">
      {expanded ? (
        <motion.div
          key="payload-editor"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="pointer-events-auto fixed bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] left-1/2 z-20 w-[38rem] max-w-[92vw] -translate-x-1/2 pane px-5 pt-5 pb-4 md:bottom-8 md:max-w-[88vw]"
        >
          {/* Fieldset legend: the panel's name rides its top border */}
          <span className="absolute -top-[8px] left-4 bg-abyss px-2 font-mono text-[10px] uppercase tracking-wide3 text-faint">
            Payload
          </span>
          <button
            type="button"
            aria-label="Hide payload"
            onClick={() => setManuallyOpen(false)}
            className="pressable absolute -top-[13px] right-3 h-6 w-6 border border-line bg-abyss font-mono text-[13px] leading-none text-faint transition-colors hover:border-line-strong hover:text-ink"
          >
            ×
          </button>
          {/* Mobile: the prompt is picked, not typed — free text would imply
              live inference the phone deliberately doesn't run */}
          <p className="font-mono text-[14px] text-peri md:hidden">
            &ldquo;{prompt}&rdquo;
          </p>
          <label htmlFor="prompt" className="sr-only">
            Payload text
          </label>
          <div className="relative hidden md:block">
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              maxLength={280}
              placeholder="Type any text — watch it think"
              className="w-full border-b border-line bg-transparent py-2 pr-20 font-mono text-[15px] text-ink caret-accent placeholder:text-faint transition-colors duration-200 outline-none focus:border-accent-dim"
            />
            <span
              aria-hidden={counted === null}
              className={`pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 font-mono text-[11px] transition-opacity duration-200 ${
                atCap ? "text-signal" : "text-faint"
              } ${counted ? "opacity-100" : "opacity-0"}`}
            >
              {counted?.seq ?? 0} / {MAX_TOKENS} tok
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px]">
            <span className="uppercase tracking-wide2 text-faint">try</span>
            {/* Never suggest the text already sitting in the input */}
            {chips.filter((s) => s !== prompt.trim()).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => choose(s)}
                className="pressable text-dim underline decoration-line decoration-dotted underline-offset-4 transition-colors hover:text-peri hover:decoration-accent-dim"
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              aria-label="Shuffle suggestions"
              onClick={() => setChips(pickThree())}
              className="pressable px-1 text-faint transition-colors hover:text-ink"
            >
              ↻
            </button>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wide2 text-faint md:hidden">
            Precomputed replay · on desktop this runs GPT-2 live in your browser
          </p>
          <div className="mt-4 hidden flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wide2 md:flex">
            {status === "idle" && (
              <>
                <span className="text-faint">Replay · precomputed</span>
                <button
                  type="button"
                  onClick={load}
                  className="pressable bg-accent px-4 py-2 text-void transition-colors hover:bg-lavender"
                >
                  Run live in browser · 168 MB
                </button>
              </>
            )}
            {status === "loading" && (
              <div className="flex w-full flex-col gap-2 text-peri">
                <span>Loading GPT-2 · {Math.round(loadProgress * 100)}%</span>
                <span className="h-1.5 bg-void/70">
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${Math.round(loadProgress * 100)}%` }}
                  />
                </span>
              </div>
            )}
            {status === "ready" && (
              <span className="border border-accent-dim bg-accent/10 px-3 py-1.5 text-lavender">
                Live · GPT-2 small ·{" "}
                <span className="text-accent">{backend}</span>
              </span>
            )}
            {status === "error" && (
              <span className="text-signal">Model failed to load</span>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="payload-compact"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-auto fixed right-6 bottom-6 z-20 hidden flex-col items-end gap-2 font-mono text-[11px] uppercase tracking-wide2 md:flex"
        >
          {status === "ready" && (
            <span className="border border-accent-dim bg-accent/10 px-3 py-2 text-lavender backdrop-blur-sm">
              Live · GPT-2 small · <span className="text-accent">{backend}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setManuallyOpen(true)}
            className="pressable pane px-3 py-2 text-dim transition-colors hover:border-line-strong hover:text-ink"
          >
            Edit payload
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
