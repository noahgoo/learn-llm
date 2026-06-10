# SPEC — "Inside the Model" (working title)

Interactive, visually stunning 3D web application for learning how LLMs and transformers work — from tokenization to next-token prediction — by flying through and interacting with a living model, not reading pages of text.

## 1. Objective

### Vision
A NASA-Eyes-style cinematic experience (see Mars 2020 EDL reference) where the user follows a piece of text through a real transformer. The default mode is a **guided scroll-driven camera journey** through a 3D transformer model; at every stage the user can **break out and free-explore** — orbit, click components, and drill into deeper technical layers.

### What makes it different
1. **One coherent 3D model**, not a collection of articles. The transformer is the navigation.
2. **Real math, live**: GPT-2 small runs in the browser (Transformers.js). The user types any text and watches *their* tokens, *their* attention weights, and *their* next-token probabilities flow through the model.
3. **Dual-depth content**: every stage has a "Simple" lens (analogy-first, for the average person) and a "Technical" lens (equations, tensor shapes, paper-accurate detail) — toggleable everywhere.
4. **Everything cited**: every factual claim traces to a research paper (e.g., Vaswani et al. 2017; Radford et al. 2019; Ba et al. 2016; Sennrich et al. 2016 / BPE; Elhage et al. 2021 / residual stream framing). Citations render inline as hoverable markers and aggregate in a References view.

### Target users
- **Curious general public** — wants intuition: "how does ChatGPT actually work?"
- **Engineers / students** — wants tensor shapes, equations, and the paper trail.
- **Open-source contributors** — the project itself is OSS (MIT); codebase must be approachable.

### Journey stages (the spine)
1. Input text & **Tokenization** (BPE)
2. **Embeddings** (token → vector; vector space intuition)
3. **Positional encoding** (learned positions in GPT-2; sinusoidal covered in Technical lens)
4. **Attention** (single head) — dedicated **Query / Key / Value** sub-stage: what Q, K, V each represent (Simple lens: search analogy — query = what I'm looking for, key = what I advertise, value = what I hand over; Technical lens: learned projections W_Q/W_K/W_V, dot-product scores, scaling by √d_k, causal mask, softmax, weighted sum of values). User's own tokens show their live Q·K score matrix.
5. **Multi-head attention** (heads in parallel, head specialization)
6. **Feed-forward network** (per-token MLP, GELU)
7. **Residual stream** (the highway; reading/writing framing per Elhage et al.)
8. **Layer normalization** (where and why)
9. Stacked layers → **Next-token prediction** (logits, softmax, temperature, sampling)
10. **Architecture vs. trained weights** (the program vs. what training learned)

### Acceptance criteria (MVP — vertical slice)
- [ ] Landing → 3D scene loads ≥ 50 fps on a 2021 MacBook; graceful fallback message for WebGL-less browsers.
- [ ] Scroll drives camera through stages 1–4 (tokenization, embeddings, positional encoding, attention) at full polish; stages 5–10 present as labeled stations with "coming soon" depth.
- [ ] User can type arbitrary text (≤ 64 tokens); real GPT-2 tokenization renders in 3D within 100 ms after model warm-up.
- [ ] Attention stage shows real attention weights for the user's text, per head, selectable.
- [ ] Simple/Technical lens toggle persists across stages and changes both copy and visualization annotations.
- [ ] Every claim in shipped copy has a citation marker; References page lists all sources with links (arXiv preferred).
- [ ] Model download (~250 MB ONNX) is lazy, progress-indicated, and the journey is browsable in "illustrative mode" before/without it.
- [ ] Keyboard + reduced-motion accessibility: journey navigable without scroll; `prefers-reduced-motion` swaps flights for cuts.
- [ ] Verified in Chrome via DevTools MCP at each milestone, plus user validation checkpoints.

## 2. Tech stack & commands

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router, **static export**) + TypeScript (strict) |
| 3D | three.js via @react-three/fiber + @react-three/drei + @react-three/postprocessing |
| Scroll/animation | drei ScrollControls + framer-motion for DOM; spring-based camera rig |
| Inference | @huggingface/transformers (Transformers.js) running GPT-2 small (ONNX, WebGPU with WASM fallback), in a Web Worker |
| Styling | Tailwind CSS v4 |
| State | zustand (journey state, lens, model outputs) |
| Content | MDX per stage, frontmatter for citations; citations in BibTeX-like JSON |
| Testing | Vitest (+ @testing-library/react); Playwright optional later |
| Lint/format | ESLint + Prettier |
| Hosting | Vercel (static); works on GitHub Pages too |

### Commands
```bash
npm run dev          # dev server (localhost:3000)
npm run build        # static export → out/
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run test:watch   # vitest
```

## 3. Project structure

```
learn_llm/
├── SPEC.md
├── README.md                  # OSS-facing: vision, screenshots, contributing
├── LICENSE                    # MIT
├── app/                       # Next.js App Router
│   ├── page.tsx               # the experience (single-page journey)
│   ├── references/page.tsx    # aggregated citations
│   └── layout.tsx
├── components/
│   ├── canvas/                # R3F scene graph
│   │   ├── Experience.tsx     # scene root, camera rig, ScrollControls
│   │   ├── stages/            # one folder per journey stage
│   │   │   ├── tokenization/
│   │   │   ├── embeddings/
│   │   │   ├── positional/
│   │   │   ├── attention/
│   │   │   └── ...
│   │   └── shared/            # token meshes, vector arrows, glow materials
│   └── ui/                    # DOM overlay: HUD, lens toggle, stage panel,
│                              # citation popover, progress rail, input box
├── content/
│   ├── stages/*.mdx           # dual-lens copy per stage (simple + technical)
│   └── citations.json         # single source of truth for references
├── lib/
│   ├── model/                 # Transformers.js worker, tokenizer API,
│   │                          # attention/logit extraction, fixture fallback
│   ├── journey.ts             # stage definitions, camera keyframes
│   └── store.ts               # zustand stores
├── fixtures/                  # precomputed GPT-2 outputs for example texts
│                              # (powers "illustrative mode" pre-download)
└── tests/
```

## 4. Code style
- TypeScript strict; no `any` without a comment justifying it.
- Components: function components, named exports; one component per file beyond ~40 lines.
- R3F: scene logic in `components/canvas`, never DOM concerns; DOM overlay never imports three.js.
- Heavy math (softmax displays, projections) in pure functions under `lib/` — unit-testable, no React.
- All model inference off-main-thread (Web Worker); UI talks to it via a typed message protocol.
- Copy lives in MDX, never hard-coded in components.
- Every factual sentence in MDX carries a `<Cite id="..."/>` referencing `citations.json`.

## 5. Testing strategy
- **Unit (Vitest)**: lib/ math (softmax, projections, layout algorithms), citation integrity (every `<Cite>` id exists in citations.json; every citation has title/authors/year/url), journey keyframe continuity.
- **Component**: UI overlay components (lens toggle, citation popover) with Testing Library.
- **Fixture-based model tests**: tokenizer/attention extraction validated against precomputed GPT-2 fixtures (exact token ids, attention shape `[layers, heads, seq, seq]`).
- **Manual browser verification (required per milestone)**: Chrome DevTools MCP — load page, scroll journey, capture console errors, screenshot each stage, check fps via performance trace. Then user validation checkpoint before next milestone.

## 6. Boundaries

### Always
- Source every factual claim from a research paper; prefer primary sources (original papers) over blog posts.
- Keep the journey usable before model download (fixtures/illustrative mode).
- Verify in Chrome (DevTools MCP) before presenting a milestone to the user.
- Keep bundle lean: 3D assets generated procedurally or < 1 MB; model weights lazy-loaded only.
- Maintain reduced-motion and keyboard paths for anything scroll-driven.

### Ask first
- Adding any runtime dependency beyond the stack above.
- Changing visual direction (color system, typography, camera language) once user approves the first slice.
- Swapping GPT-2 for another model.
- Publishing/deploying anywhere public.

### Never
- Invent or paraphrase citations that weren't verified against the actual paper.
- Block first paint on the 250 MB model download.
- Commit model weights or large binaries to the repo.
- Add a backend/server dependency — site must remain fully static.

## 7. Milestones (high level — detailed plan after spec approval)
1. **M0 Foundation**: repo, Next.js + R3F scaffold, design system, camera rig, scroll journey skeleton with placeholder stations. *(Chrome check + user validation)*
2. **M1 Real model plumbing**: Transformers.js worker, tokenizer + attention extraction, fixtures, input box. *(validation)*
3. **M2 Vertical slice**: stages 1–4 fully realized, dual-lens content + citations. *(validation)*
4. **M3 Remaining stages**: 5–10 to full depth.
5. **M4 OSS polish**: README, CONTRIBUTING, CI (lint/typecheck/test), deploy.
