/**
 * Inference worker: hosts the GPT-2 tokenizer + instrumented ONNX session.
 * Loads lazily on the first `load` message; streams download progress.
 * WebGPU when available, WASM otherwise.
 */
import { AutoTokenizer, env, PreTrainedTokenizer } from "@huggingface/transformers";
import * as ort from "onnxruntime-web";
import { softmax, topkIndices } from "./math";
import {
  MAX_TOKENS,
  N_LAYER,
  type ModelOutput,
  type WorkerRequest,
  type WorkerResponse,
} from "./protocol";

// tokenizer + model are vendored under public/ — fully self-hosted, no hub calls
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/tokenizer/";

// ORT's .wasm/.mjs runtime files resolve badly through bundlers; self-host
// them (copied from node_modules/onnxruntime-web/dist by scripts/setup.sh)
ort.env.wasm.wasmPaths = "/ort/";

const MODEL_URL = "/model/gpt2-instrumented.onnx";
const VOCAB = 50257;

let tokenizer: PreTrainedTokenizer | null = null;
let session: ort.InferenceSession | null = null;
let backend: "webgpu" | "wasm" = "wasm";
let loading: Promise<void> | null = null;

function post(msg: WorkerResponse, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(msg, transfer);
}

async function fetchModelWithProgress(): Promise<ArrayBuffer> {
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) {
    throw new Error(`model fetch failed: HTTP ${res.status}`);
  }
  const total = Number(res.headers.get("Content-Length") ?? 0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    post({ type: "progress", loaded, total });
  }
  const buf = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return buf.buffer;
}

async function load(): Promise<void> {
  if (session) return;
  loading ??= (async () => {
    tokenizer = await AutoTokenizer.from_pretrained("gpt2");
    const modelBuffer = await fetchModelWithProgress();
    // WASM only for now: the int8 graph returns numerically wrong logits on
    // the WebGPU EP (verified against the node CPU reference). Revisit with
    // an fp16/q4f16 export if WASM latency becomes a problem.
    session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ["wasm"],
    });
    backend = "wasm";
    post({ type: "ready", backend });
  })();
  return loading;
}

async function run(id: number, text: string): Promise<void> {
  await load();
  if (!tokenizer || !session) throw new Error("model not loaded");

  const allIds: number[] = tokenizer(text)
    .input_ids.tolist()[0]
    .map((v: bigint | number) => Number(v));
  const truncated = allIds.length > MAX_TOKENS;
  const ids = allIds.slice(0, MAX_TOKENS);
  const seq = ids.length;
  if (seq === 0) {
    post({ type: "error", id, message: "empty input" });
    return;
  }
  const tokens = ids.map((t) => tokenizer!.decode([t]));

  const feeds = {
    input_ids: new ort.Tensor(
      "int64",
      BigInt64Array.from(ids.map(BigInt)),
      [1, seq],
    ),
  };
  const out = await session.run(feeds);

  const attention: Float32Array[] = [];
  const scores: Float32Array[] = [];
  for (let l = 0; l < N_LAYER; l++) {
    attention.push(new Float32Array(out[`attn_${l}`].data as Float32Array));
    scores.push(new Float32Array(out[`scores_${l}`].data as Float32Array));
  }

  const logits = out.logits.data as Float32Array;
  const finalLogits = new Float32Array(
    logits.subarray((seq - 1) * VOCAB, seq * VOCAB),
  );
  const probs = softmax(finalLogits);
  const topk = topkIndices(probs, 10).map((i) => ({
    id: i,
    token: tokenizer!.decode([i]),
    prob: probs[i],
  }));

  const output: ModelOutput = {
    text,
    ids,
    tokens,
    truncated,
    seq,
    attention,
    scores,
    topk,
    finalLogits,
  };
  post({ type: "result", id, output }, [
    ...attention.map((a) => a.buffer),
    ...scores.map((s) => s.buffer),
    finalLogits.buffer,
  ]);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === "load") await load();
    else if (msg.type === "run") await run(msg.id, msg.text);
  } catch (err) {
    post({
      type: "error",
      id: msg.type === "run" ? msg.id : undefined,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
