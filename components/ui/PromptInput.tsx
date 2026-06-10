"use client";

import { useEffect, useRef } from "react";
import { useModelStore } from "@/lib/model/client";
import { useJourneyStore } from "@/lib/store";

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

  return (
    <div className="pointer-events-auto fixed bottom-8 left-1/2 z-20 w-[34rem] max-w-[80vw] -translate-x-1/2">
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
