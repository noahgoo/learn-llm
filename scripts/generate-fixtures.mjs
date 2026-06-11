// Generates committed fixtures: real GPT-2 outputs for example sentences.
// These power illustrative mode (pre-download) and the unit tests.
// Run: node scripts/generate-fixtures.mjs   (needs public/model/*.onnx —
// produce it first with .venv/bin/python scripts/export_model.py)
import { AutoTokenizer } from "@huggingface/transformers";
import ort from "onnxruntime-node";
import { mkdirSync, writeFileSync } from "node:fs";

const N_LAYER = 12;
const VOCAB = 50257;
const SENTENCES = [
  "The cat sat on the",
  "Once upon a time, there was a",
  "The capital of France is",
  "She opened the door and saw",
  "To be or not to be, that is the",
  "The quick brown fox jumps over the",
  "It was a dark and stormy",
];

// keep in sync with lib/model/math.ts (tested there)
function softmax(logits) {
  const out = new Float32Array(logits.length);
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    out[i] = Math.exp(logits[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

const round = (x) => Math.round(x * 1e5) / 1e5;

const tokenizer = await AutoTokenizer.from_pretrained("Xenova/gpt2");
const session = await ort.InferenceSession.create(
  "public/model/gpt2-instrumented.onnx",
);

const fixtures = [];
for (const text of SENTENCES) {
  const ids = tokenizer(text).input_ids.tolist()[0].map(Number);
  const seq = ids.length;
  const out = await session.run({
    input_ids: new ort.Tensor(
      "int64",
      BigInt64Array.from(ids.map(BigInt)),
      [1, seq],
    ),
  });
  const attention = [];
  const scores = [];
  for (let l = 0; l < N_LAYER; l++) {
    attention.push(Array.from(out[`attn_${l}`].data, round));
    scores.push(
      Array.from(out[`scores_${l}`].data, (v) =>
        Number.isFinite(v) ? round(v) : -1e9,
      ),
    );
  }
  const round3 = (v) => Math.round(v * 1e3) / 1e3;
  const tokEmb = Array.from(out.tok_emb.data, round3);
  const posEmb = Array.from(out.pos_emb.data, round3);

  const logits = out.logits.data;
  const final = logits.subarray((seq - 1) * VOCAB, seq * VOCAB);
  const probs = softmax(final);
  const topk = [...probs.keys()]
    .sort((a, b) => probs[b] - probs[a])
    .slice(0, 10)
    .map((id) => ({ id, token: tokenizer.decode([id]), prob: round(probs[id]) }));

  fixtures.push({
    text,
    ids,
    tokens: ids.map((id) => tokenizer.decode([id])),
    seq,
    attention,
    scores,
    tokEmb,
    posEmb,
    topk,
  });
  console.log(`${JSON.stringify(text)} -> ${seq} tokens, top: ${topk[0].token}`);
}

mkdirSync("fixtures", { recursive: true });
writeFileSync("fixtures/sentences.json", JSON.stringify(fixtures));
console.log("wrote fixtures/sentences.json");
