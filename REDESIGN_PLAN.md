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
      **requires a live studio session** (`/?theatre` + Leva): interior geometry and
      its build choreography need eyes on the scene, not blind constants. Same for
      DoF in the POV shot. The only remaining open items.
- [x] **ProgressRail v2 = mini transformer-architecture diagram**: acts grouped
      (Input / Block ×12 / Output), diamond nodes inside the block, continuous
      progress fill rising along the spine.
- [x] Update layout-dependent tests (z-spacing → 3D-distance invariant).

## Phase 2 — Choreography

- [x] **Build-on-approach, part 1**: BlockTower stacks floor-by-floor during the
      flight into attention, scrubbed by `cameraT` (reverse scroll un-builds it).
      "In transit" box deleted.
- [x] **Build-on-approach, part 2**: `ApproachReveal` in Stations — every station's
      contents rise and scale into place across the final approach, complete just
      before arrival. _Fine-grained interior builds (individual embedding tiles,
      head fans) remain Theatre-studio work._
- [x] Typographic arrivals: `TravelInterstitial` — oversized ghost stage numeral
      peaks mid-flight; the arriving title rises through the back half, then **docks**:
      over the last fifth of the flight it shrinks and glides into the top-left
      StagePanel corner, dissolving as the panel chip fades in. Scrubbed by
      `travelProgress`, reversible. Chapter dividers stay centered.
- [x] **One POV moment**: on the ffn → residual travel the camera dives onto the
      conduit and rides it first-person up the tower core, gaze pushed down the
      tunnel — arriving at the Residual Stream stage having just BEEN the stream.
      Sine-blended in/out, scrub-symmetric, skipped under reduced motion.
- [x] Mouse parallax drift (±1°) on the camera, spring-smoothed, reduced-motion off.

## Phase 3 — Chrome & narrative (the Apple layer)

- [x] Stable caption lane: non-center anchors collapse into one side lane
      (`left-16 top-[46%]`); beats swap content in place. `center` beats stay
      full-screen moments.
- [x] Act structure: `ACTS` metadata in journey.ts (Input / Compute ×12 / Output) —
      single source for the rail grouping, breadcrumb, and chapter dividers.
      TravelInterstitial becomes a full chapter divider (ghost act numeral,
      "Part II · Compute") when a travel band crosses an act boundary.
- [x] Unified `pane` utility (hairline + abyss fill + blur) swept across all HUD
      chrome, replacing the drifting bg-abyss/70..95 mix.
- [x] TopBar breadcrumb: `Part II · Attention · 2/3`, low-frequency subscription.
- [x] Kinetic stats (`KineticStat`): 50,257 vocab · 768 dims · 144 heads ·
      124,439,808 params — counting up with dwell progress, tabular mono,
      scrub-reversible.
- [x] Ending recap strip in EndCard: all 10 stops replayable + "run it with your
      own words" line.

## Phase 4 — Cinematic polish

- [x] **Preloader-as-lesson**: while GPT-2 downloads, weights visibly pour into the
      tower slab-by-slab, bottom-up (inner additive glow per slab, gated by build
      state). Fixture mode leaves the skeleton empty — architecture without
      parameters, which is the lesson.
- [x] Bloom (`@react-three/postprocessing`): mipmap bloom catches the conduit
      particles, core, and glow markers; first thing disabled when
      PerformanceMonitor reports low headroom. _DoF in the POV shot deferred —
      wants live tuning._
- [x] Phase color temperature (`PhaseColor`): background + fog drift peri → violet →
      ember across acts, blended over the boundary travels. Near-black tints; brand
      tokens untouched.
- [x] Scrub-symmetric captions: beat captions ride a scroll-scrubbed envelope
      (full through 85% of the beat — snap gravity parks readers at beat starts —
      scrubbing out over the last 15%; hidden during travel where the interstitial
      owns the band). Reverse scroll mirrors forward exactly.
- [x] Soft snap gravity: at rest within 0.3 units of a beat boundary, drift to it
      (700ms idle arm, ±0.02 dead zone, user input interrupts, off with
      reduced motion).
- [x] Landing: the suggested prompt types itself out under the hero, cursor and all.

## Phase 5 — UX pass (from the 2026-07-04 design review)

_Mobile story mode was deliberately excluded — it's a separate project, planned on
its own when ready._

### Wayfinding & sharing

- [x] **Deep linking + resume**: stage hash in the URL (`#attention`) — fly there on
      load, update the hash as stages change. Unlocks stage-level sharing and free
      resume-after-reload.
- [ ] _(future)_ **Lens toggle to the TopBar**: `simple|technical` is the best
      pedagogical feature and it's buried in the Explain drawer. Surfacing it is
      blocked on the lens-scope decision (site-wide mode vs drawer setting — see
      decision note) and the technical beat-caption copywriting that choice implies.
      Parked alongside mobile story mode.
- [x] **Commitment signal on the landing**: "10 stops · about 5 minutes" under the
      scroll cue. Known cost = higher completion.

### Pacing & engagement

- [x] **Vary the beat rhythm**: per-stage `beats` already exists — spend budget
      where the teaching is (attention/multi-head 4–5 beats; layernorm/residual 2).
      Uniform 3+1 reads templated.
- [x] **Prompt re-engagement nudge**: one mid-journey hint at attention ("these
      arcs are for *your* sentence — try another") now that the payload panel
      auto-collapses. Make the prediction stage's "sample again" a big obvious
      button — it's the payoff toy.
- [x] **One comprehension moment**: "guess the next word, then reveal" before the
      prediction beat. Converts passive scrolling into active learning; the highest
      pedagogy-per-effort item on the list.

### Accessibility & craft

- [x] **Screen-reader structure**: proper landmarks + heading tree (duplicate h1s
      exist today); offer the written journey up-front next to "Scroll to begin";
      silence the caption `aria-live` region while scrubbing/traveling.
- [x] **Cite tooltips + drawer focus**: citations are hover-only (keyboard/touch
      can't reach them); DeepDive should trap focus, close on Escape, and return
      focus to its toggle.
- [x] **Contrast audit on `--color-faint`**: it carries 11px mono labels across the
      HUD; verify ≥4.5:1 against void/abyss and bump a step if it fails.
- [x] **Attention arc legend**: one line stating what arc weight/color encodes —
      teaches how to read the picture, and satisfies "never rely on color alone."
- [x] **Press feedback**: subtle tap/hover scale on rail dots, chips, and buttons —
      the HUD color-shifts but feels inert.
- [x] **OG/social card**: no share metadata today; render the tower + wordmark once
      and wire `og:image`/Twitter card in `layout.tsx`. For a visual site the share
      card is the ad.
- [x] **Scoped reduced-motion**: the global 0.01ms nuke also kills state-conveying
      fades (stat traveling-fade, chip transitions); scope it to decorative motion
      and keep ≤200ms opacity state changes.

**Decision note — lens scope**: today the lens only switches the Explain drawer's
MDX; beat captions are single-lens, so "technical" users still get the simple
narration on screen. Either (a) make the lens site-wide — captions/beats get dual
copy too (content work in `beats.ts`), or (b) keep it a drawer setting and label it
inside the drawer as "explanation depth". Choose before building the toggle UI.

## Standing constraints

- Per-frame law: `useJourneyStore.getState()` inside `useFrame`; MotionValues for
  scroll-bound DOM; transform/opacity only.
- Fixture mode must still drive every visual before the model downloads.
- Mobile keeps the "best on desktop" fallback for now.
- Verify in real Chrome with real wheel scrolling (backgrounded-tab rAF throttling
  freezes motion/R3F and fakes bugs).
