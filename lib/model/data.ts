"use client";

import { create } from "zustand";
import type { ModelOutput } from "./protocol";
import { useModelStore } from "./client";

/**
 * Illustrative mode: before the model downloads, stage visualizations run on
 * committed fixtures (real GPT-2 outputs for the suggested sentences).
 * Fixtures lazy-load so the 1 MB JSON stays out of the initial bundle.
 */

interface FixtureSentence {
  text: string;
  ids: number[];
  tokens: string[];
  seq: number;
  attention: number[][];
  scores: number[][];
  tokEmb: number[];
  posEmb: number[];
  topk: { id: number; token: string; prob: number }[];
}

function toModelOutput(f: FixtureSentence): ModelOutput {
  return {
    text: f.text,
    ids: f.ids,
    tokens: f.tokens,
    truncated: false,
    seq: f.seq,
    attention: f.attention.map((l) => Float32Array.from(l)),
    scores: f.scores.map((l) => Float32Array.from(l)),
    tokEmb: Float32Array.from(f.tokEmb),
    posEmb: Float32Array.from(f.posEmb),
    topk: f.topk,
    finalLogits: new Float32Array(0), // not stored in fixtures
  };
}

interface FixtureState {
  byText: Map<string, ModelOutput> | null;
  fallback: ModelOutput | null;
  loadFixtures: () => void;
}

export const useFixtureStore = create<FixtureState>()((set, get) => ({
  byText: null,
  fallback: null,
  loadFixtures: () => {
    if (get().byText) return;
    import("@/fixtures/sentences.json").then((mod) => {
      const sentences = mod.default as FixtureSentence[];
      const byText = new Map(
        sentences.map((f) => [f.text, toModelOutput(f)]),
      );
      set({ byText, fallback: byText.get(sentences[0].text) ?? null });
    });
  },
}));

/**
 * The output stage visualizations should render: live model output when
 * available, else the fixture matching the current prompt, else the first
 * fixture sentence.
 */
export function useActiveOutput(prompt: string): ModelOutput | null {
  const live = useModelStore((s) => s.output);
  const byText = useFixtureStore((s) => s.byText);
  const fallback = useFixtureStore((s) => s.fallback);
  if (live) return live;
  return byText?.get(prompt.trim()) ?? fallback;
}
