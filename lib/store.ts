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
  /** Index of the stage currently in view (driven by scroll in M0.4) */
  activeStage: number;
  setActiveStage: (index: number) => void;
  /** Raw user prompt; inference wiring lands in M1 */
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export const useJourneyStore = create<JourneyState>()((set) => ({
  activeStage: 0,
  setActiveStage: (activeStage) => set({ activeStage }),
  prompt: "The cat sat on the",
  setPrompt: (prompt) => set({ prompt }),
}));
