import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lens = "simple" | "technical";

interface LensState {
  lens: Lens;
  setLens: (lens: Lens) => void;
}

export const useLensStore = create<LensState>()(
  persist(
    (set) => ({
      lens: "simple",
      setLens: (lens) => set({ lens }),
    }),
    { name: "itm-lens" },
  ),
);

interface JourneyState {
  /** Index of the stage currently in view (derived from scroll progress) */
  activeStage: number;
  setActiveStage: (index: number) => void;
  /** Scroll progress through the whole journey, 0..1. Read per-frame by the camera rig. */
  progress: number;
  setProgress: (progress: number) => void;
  /** Raw user prompt; inference wiring lands in M1 */
  prompt: string;
  setPrompt: (prompt: string) => void;
  /** Free-explore breakout: orbit the current station, scroll suspended */
  exploring: boolean;
  setExploring: (exploring: boolean) => void;
}

export const useJourneyStore = create<JourneyState>()((set) => ({
  activeStage: 0,
  setActiveStage: (activeStage) => set({ activeStage }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
  prompt: "The cat sat on the",
  setPrompt: (prompt) => set({ prompt }),
  exploring: false,
  setExploring: (exploring) => set({ exploring }),
}));

export type AttentionView = "softmax" | "scores";

interface AttentionUIState {
  layer: number; // 0..11
  head: number; // 0..11
  view: AttentionView;
  setLayer: (layer: number) => void;
  setHead: (head: number) => void;
  setView: (view: AttentionView) => void;
}

/** UI state for the attention stage's layer/head/view selectors. */
export const useAttentionStore = create<AttentionUIState>()((set) => ({
  layer: 0,
  head: 0,
  view: "softmax",
  setLayer: (layer) => set({ layer }),
  setHead: (head) => set({ head }),
  setView: (view) => set({ view }),
}));
