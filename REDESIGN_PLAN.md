# Scroll Experience Redesign — "Walk the Transformer"

_Direction locked 2026-07-02. Inspirations: apple.com/macbook-pro (typography, pacing),
NRG build-your-data-center (build-on-approach construction), showcase.noomoagency.com
(lerped scroll, preloader-as-intro, tunnel transitions)._

## North star

**The space IS the transformer.** The camera travels the residual stream — a glowing
conduit — through organs placed in true data-flow order. Organs build themselves as the
camera approaches. Scroll is inertial and cinematic. Typography and pacing are
disciplined. A visitor finishes having *walked* the GPT-2 architecture diagram.

Why: the serpentine station layout is decorative — its geometry teaches nothing.
Geometry must mirror the model so position itself carries the lesson.

## Decisions (settled — do not relitigate)

| Question | Decision |
|---|---|
| Spatial redesign scope | Full diegetic rebuild |
| Choreography tooling | Theatre.js (`@theatre/core` + `@theatre/r3f`); studio dev-only |
| Scroll feel | Lenis inertial smoothing at the source |
| Dev tuning | Leva, dev-only |
| GSAP ScrollTrigger | Rejected — `journey.ts` stays the tested spine |
| Assets | Procedural geometry only; no Blender/GLTF pipeline |
| Brand | Keep current tokens (violet void, Instrument Serif / Archivo / Plex Mono) |

**Critical boundary:** `lib/journey.ts` keeps owning scroll → stage/beat/band math
(pure, unit-tested, untouched in spirit). Theatre binds to `cameraT` and owns what the
camera and organs *do* along that spine — it does not replace the timeline.

## Phase 0 — Tooling foundation

- [ ] Add **Lenis**: single inertial scroll source feeding `ScrollTrack`; canvas + DOM
      glide together. Disabled under `prefers-reduced-motion`.
- [ ] Add **Leva** (dev-only) for live tuning of camera/fog/build params.
- [ ] Add **Theatre.js**, studio stripped from prod builds. Proof-of-wiring: one Theatre
      sequence whose position is driven by `cameraT` from `journeyFromProgress` inside
      the frame loop.
- [ ] Reduced-motion story: Lenis off, builds resolve to final state, fades only.

## Phase 1 — Spatial rebuild

- [ ] New layout: path along the residual conduit replaces the serpentine
      `stationPosition`. Order: prompt text → tokenizer gate → embedding hall (vocab
      wall; the prompt's rows ignite) → positional spiral → **12-slab block tower**
      (camera enters one slab: attention chamber with 12 head-fans → FFN chamber) →
      LM head funnel → prediction podium.
- [ ] Conduit mesh: tube + instanced particles (token vectors flowing), selective glow.
- [ ] All organs procedural (instanced meshes, lines, shaders) in the current palette.
- [ ] **ProgressRail v2 = mini transformer-architecture diagram**, current position
      highlighted. Wayfinding that teaches.
- [ ] Update layout-dependent tests.

## Phase 2 — Choreography

- [ ] **Build-on-approach**: Theatre sequences scrubbed by approach progress — tower
      stacks floor-by-floor, embedding tiles fly in, heads unfold. Travel bands become
      construction time; delete the "In transit" box.
- [ ] Typographic arrivals: giant serif stage title docks into the StagePanel chip;
      oversized ghost stage numerals during travel.
- [ ] **One POV moment**: camera drops into the conduit and rides through a block
      interior first-person (Noomo tunnel transition, pedagogically loaded).
- [ ] Mouse parallax drift (±1°) on the camera.

## Phase 3 — Chrome & narrative (the Apple layer)

- [ ] Stable caption lane per stage; beats swap content in place (no per-beat jumps).
- [ ] Act structure: Input → Compute → Output; full-viewport typographic chapter
      dividers at act boundaries.
- [ ] Unified `.pane` recipe for all HUD chrome (one blur/hairline/radius/fill).
- [ ] TopBar breadcrumb: `Part II · Attention · 3/5` (mono 11px).
- [ ] Kinetic stats counting up on scroll: 50,257 vocab · 124M params · 12×12 heads
      (tabular mono figures).
- [ ] Ending recap strip of all stages + "run it with your own words" CTA.

## Phase 4 — Cinematic polish

- [ ] **Preloader-as-lesson**: model download % visibly fills the empty tower skeleton
      with weights. Loading teaches "a model is weights."
- [ ] `@react-three/postprocessing`: selective bloom on the conduit, DoF in the POV
      shot — perf-budgeted; adaptive DPR already handles fallback.
- [ ] Phase color temperature: input = peri → compute = violet → output = signal amber
      (fog/light tint only; tokens unchanged).
- [ ] Scrub-symmetric captions (MotionValue-driven, reverse scroll mirrors forward).
- [ ] Soft snap gravity to beat boundaries at rest (weak; reduced-motion off).
- [ ] Landing: suggested prompt types itself into the scene.

## Standing constraints

- Per-frame law: `useJourneyStore.getState()` inside `useFrame`; MotionValues for
  scroll-bound DOM; transform/opacity only.
- Fixture mode must still drive every visual before the model downloads.
- Mobile keeps the "best on desktop" fallback for now.
- Verify in real Chrome with real wheel scrolling (backgrounded-tab rAF throttling
  freezes motion/R3F and fakes bugs).
