"use client";

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
  const status = useModelStore((s) => s.status);
  const progress = useModelStore((s) => s.progress);
  const backend = useModelStore((s) => s.backend);
  const load = useModelStore((s) => s.load);
  const run = useModelStore((s) => s.run);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // GPT-2 small rambles on arbitrary text; offer prompts it handles well.
  // Deterministic initial chips (hydration-safe); shuffle is user-driven.
  const [chips, setChips] = useState<string[]>(() => SUGGESTIONS.slice(0, 3));

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
    <div className="pointer-events-auto fixed bottom-8 left-1/2 z-20 w-[34rem] max-w-[80vw] -translate-x-1/2">
      <div className="mb-2 flex items-center justify-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wide2 text-faint">
            Try
          </span>
          {chips.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => choose(s)}
              className="max-w-44 truncate border border-line px-2 py-1 font-mono text-[10px] text-dim transition-colors hover:border-line-strong hover:text-peri"
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            aria-label="Shuffle suggestions"
            onClick={() => setChips(pickThree())}
            className="border border-line px-2 py-1 font-mono text-[10px] text-faint transition-colors hover:border-line-strong hover:text-ink"
          >
            ↻
          </button>
      </div>
      <label
        htmlFor="prompt"
        className="mb-2 block text-center font-mono text-[10px] uppercase tracking-wide3 text-faint"
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
      <div className="mt-2 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wide2 text-faint">
        {status === "idle" && (
          <button
            type="button"
            onClick={load}
            className="border border-line px-2 py-1 text-dim transition-colors hover:border-line-strong hover:text-ink"
          >
            Load GPT-2 · 168 MB
          </button>
        )}
        {status === "loading" && (
          <span className="text-peri">
            Loading model · {Math.round(progress * 100)}%
          </span>
        )}
        {status === "ready" && (
          <span>
            Live · GPT-2 small · <span className="text-accent">{backend}</span>
          </span>
        )}
        {status === "error" && (
          <span className="text-signal">Model failed to load</span>
        )}
      </div>
    </div>
  );
}
