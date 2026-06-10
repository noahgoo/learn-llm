"use client";

import { useJourneyStore } from "@/lib/store";

/**
 * The user's text — the payload that flies through the model.
 * Wired to live GPT-2 tokenization in M1; for now it holds journey state.
 */
export function PromptInput() {
  const prompt = useJourneyStore((s) => s.prompt);
  const setPrompt = useJourneyStore((s) => s.setPrompt);

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
        onChange={(e) => setPrompt(e.target.value)}
        spellCheck={false}
        maxLength={280}
        placeholder="Type any text — watch it think"
        className="w-full border border-line bg-abyss/70 px-4 py-3 text-center font-mono text-sm text-ink placeholder:text-faint backdrop-blur-sm transition-colors duration-200 outline-none focus:border-line-strong focus:bg-abyss"
      />
    </div>
  );
}
