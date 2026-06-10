# Todo — Inside the Model

Details + acceptance criteria: `tasks/plan.md`. Check off only after task's verify step passes.

## M0 Foundation
- [x] T0.1 Project scaffold (Next.js 16 + TS strict + Tailwind v4 + Vitest + ESLint/Prettier, static export)
- [x] T0.2 Repo hygiene (git init, MIT LICENSE, .gitignore, README stub, first commit)
- [x] T0.3 Design system + HUD shell (tokens, progress rail, stage panel, lens toggle) — Chrome-verified
- [x] T0.4 R3F canvas + camera rig + scroll journey skeleton (10 stations, reduced-motion, WebGL fallback, keyboard nav) — Chrome-verified, 120 fps
- [ ] ✅ CHECKPOINT A — user validates visual direction (locks after approval)

## M1 Model plumbing
- [x] T1.1 Inference worker + lazy GPT-2 loader (typed protocol; WASM only — int8 numerically wrong on WebGPU EP, revisit with fp16 export)
- [x] T1.2 Tokenizer API (vendored locally in public/tokenizer, fixture tests)
- [x] T1.3 Attention/logits extraction — spike passed via custom instrumented ONNX export (attn/scores/QKV/hidden per layer, bit-exact vs HF)
- [x] T1.4 Fixtures (5 sentences, committed; stage visuals consume them in M2 for illustrative mode)
- [x] T1.5 Input box wired (debounced live inference, load CTA + progress, telemetry panel)
- [ ] ✅ CHECKPOINT B — user validates real-model plumbing demo
- [ ] (deferred) precise ≤100ms tokenize-latency measurement + perf marks
- [ ] (deferred) int8 WASM vs node kernel drift — consider fp16 model option

## M2 Vertical slice
- [ ] T2.0 Content + citation infra (MDX dual-lens, Cite popover, citations.json + integrity tests, References page, verified seed citations)
- [ ] T2.1 Stage: Tokenization
- [ ] T2.2 Stage: Embeddings
- [ ] T2.3 Stage: Positional encoding
- [ ] T2.4 Stage: Attention + Q/K/V sub-stage (flagship)
- [ ] T2.5 Free-explore breakout mode
- [ ] ✅ CHECKPOINT C — user validates vertical slice

## M3 Remaining stages
- [ ] T3.1 Multi-head attention
- [ ] T3.2 Feed-forward network
- [ ] T3.3 Residual stream
- [ ] T3.4 Layer normalization
- [ ] T3.5 Next-token prediction (temperature, sampling, live probs)
- [ ] T3.6 Architecture vs trained weights (finale)
- [ ] ✅ CHECKPOINT D — user validates full journey

## M4 OSS polish
- [ ] T4.1 README + CONTRIBUTING + screenshots
- [ ] T4.2 CI (GitHub Actions: lint, typecheck, test, build)
- [ ] T4.3 Lighthouse/axe/bundle/cross-browser audit
- [ ] T4.4 Deploy (ASK USER FIRST)
