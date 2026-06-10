// M1 spike (plan T1.3): does GPT-2 via Transformers.js expose attention?
// Prints tokenizer output and the ONNX session's declared inputs/outputs.
import { AutoTokenizer, AutoModelForCausalLM } from "@huggingface/transformers";

const tokenizer = await AutoTokenizer.from_pretrained("Xenova/gpt2");
const enc = tokenizer("The cat sat on the");
console.log("token ids:", enc.input_ids.tolist());
const ids = enc.input_ids.tolist()[0].map(Number);
console.log(
  "tokens:",
  ids.map((id) => tokenizer.decode([id])),
);

const model = await AutoModelForCausalLM.from_pretrained("Xenova/gpt2", {
  dtype: "int8",
  progress_callback: (p) =>
    p.status === "progress" &&
    p.file?.endsWith(".onnx") &&
    process.stdout.write(`\r${p.file} ${Math.round(p.progress)}%   `),
});
console.log("\nmodel loaded");

for (const [name, session] of Object.entries(model.sessions ?? {})) {
  console.log(`session "${name}"`);
  console.log("  inputs :", session.inputNames);
  console.log("  outputs:", session.outputNames);
}

const out = await model(enc);
console.log("forward output keys:", Object.keys(out));
console.log("logits dims:", out.logits.dims);
