/**
 * Typed message protocol between the UI thread and the inference worker.
 * The UI never imports onnxruntime/transformers; it only speaks this protocol.
 */

export const MAX_TOKENS = 64;
export const N_LAYER = 12;
export const N_HEAD = 12;

export interface TopToken {
  id: number;
  token: string;
  prob: number;
}

/** Everything one forward pass produces for the visualizations. */
export interface ModelOutput {
  text: string;
  /** Token ids, length `seq` (≤ MAX_TOKENS; input truncated beyond that) */
  ids: number[];
  /** Decoded token strings aligned with `ids` */
  tokens: string[];
  truncated: boolean;
  seq: number;
  /**
   * Attention softmax per layer: Float32Array of [N_HEAD, seq, seq],
   * indexed attention[layer][(head * seq + qPos) * seq + kPos].
   */
  attention: Float32Array[];
  /** Masked pre-softmax scores (Q·K/√d), same layout as `attention`. */
  scores: Float32Array[];
  /** Token embeddings before position is added: [seq * 768] row-major. */
  tokEmb: Float32Array;
  /** Position embeddings for this sequence length: [seq * 768] row-major. */
  posEmb: Float32Array;
  /** Top-k next-token candidates (softmax at final position, T=1). */
  topk: TopToken[];
  /** Final-position logits for the full vocab (for temperature/sampling UI). */
  finalLogits: Float32Array;
}

export type WorkerRequest =
  | { type: "load" }
  | { type: "run"; id: number; text: string };

export type WorkerResponse =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready"; backend: "webgpu" | "wasm" }
  | { type: "result"; id: number; output: ModelOutput }
  | { type: "error"; id?: number; message: string };
