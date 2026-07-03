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
 * Diegetic layout — the space IS the transformer. Three acts:
 *
 *   Intake (0–2):  a straight descending corridor into the machine —
 *                  tokenization gate, embedding hall, positional bend.
 *   Tower  (3–7):  the transformer block. The path turns VERTICAL and
 *                  climbs floor by floor: attention → heads → MLP →
 *                  residual stream → layernorm. The BlockTower shell
 *                  (12 slabs = 12 layers) wraps this segment.
 *   Summit (8–9):  prediction exits the tower top; the weights hall
 *                  lies beyond.
 *
 * Authored table, not a formula: each position is a set piece. Small
 * x/z jitter on the tower floors keeps the climb from reading as an
 * elevator shaft. Consecutive stations stay >20 world units apart
 * (see journey.test.ts).
 */
const STATION_LAYOUT: Vec3[] = [
  [0, 6, 0], //       00 tokenization — the gate at the mouth
  [5, 1, -48], //     01 embeddings — descending into the hall
  [-4, -3, -96], //   02 positional — the corridor bends
  [0, -4, -140], //   03 attention — tower base
  [3, 18, -144], //   04 multi-head — floor 2
  [-3, 40, -140], //  05 ffn — floor 3
  [2, 62, -144], //   06 residual — the core conduit
  [-2, 84, -140], //  07 layernorm — top floor
  [0, 98, -192], //   08 prediction — out through the summit
  [0, 92, -246], //   09 weights — the hall beyond
];

/** Central axis of the block tower (x, z) and its vertical extent. */
export const TOWER_AXIS = { x: 0, z: -142, yMin: -12, yMax: 92 };

export function stationPosition(index: number): Vec3 {
  return STATION_LAYOUT[Math.min(STATION_LAYOUT.length - 1, Math.max(0, index))];
}

/**
 * Per-stage camera offsets (relative to the station), authored so each stop
 * has its own shot instead of one repeated framing. Constraints: x stays
 * negative (station frames right-of-center, clear of the left HUD lane) and
 * z stays positive (camera in front of the station — see journey.test.ts).
 *
 *   intake:  eye-level drift down the corridor, each shot a little wider
 *   tower:   low angle looking UP at the base (arrival drama), swinging
 *            side to side and tightening as the climb goes on
 *   summit:  high crane shot for prediction, then settling wide and level
 *            before the weights hall
 */
const CAMERA_OFFSETS: Record<StageId, Vec3> = {
  tokenization: [-7.5, 4.5, 17], //  close, eye level — the gate
  embeddings: [-10, 6, 27], //       wider + higher — the hall opens up
  positional: [-6, 2, 26], //        drops low — the corridor bends
  attention: [-9, -3, 27], //        LOW angle at the tower base, looking up
  "multi-head": [-11, 3, 23], //     swings left, level with floor 2
  ffn: [-5, 5, 23], //               tighter, slightly above floor 3
  residual: [-12, 1, 25], //         pulled out — see the conduit climb
  layernorm: [-6, 7, 23], //         high, near the top floor
  prediction: [-8, 10, 24], //       crane shot down onto the summit exit
  weights: [-7.5, 4.5, 24], //       settles wide and level — the hall
};

export function cameraKeyframe(index: number): Vec3 {
  const [x, y, z] = stationPosition(index);
  const [dx, dy, dz] = CAMERA_OFFSETS[STAGES[index]?.id] ?? [-7.5, 4.5, 17];
  return [x + dx, y + dy, z + dz];
}

/** Map scroll progress (0..1) to the framed stage index. */
export function stageIndexForProgress(progress: number): number {
  return journeyFromProgress(progress).stageIndex;
}
