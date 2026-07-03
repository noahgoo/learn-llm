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

- [x] Add **Lenis**: single inertial scroll source feeding `ScrollTrack`; canvas + DOM
      glide together. Disabled under `prefers-reduced-motion`.
- [x] Add **Leva** (dev-only) for live tuning of camera/fog/build params. _(installed;
      panel activates with the first `useControls`)_
- [x] Add **Theatre.js**, studio stripped from prod builds. Proof-of-wiring: one Theatre
      sequence whose position is driven by `cameraT` from `journeyFromProgress` inside
      the frame loop. _(`@theatre/r3f` skipped — pins R3F 8; manual binding instead)_
- [x] Reduced-motion story: Lenis off, builds resolve to final state, fades only.

## Phase 1 — Spatial rebuild

- [x] New layout: authored `STATION_LAYOUT` replaces the serpentine formula. Three
      acts: intake corridor (tokenization → embeddings → positional descend into the
      machine) → **vertical tower climb** (attention → heads → MLP → residual →
      layernorm ascend the block floors) → summit exit (prediction) and the weights
      hall beyond. `TOWER_AXIS` exported for structural elements.
- [x] Conduit mesh: tube + instanced particles (token vectors flowing), additive glow
      (`components/canvas/Conduit.tsx`).
- [x] BlockTower shell: 12 translucent slabs = 12 GPT-2 layers wrapping the climb
      (`components/canvas/BlockTower.tsx`).
- [ ] Reshape per-stage visuals into organs (tokenizer gate, vocab wall, head fans…) —
      iterative, continues through Phase 2.
- [x] **ProgressRail v2 = mini transformer-architecture diagram**: acts grouped
      (Input / Block ×12 / Output), diamond nodes inside the block, continuous
      progress fill rising along the spine.
- [x] Update layout-dependent tests (z-spacing → 3D-distance invariant).

## Phase 2 — Choreography

- [x] **Build-on-approach, part 1**: BlockTower stacks floor-by-floor during the
      flight into attention, scrubbed by `cameraT` (reverse scroll un-builds it).
      "In transit" box deleted. _Remaining: per-organ builds (embedding tiles fly in,
      heads unfold) — Theatre-authored once choreography is tuned in studio._
- [x] Typographic arrivals: `TravelInterstitial` — oversized ghost stage numeral
      peaks mid-flight; the arriving title rises through the back half and hands off
      to the StagePanel chip at arrival. Scrubbed by the new `travelProgress`
      (journey.ts → store), so it's fully scrub-symmetric. _Remaining: true
      shared-element docking into the chip._
- [ ] **One POV moment**: camera drops into the conduit and rides through a block
      interior first-person (Noomo tunnel transition, pedagogically loaded).
- [x] Mouse parallax drift (±1°) on the camera, spring-smoothed, reduced-motion off.

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
