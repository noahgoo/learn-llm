// Validates the instrumented GPT-2 ONNX: shapes, attention row sums,
// and a sanity next-token prediction. Run: node scripts/validate-onnx.mjs
import { AutoTokenizer } from "@huggingface/transformers";
import ort from "onnxruntime-node";

const N_LAYER = 12;
const text = "The cat sat on the";

const tokenizer = await AutoTokenizer.from_pretrained("Xenova/gpt2");
const ids = tokenizer(text).input_ids.tolist()[0].map(Number);
const seq = ids.length;

const session = await ort.InferenceSession.create(
  "public/model/gpt2-instrumented.onnx",
);
const feeds = {
  input_ids: new ort.Tensor(
    "int64",
    BigInt64Array.from(ids.map(BigInt)),
    [1, seq],
  ),
};
const t0 = performance.now();
const out = await session.run(feeds);
console.log(`forward pass: ${(performance.now() - t0).toFixed(0)} ms`);

console.log("logits dims:", out.logits.dims);
console.log("attn_0 dims:", out.attn_0.dims);
console.log("scores_0 dims:", out.scores_0.dims);
console.log("q_0 dims:", out.q_0.dims);
console.log("hidden_12 dims:", out.hidden_12.dims);

// attention rows must sum to 1
let worst = 0;
for (let l = 0; l < N_LAYER; l++) {
  const a = out[`attn_${l}`].data;
  for (let h = 0; h < 12; h++) {
    for (let i = 0; i < seq; i++) {
      let s = 0;
      for (let j = 0; j < seq; j++) s += a[(h * seq + i) * seq + j];
      worst = Math.max(worst, Math.abs(s - 1));
    }
  }
}
console.log("worst |attn row sum - 1|:", worst.toExponential(2));

// next-token sanity
const logits = out.logits.data;
const off = (seq - 1) * 50257;
const top = [...Array(50257).keys()]
  .map((i) => [logits[off + i], i])
  .sort((a, b) => b[0] - a[0])
  .slice(0, 5);
console.log(
  "top-5 after `The cat sat on the`:",
  top.map(([, i]) => JSON.stringify(tokenizer.decode([i]))).join(" "),
);
