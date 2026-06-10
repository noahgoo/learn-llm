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
  },
  {
    id: "embeddings",
    phase: "PHASE 02",
    title: "Embeddings",
    short: "Vectors",
    teaser: "Each token becomes a point in a 768-dimensional space.",
    input: "token ids",
    output: "768-d vectors",
    built: true,
  },
  {
    id: "positional",
    phase: "PHASE 03",
    title: "Positional Encoding",
    short: "Position",
    teaser: "Order is information — the model learns where each token sits.",
    input: "768-d vectors",
    output: "vectors + position",
    built: true,
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
  },
  {
    id: "multi-head",
    phase: "PHASE 05",
    title: "Multi-Head Attention",
    short: "Heads",
    teaser: "Twelve heads attend in parallel, each watching for something different.",
    input: "vectors + position",
    output: "12 heads, recombined",
    built: false,
  },
  {
    id: "ffn",
    phase: "PHASE 06",
    title: "Feed-Forward Network",
    short: "MLP",
    teaser: "Each token, alone, passes through the layer's thinking machinery.",
    input: "context-mixed vectors",
    output: "transformed vectors",
    built: false,
  },
  {
    id: "residual",
    phase: "PHASE 07",
    title: "Residual Stream",
    short: "Stream",
    teaser: "A highway of information that every layer reads from and writes to.",
    input: "every layer's output",
    output: "the accumulated stream",
    built: false,
  },
  {
    id: "layernorm",
    phase: "PHASE 08",
    title: "Layer Normalization",
    short: "LayerNorm",
    teaser: "Keeping the signal steady as it travels through 12 layers.",
    input: "raw activations",
    output: "normalized activations",
    built: false,
  },
  {
    id: "prediction",
    phase: "PHASE 09",
    title: "Next-Token Prediction",
    short: "Prediction",
    teaser: "Logits, softmax, a roll of the dice — the next word appears.",
    input: "final position's vector",
    output: "probabilities over 50,257 tokens",
    built: false,
  },
  {
    id: "weights",
    phase: "PHASE 10",
    title: "Architecture vs. Weights",
    short: "Weights",
    teaser: "The same machine, before and after it learned everything.",
    input: "the architecture (code)",
    output: "the learned model (parameters)",
    built: false,
  },
];

export const STAGE_COUNT = STAGES.length;

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
  // offset left + above so the station frames right-of-center,
  // clear of the HUD's left-side stage panel
  return [x - 7.5, y + 4.5, z + 17];
}

/** Map scroll progress (0..1) to the nearest stage index. */
export function stageIndexForProgress(progress: number): number {
  return Math.min(
    STAGE_COUNT - 1,
    Math.max(0, Math.round(progress * (STAGE_COUNT - 1))),
  );
}
