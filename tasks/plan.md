# Implementation Plan — Inside the Model

Source of truth for requirements: `SPEC.md`. This file: dependency graph, phases, task details, checkpoints.
Task status lives in `tasks/todo.md`.

## Dependency graph

```
T0.1 scaffold
 ├── T0.2 repo hygiene (parallel)
 ├── T0.3 design system + HUD shell
 │     └── T0.4 R3F canvas + camera rig + scroll journey skeleton
 │           └── [CHECKPOINT A: user validates look/feel/camera language]
 └── T1.1 worker + Transformers.js loader        (parallel with T0.3/T0.4)
       ├── T1.2 tokenizer API
       ├── T1.3 attention/logits extraction
       └── T1.4 fixtures + illustrative mode
             └── T1.5 input box wired to worker
                   └── [CHECKPOINT B: real tokens from user text]
T0.4 + T1.5 + T2.0 content infra
 └── T2.1 → T2.2 → T2.3 → T2.4 stage builds (sequential, share visual language)
       └── T2.5 free-explore breakout
             └── [CHECKPOINT C: vertical slice validation]
 └── T3.1–T3.6 remaining stages
       └── [CHECKPOINT D]
 └── T4.1–T4.4 OSS polish, CI, audit, deploy
```

Every task ends with: `npm run lint && npm run typecheck && npm run test` green, plus the task's own verification step. Stages and anything visual additionally get a Chrome DevTools MCP check (console clean, screenshot, fps where relevant).

---

## Phase M0 — Foundation

### T0.1 Project scaffold
Create Next.js 15 (App Router, TypeScript strict, static export `output: 'export'`), Tailwind v4, ESLint + Prettier, Vitest + Testing Library. All SPEC §2 commands runnable.
- **Accept**: `dev`, `build`, `lint`, `typecheck`, `test` all succeed; `build` emits `out/`; strict mode on.
- **Verify**: run all five commands; one trivial passing test exists.

### T0.2 Repo hygiene
`git init`, MIT `LICENSE`, `.gitignore` (node, next, `out/`, model caches), stub `README.md`, first commit.
- **Accept**: clean `git status` after commit; license year/name correct.

### T0.3 Design system + HUD shell
Color tokens, typography, dark cinematic base (NASA-EDL-inspired: deep space bg, white text, thin rules). DOM overlay components: progress rail (left edge), stage title/copy panel, Simple/Technical lens toggle (zustand-backed, persisted), placeholder input box. No 3D yet.
- **Accept**: overlay renders over empty canvas slot; lens toggle flips state and persists across reload; responsive ≥ 1024px (mobile = graceful "best on desktop" banner for now).
- **Verify**: Chrome check — screenshot, console clean, toggle interaction.

### T0.4 R3F canvas + camera rig + journey skeleton
`Experience.tsx` with ScrollControls; `lib/journey.ts` defines 10 stages (id, title, camera keyframe, scroll range). Placeholder station meshes laid out along a path. Scroll flies camera through stations with spring smoothing; progress rail + stage panel sync to scroll. `prefers-reduced-motion` → instant cuts. No-WebGL → fallback message. Keyboard nav (↑/↓ between stages).
- **Accept**: SPEC criteria — ≥ 50 fps scroll flight on M1-class laptop; all 10 stations labeled; keyboard + reduced-motion paths work; WebGL fallback message renders.
- **Verify**: Chrome — performance trace during scroll, screenshots of ≥ 3 stations, console clean.

### ✅ CHECKPOINT A — user validation
Present screenshots + live walkthrough: visual direction, camera language, station layout. **Visual direction locks here (SPEC: ask before changing after approval).**

---

## Phase M1 — Real model plumbing
(Parallel-safe with T0.3/T0.4 after T0.1.)

### T1.1 Inference worker + model loader
Web Worker hosting `@huggingface/transformers`; GPT-2 small ONNX; WebGPU with WASM fallback; lazy load with progress events; typed request/response protocol in `lib/model/protocol.ts`.
- **Accept**: worker boots without loading weights; `load` message streams progress 0→1; UI thread never imports transformers.
- **Verify**: unit test protocol types; manual load in Chrome, network tab shows lazy fetch only after explicit trigger.

### T1.2 Tokenizer API
`tokenize(text) → { ids, tokens, byteSpans }` via worker; ≤ 64-token cap enforced with friendly truncation notice.
- **Accept**: matches GPT-2 reference fixtures exactly (ids + strings) for ≥ 5 test sentences incl. unicode/emoji.
- **Verify**: fixture unit tests.

### T1.3 Attention + logits extraction
Forward pass returns attention tensors `[layer, head, seq, seq]` and final-position logits; top-k next-token probs with temperature param.
- **Accept**: shapes correct for GPT-2 small (12 layers × 12 heads); attention rows sum to 1 (±1e-3); fixtures match.
- **Verify**: fixture unit tests; softmax/temperature math unit-tested in pure `lib/`.

### T1.4 Fixtures + illustrative mode
Node script (`scripts/generate-fixtures.ts`) precomputes tokenize/attention/logits for ~5 example sentences → `fixtures/`. App boots in illustrative mode using fixtures; switches to live mode after model loads.
- **Accept**: journey fully browsable offline/no-download using fixtures; mode switch is seamless (same data shape).
- **Verify**: unit test fixture shape = live shape; Chrome with network throttled — app usable pre-download.

### T1.5 Input box wired
Text input → worker → results in store; debounced; warm-up UX ("loading model… 34%"); pre-load, input selects among fixture sentences instead.
- **Accept**: SPEC criterion — tokenization of typed text renders ≤ 100 ms post-warm-up; no main-thread jank during inference.
- **Verify**: Chrome — type text, confirm timing via performance marks, console clean.

### ✅ CHECKPOINT B — user validation
Demo: type a sentence, see real token ids + attention shape in a dev HUD. Confirms plumbing before visual investment.

---

## Phase M2 — Vertical slice (stages 1–4 full polish)

### T2.0 Content + citation infrastructure
MDX pipeline for `content/stages/*.mdx` with `simple`/`technical` sections; `<Cite id/>` component → hover popover; `citations.json` schema (id, title, authors, year, venue, url/arXiv); References page; integrity tests (every Cite id resolves; every citation entry complete; no orphan citations). Seed citations verified against actual papers: Vaswani 2017, Radford 2019, Sennrich 2016, Ba 2016, Hendrycks & Gimpel 2016, Elhage 2021, Holtzman 2020.
- **Accept**: integrity tests green; lens toggle swaps MDX sections live; References page lists all seeds with working links.
- **Verify**: unit tests; Chrome — hover popover, links resolve (spot-check via fetch).

### T2.1 Stage — Tokenization
3D: user text shatters into BPE tokens (real ids); merge-step animation in Technical lens. Dual-lens MDX + citations (Sennrich 2016; Radford 2019).
- **Accept**: live user text drives viz; Simple lens = intuition copy, Technical = BPE merges + vocab size; cited.
- **Verify**: Chrome — type text, screenshot both lenses, fps ok, console clean.

### T2.2 Stage — Embeddings
3D: tokens become vectors; point-cloud vector space (precomputed PCA/UMAP of GPT-2 embedding matrix sampled); nearest-neighbor highlight for user's tokens. Technical lens: d_model=768, lookup table.
- **Accept**: user tokens locate in cloud; neighbors plausible; cited.
- **Verify**: Chrome check as above; projection math unit-tested.

### T2.3 Stage — Positional encoding
3D: position information layered onto embeddings; GPT-2 learned positions primary; sinusoidal (Vaswani) explained in Technical lens with interactive frequency viz.
- **Accept**: dual-lens, cited; viz reacts to token count of user text.
- **Verify**: Chrome check.

### T2.4 Stage — Attention + Q/K/V sub-stage
The flagship. Sub-stage per SPEC: Q/K/V meanings (search analogy ↔ learned projections W_Q/W_K/W_V), scaled dot-product (√d_k), causal mask, softmax → weighted sum. Live Q·K score matrix for user's tokens; head selector (single head this milestone); attention lines between 3D tokens weighted by real values.
- **Accept**: SPEC criterion — real per-head attention for user text, selectable; matrix and 3D lines consistent; dual-lens; cited (Vaswani 2017).
- **Verify**: Chrome — interact, screenshot both lenses + 2 heads; values spot-checked against fixtures.

### T2.5 Free-explore breakout
At any station: "Explore" → unlock orbit controls, clickable components with deep-dive popovers; "Resume journey" returns camera to path smoothly.
- **Accept**: breakout + return work at all 4 built stages without camera glitches; scroll disabled during explore.
- **Verify**: Chrome — enter/exit explore at each stage, console clean.

### ✅ CHECKPOINT C — user validation
Full vertical-slice walkthrough in Chrome. Stages 5–10 visible as "coming soon" stations. Sign-off gates M3.

---

## Phase M3 — Remaining stages (each: 3D viz + dual-lens MDX + citations + Chrome check)

- **T3.1 Multi-head attention** — heads in parallel; head-specialization gallery; concat + W_O. (Vaswani 2017; head-analysis lit.)
- **T3.2 Feed-forward network** — per-token MLP, 768→3072→768, GELU curve interactive. (Hendrycks & Gimpel 2016.)
- **T3.3 Residual stream** — highway visual; layers read/write; stream as shared memory. (Elhage et al. 2021.)
- **T3.4 Layer normalization** — where LN sits (pre-LN GPT-2), what it stabilizes; interactive normalize viz. (Ba 2016; Xiong 2020 pre/post-LN.)
- **T3.5 Next-token prediction** — logits → softmax → temperature slider → top-k/nucleus sampling; live probability bars for user text; "sample and continue" loop. (Holtzman 2020.)
- **T3.6 Architecture vs trained weights** — finale: same architecture, random vs trained weights side-by-side (fixture-based gibberish vs real output); "program vs learned parameters."
- Each task **Accept/Verify** mirrors T2.x pattern.

### ✅ CHECKPOINT D — user validation, full journey

---

## Phase M4 — OSS polish

- **T4.1 README + CONTRIBUTING + screenshots/GIF**, architecture overview for contributors.
- **T4.2 CI**: GitHub Actions — lint, typecheck, test, build on PR.
- **T4.3 Audit**: Lighthouse + axe pass; bundle budget (< 1 MB initial JS gz excluding lazy model); cross-browser smoke (Chrome/Safari/Firefox).
- **T4.4 Deploy** — **ask user first** (SPEC boundary); Vercel static.

---

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Transformers.js can't expose attention tensors cleanly | Spike early in T1.3; fallback = custom ONNX session via onnxruntime-web with `output_attentions` export |
| 250 MB model too heavy for casual users | Illustrative/fixture mode is first-class (T1.4); consider quantized (~80 MB q8) variant |
| 50 fps with many token meshes | Instanced meshes from day one; perf trace each stage task |
| Citation accuracy | citations.json entries verified against actual papers at T2.0; integrity tests forever |
