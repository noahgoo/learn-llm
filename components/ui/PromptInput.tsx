"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useModelStore } from "@/lib/model/client";
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
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const journeyProgress = useJourneyStore((s) => s.progress);
  const status = useModelStore((s) => s.status);
  const loadProgress = useModelStore((s) => s.progress);
  const backend = useModelStore((s) => s.backend);
  const load = useModelStore((s) => s.load);
  const run = useModelStore((s) => s.run);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // GPT-2 small rambles on arbitrary text; offer prompts it handles well.
  // Deterministic initial chips (hydration-safe); shuffle is user-driven.
  const [chips, setChips] = useState<string[]>(() => SUGGESTIONS.slice(0, 3));
  const [manuallyOpen, setManuallyOpen] = useState(false);

  const introVisible = activeStage === 0 && beat === 0 && journeyProgress < 0.003;
  const expanded = introVisible || manuallyOpen;

  // run the initial prompt once the model becomes ready
  useEffect(() => {
    if (status === "ready") run(useJourneyStore.getState().prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onChange = (text: string) => {
    setPrompt(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => run(text), 400);
  };

  const choose = (text: string) => {
    setPrompt(text);
    run(text);
    setChips(pickThree(text));
  };

  return (
    <AnimatePresence mode="wait">
      {expanded ? (
        <motion.div
          key="payload-editor"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="pointer-events-auto fixed bottom-8 left-1/2 z-20 w-[38rem] max-w-[88vw] -translate-x-1/2 border border-line bg-abyss/88 p-4 backdrop-blur-sm"
        >
          {!introVisible && (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={() => setManuallyOpen(false)}
                className="border border-line bg-abyss/75 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide2 text-faint backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink"
              >
                Hide payload
              </button>
            </div>
          )}
          {introVisible && (
            <div className="mb-4 text-center">
              <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
                Start here
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-dim">
                Pick sample text or type your own. Samples work immediately;
                loading GPT-2 enables live inference in your browser.
              </p>
            </div>
          )}
          <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide2 text-faint">
              Try
            </span>
            {chips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => choose(s)}
                className="max-w-44 truncate border border-line px-2 py-1 font-mono text-[11px] text-dim transition-colors hover:border-line-strong hover:text-peri"
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              aria-label="Shuffle suggestions"
              onClick={() => setChips(pickThree())}
              className="border border-line px-2 py-1 font-mono text-[11px] text-faint transition-colors hover:border-line-strong hover:text-ink"
            >
              ↻
            </button>
          </div>
          <label
            htmlFor="prompt"
            className="mb-2 block text-center font-mono text-[11px] uppercase tracking-wide3 text-faint"
          >
            Payload
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            maxLength={280}
            placeholder="Type any text — watch it think"
            className="w-full border border-line bg-abyss/70 px-4 py-3 text-center font-mono text-sm text-ink placeholder:text-faint backdrop-blur-sm transition-colors duration-200 outline-none focus:border-line-strong focus:bg-abyss"
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-wide2 text-faint">
            {status === "idle" && (
              <>
                <span>Sample mode is ready</span>
                <button
                  type="button"
                  onClick={load}
                  className="bg-accent px-4 py-2 text-void transition-colors hover:bg-lavender"
                >
                  Load GPT-2 · 168 MB
                </button>
              </>
            )}
            {status === "loading" && (
              <div className="flex min-w-56 flex-col gap-2 text-peri">
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
          className="pointer-events-auto fixed right-6 bottom-6 z-20 flex flex-col items-end gap-2 font-mono text-[11px] uppercase tracking-wide2"
        >
          {status === "ready" && (
            <span className="border border-accent-dim bg-accent/10 px-3 py-2 text-lavender backdrop-blur-sm">
              Live · GPT-2 small · <span className="text-accent">{backend}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setManuallyOpen(true)}
            className="border border-line bg-abyss/75 px-3 py-2 text-dim backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink"
          >
            Edit payload
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
