export type StageId =
  | "tokenization"
  | "embeddings"
  | "positional"
  | "attention"
  | "multi-head"
  | "ffn"
  | "residual"
  | "layernorm"
  | "prediction"
  | "weights";

export type Vec3 = [number, number, number];

export interface Stage {
  id: StageId;
  /** Mission-style phase label, e.g. "PHASE 01" */
  phase: string;
  title: string;
  /** Short label for the progress rail */
  short: string;
  /** One-line teaser shown in the HUD before content lands (M2) */
  teaser: string;
  /** What this stage receives — matches the previous stage's `output` */
  input: string;
  /** What this stage hands to the next */
  output: string;
  /** Stages 5–10 are stations only until M3 */
  built: boolean;
  /**
   * How many scroll-driven beats this station holds. Each beat is a
   * micro-moment the camera dwells on (text + visual state advance);
   * between stations the camera travels. Built stages get a richer
   * sequence; placeholder stations get a single beat.
   */
  beats: number;
}

export const STAGES: Stage[] = [
  {
    id: "tokenization",
    phase: "PHASE 01",
    title: "Tokenization",
    short: "Tokens",
    teaser: "Your text shatters into the pieces the model can read.",
    input: "raw text",
    output: "token ids",
    built: true,
    beats: 3,
  },
  {
    id: "embeddings",
    phase: "PHASE 02",
    title: "Embeddings",
    short: "Vectors",
    teaser: "Each token becomes a point in a space where meaning is geometry.",
    input: "token ids",
    output: "meaning vectors",
    built: true,
    beats: 3,
  },
  {
    id: "positional",
    phase: "PHASE 03",
    title: "Positional Encoding",
    short: "Position",
    teaser: "Order is information — the model learns where each token sits.",
    input: "meaning vectors",
    output: "vectors + position",
    built: true,
    beats: 3,
  },
  {
    id: "attention",
    phase: "PHASE 04",
    title: "Attention",
    short: "Attention",
    teaser: "Queries meet keys; every token looks back at the ones before it.",
    input: "vectors + position",
    output: "context-mixed vectors",
    built: true,
    beats: 3,
  },
  {
    id: "multi-head",
    phase: "PHASE 05",
    title: "Multi-Head Attention",
    short: "Heads",
    teaser: "Many heads attend in parallel, each watching for something different.",
    input: "vectors + position",
    output: "all heads, recombined",
    built: true,
    beats: 3,
  },
  {
    id: "ffn",
    phase: "PHASE 06",
    title: "Feed-Forward Network",
    short: "MLP",
    teaser: "Each token, alone, passes through the layer's thinking machinery.",
    input: "context-mixed vectors",
    output: "transformed vectors",
    built: true,
    beats: 3,
  },
  {
    id: "residual",
    phase: "PHASE 07",
    title: "Residual Stream",
    short: "Stream",
    teaser: "A highway of information that every layer reads from and writes to.",
    input: "every layer's output",
    output: "the accumulated stream",
    built: true,
    beats: 3,
  },
  {
    id: "layernorm",
    phase: "PHASE 08",
    title: "Layer Normalization",
    short: "LayerNorm",
    teaser: "Keeping the signal steady as it travels through the layers.",
    input: "raw activations",
    output: "normalized activations",
    built: true,
    beats: 3,
  },
  {
    id: "prediction",
    phase: "PHASE 09",
    title: "Next-Token Prediction",
    short: "Prediction",
    teaser: "Logits, softmax, a roll of the dice — the next word appears.",
    input: "final position's vector",
    output: "probabilities over the vocabulary",
    built: true,
    beats: 3,
  },
  {
    id: "weights",
    phase: "PHASE 10",
    title: "Architecture vs. Weights",
    short: "Weights",
    teaser: "The same machine, before and after it learned everything.",
    input: "the architecture (code)",
    output: "the learned model (parameters)",
    built: true,
    beats: 3,
  },
];

export const STAGE_COUNT = STAGES.length;

/**
 * Beat-scroll timeline. The journey is a sequence of bands laid end to end:
 * each stage contributes a `dwell` band `beats` units long (camera parked,
 * text + visuals advance beat by beat) followed by a `travel` band of
 * `TRAVEL_UNITS` (camera flies to the next station). One unit ≈ one
 * viewport-height of scroll.
 */
const TRAVEL_UNITS = 1;

/** Total scroll units across the whole journey (dwell beats + travels). */
export const JOURNEY_UNITS =
  STAGES.reduce((sum, s) => sum + s.beats, 0) +
  (STAGE_COUNT - 1) * TRAVEL_UNITS;

/** Unit offset where stage `index`'s dwell band begins. */
function stageBandStart(index: number): number {
  let cursor = 0;
  for (let i = 0; i < index; i++) {
    cursor += STAGES[i].beats + TRAVEL_UNITS;
  }
  return cursor;
}

export interface JourneyPosition {
  /** Stage currently framed (during travel, flips at the midpoint). */
  stageIndex: number;
  /** Active beat within the stage (0-based). */
  beatIndex: number;
  /** Progress through the active beat, 0..1. */
  beatProgress: number;
  /** Camera path parameter, 0..1, fed to the Catmull-Rom rig. */
  cameraT: number;
  /** True while flying between stations (dwell bands set false). */
  traveling: boolean;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Map scroll progress (0..1) to a position on the beat-scroll timeline.
 * Pure and unit-testable; the camera rig and stage visuals both read it.
 */
export function journeyFromProgress(progress: number): JourneyPosition {
  const p = Math.min(1, Math.max(0, progress));
  const denom = Math.max(1, STAGE_COUNT - 1);
  const pos = p * JOURNEY_UNITS;
  let cursor = 0;

  for (let i = 0; i < STAGE_COUNT; i++) {
    const beats = STAGES[i].beats;
    // dwell band for stage i
    if (pos <= cursor + beats || i === STAGE_COUNT - 1) {
      const local = Math.min(beats, Math.max(0, pos - cursor));
      const beatIndex = Math.min(beats - 1, Math.floor(local));
      return {
        stageIndex: i,
        beatIndex,
        beatProgress: Math.min(1, local - beatIndex),
        cameraT: i / denom,
        traveling: false,
      };
    }
    cursor += beats;
    // travel band between stage i and i+1
    if (pos <= cursor + TRAVEL_UNITS) {
      const f = (pos - cursor) / TRAVEL_UNITS;
      const here = f < 0.5 ? i : i + 1;
      return {
        stageIndex: here,
        beatIndex: here === i ? STAGES[i].beats - 1 : 0,
        beatProgress: here === i ? 1 : 0,
        cameraT: (i + smoothstep(f)) / denom,
        traveling: true,
      };
    }
    cursor += TRAVEL_UNITS;
  }
  // unreachable (last stage handled above), but keep types happy
  return {
    stageIndex: STAGE_COUNT - 1,
    beatIndex: STAGES[STAGE_COUNT - 1].beats - 1,
    beatProgress: 1,
    cameraT: 1,
    traveling: false,
  };
}

/** Scroll progress (0..1) at which stage `index`'s dwell band begins. */
export function scrollOffsetForStage(index: number): number {
  const clamped = Math.min(STAGE_COUNT - 1, Math.max(0, index));
  return stageBandStart(clamped) / JOURNEY_UNITS;
}

/**
 * Station positions: a gentle serpentine descent through the void.
 * Camera keyframes sit behind/above each station, looking down-path.
 */
export function stationPosition(index: number): Vec3 {
  return [
    Math.sin(index * 0.85) * 16,
    Math.cos(index * 0.6) * 5,
    -index * 42,
  ];
}

export function cameraKeyframe(index: number): Vec3 {
  const [x, y, z] = stationPosition(index);
  const zoomOutByStage: Partial<Record<StageId, number>> = {
    embeddings: 10,
    positional: 9,
    attention: 10,
    "multi-head": 11,
    ffn: 10,
    residual: 11,
    layernorm: 10,
    prediction: 11,
    weights: 11,
  };
  const extraDistance = zoomOutByStage[STAGES[index]?.id] ?? 0;
  // offset left + above so the station frames right-of-center,
  // clear of the HUD's left-side stage panel
  return [x - 7.5, y + 4.5, z + 17 + extraDistance];
}

/** Map scroll progress (0..1) to the framed stage index. */
export function stageIndexForProgress(progress: number): number {
  return journeyFromProgress(progress).stageIndex;
}
