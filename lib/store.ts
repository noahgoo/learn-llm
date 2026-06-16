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

interface TelemetryState {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const useTelemetryStore = create<TelemetryState>()(
  persist(
    (set) => ({
      visible: true,
      setVisible: (visible) => set({ visible }),
    }),
    { name: "itm-telemetry" },
  ),
);

interface JourneyState {
  /** Index of the stage currently in view (derived from scroll progress) */
  activeStage: number;
  setActiveStage: (index: number) => void;
  /** Active beat within the current stage (0-based) */
  beat: number;
  /** Progress through the active beat, 0..1 */
  beatProgress: number;
  /** True while the camera is flying between stations */
  traveling: boolean;
  /** Update the beat-scroll position in one shot (called per scroll event) */
  setJourney: (j: {
    activeStage: number;
    beat: number;
    beatProgress: number;
    traveling: boolean;
  }) => void;
  /** Camera path parameter, 0..1. Read per-frame by the camera rig. */
  cameraT: number;
  setCameraT: (cameraT: number) => void;
  /** Raw scroll progress through the whole journey, 0..1. */
  progress: number;
  setProgress: (progress: number) => void;
  /** Raw user prompt; inference wiring lands in M1 */
  prompt: string;
  setPrompt: (prompt: string) => void;
  /** Opt-in deep-dive panel: full cited copy for the active stage */
  deepDiveOpen: boolean;
  setDeepDiveOpen: (open: boolean) => void;
}

export const useJourneyStore = create<JourneyState>()((set) => ({
  activeStage: 0,
  setActiveStage: (activeStage) => set({ activeStage }),
  beat: 0,
  beatProgress: 0,
  traveling: false,
  setJourney: ({ activeStage, beat, beatProgress, traveling }) =>
    set({ activeStage, beat, beatProgress, traveling }),
  cameraT: 0,
  setCameraT: (cameraT) => set({ cameraT }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
  prompt: "Photosynthesis is the process by",
  setPrompt: (prompt) => set({ prompt }),
  deepDiveOpen: false,
  setDeepDiveOpen: (deepDiveOpen) => set({ deepDiveOpen }),
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
