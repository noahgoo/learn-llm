# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive 3D explainer for transformer LLMs. The user types a prompt and scrolls through a 10-stage journey (tokenization → … → next-token prediction). An instrumented GPT-2 small runs **in the browser** via a Web Worker; before it loads, committed fixtures drive the visuals. Next.js 16 (App Router, static export) + React 19 + React Three Fiber/drei + Tailwind v4 + Zustand.

## Commands

```bash
npm install
bash scripts/setup.sh   # ONE-TIME after install: vendors ORT wasm + exports the
                        # instrumented ONNX model (Python venv, ~5 min). These
                        # artifacts are intentionally NOT in git.
npm run dev             # dev server
npm run build           # static export to out/
DEPLOY_TARGET=gh-pages npm run build   # build with basePath /learn-llm for GH Pages

npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm run test            # vitest run (all)
npx vitest run tests/journey.test.ts        # single file (tests live in tests/)
npx vitest run -t "journeyFromProgress"     # single test by name
npm run format          # prettier --write .
```

The app will run without `setup.sh` (fixtures cover the suggested prompts), but live inference needs the vendored model + ORT runtime under `public/`.

## Architecture

**Two synchronized layers, both driven by window scroll** (`app/page.tsx`): a fixed full-screen R3F `<Experience>` (the 3D scene) sits behind a DOM `<Hud>` (panels, captions, controls). `<ScrollTrack>` renders an invisible runway `JOURNEY_UNITS` viewport-heights tall and is the only scroll listener.

**The journey timeline is the spine — `lib/journey.ts`.** It is pure and unit-tested. `journeyFromProgress(0..1)` maps scroll into `{ stageIndex, beatIndex, beatProgress, cameraT, traveling }`. The timeline is bands laid end to end: each stage has a `dwell` band `beats` units long (camera parked, visuals advance beat-by-beat) followed by a 1-unit `travel` band (camera flies to the next station). `stationPosition`/`cameraKeyframe` define the serpentine 3D layout. Changing stage count/beats/positions here cascades to the camera rig and every stage visual — keep it the single source of truth.

**State lives in Zustand stores, not React props:**
- `lib/store.ts` — `useJourneyStore` (activeStage/beat/beatProgress/cameraT/traveling, written by ScrollTrack), `useLensStore` (simple|technical, persisted), `useAttentionStore` (layer/head/view selectors), `usePredictionStore` (temperature/topP), `useTelemetryStore`.
- `lib/model/client.ts` — `useModelStore` (worker lifecycle, status, download progress, latest output).
- `lib/model/data.ts` — `useFixtureStore` + `useActiveOutput(prompt)`, which resolves **live output ?? fixture matching the prompt ?? first fixture**. Stage visuals call `useActiveOutput`, so they work identically in fixture and live mode.

**Per-frame performance pattern (important).** Components animating in `useFrame` must read store state via `useJourneyStore.getState()` *inside the frame callback*, NOT via a hook subscription — subscribing to a continuously-changing value like `beatProgress` re-renders the component (and its whole subtree) every scroll frame. See `CameraRig.tsx` for the canonical pattern, and `TokenFlow.tsx`/`AttentionArcs` for an isolation example: a small child owns the high-frequency subscription so the large parent tree doesn't reconcile each frame. Standard R3F rules apply: mutate refs in `useFrame`, never `setState`; use array literals / `useMemo` for vectors.

**Inference runs off-thread behind a typed protocol.** The UI thread never imports `onnxruntime-web` / `@huggingface/transformers`; it only speaks `lib/model/protocol.ts` (`WorkerRequest`/`WorkerResponse`/`ModelOutput`). `lib/model/worker.ts` hosts the GPT-2 tokenizer + instrumented ONNX session (WebGPU when available, WASM fallback), and one forward pass returns everything the visuals need: per-layer `attention`/`scores` `[N_HEAD, seq, seq]`, `tokEmb`/`posEmb`, residual `hiddens` snapshots, `topk`, and `finalLogits`. `client.ts` lazily spawns the worker, streams download progress, and drops stale results by request id. Constants: `MAX_TOKENS=64`, `N_LAYER=12`, `N_HEAD=12` (`protocol.ts`). All model/tokenizer/runtime assets are self-hosted under `public/` — `env.allowRemoteModels = false`, no hub calls.

**3D scene composition** (`components/canvas/`): `Experience` mounts the Canvas (adaptive DPR via `PerformanceMonitor`, pauses `frameloop` when the tab is hidden) → `CameraRig` (Catmull-Rom flight along `cameraKeyframe`s, spring-smoothed, honors `prefers-reduced-motion`) + `Stations` (maps `STAGES` to per-stage visuals in `stages/`, mounting the heavy visual only when `|activeStage - index| <= 1`) + `TokenFlow` (the user's tokens as one continuous stream morphing across stages 1–4).

**Stage copy is MDX, dual-lens** (`content/stages/`): each stage has `*.simple.mdx` and `*.technical.mdx`, wired in `content/stages/index.ts`; `beats.ts` holds the short beat captions. The lens toggle picks which renders.

## Deployment

Static export (`output: "export"`) to GitHub Pages via `.github/workflows/deploy.yml`. The instrumented model is too large for git, so deployment expects it as a GitHub Release asset. `basePath`/`assetPrefix` (`/learn-llm`) apply only under `DEPLOY_TARGET=gh-pages`; the worker reads `NEXT_PUBLIC_BASE_PATH` to locate `public/` assets at runtime.
