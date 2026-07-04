"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useActiveOutput } from "@/lib/model/data";
import { STAGES } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

const PREDICTION_INDEX = STAGES.findIndex((s) => s.id === "prediction");

/**
 * The comprehension moment: before the probability reveal plays out, ask
 * the reader to bet. Four candidate next-tokens (the model's real top-4,
 * order shuffled deterministically), one click, then the honest reveal —
 * per-candidate probabilities with the model's actual favorite marked.
 * Active learning beats narration; this is the one interactive quiz beat.
 */
export function GuessNext() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const traveling = useJourneyStore((s) => s.traveling);
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  // the bet is bound to the prompt it was made against, so a new prompt is
  // automatically a fresh bet — no reset effect needed
  const [bet, setBet] = useState<{ prompt: string; id: number } | null>(null);
  const guess = bet && bet.prompt === prompt ? bet.id : null;
  const setGuess = (id: number) => setBet({ prompt, id });

  const candidates = useMemo(() => {
    const top = output?.topk.slice(0, 4) ?? [];
    // deterministic shuffle (hydration-safe): order by a cheap string hash
    return [...top].sort((a, b) => {
      const h = (s: string) =>
        [...s].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 997, 7);
      return h(a.token) - h(b.token);
    });
  }, [output]);

  const show =
    activeStage === PREDICTION_INDEX &&
    beat <= 1 &&
    !traveling &&
    candidates.length === 4;
  const best = output?.topk[0];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="guess-next"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="pointer-events-auto fixed bottom-24 left-16 z-20 w-[21rem] pane p-4"
        >
          <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
            {guess === null ? "Your turn" : "The reveal"}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-dim">
            {guess === null ? (
              <>
                After <span className="font-mono text-peri">…{prompt.trim().split(/\s+/).slice(-3).join(" ")}</span>,
                which word does the model favor?
              </>
            ) : guess === best?.id ? (
              "Called it — that's the model's favorite."
            ) : (
              "Not quite — probabilities below."
            )}
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {candidates.map((c) => {
              const revealed = guess !== null;
              const isBest = c.id === best?.id;
              const isGuess = c.id === guess;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={revealed}
                  onClick={() => setGuess(c.id)}
                  className={`pressable flex items-center justify-between gap-3 border px-3 py-1.5 text-left font-mono text-[12px] transition-colors ${
                    revealed
                      ? isBest
                        ? "border-accent bg-accent/10 text-lavender"
                        : isGuess
                          ? "border-signal/60 text-signal"
                          : "border-line text-faint"
                      : "border-line text-dim hover:border-line-strong hover:text-ink"
                  }`}
                >
                  <span className="truncate">{JSON.stringify(c.token)}</span>
                  {revealed && (
                    <span className="tabular-nums">
                      {(c.prob * 100).toFixed(1)}%
                      {isBest && " ◂ model"}
                      {isGuess && !isBest && " ◂ you"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
