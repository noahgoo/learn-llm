# Mobile Journey — Design Document

Status: draft for review · Owner: noahgoo · Last updated: 2026-07-05

## 1. Goal

Ship the full 3D journey on phones. Today mobile gets a fixed "Best on desktop"
banner (`TopBar.tsx`) and a desktop-framed scene behind it — nothing is
actually broken on mobile except layout and framing, which is exactly what
this plan fixes. Desktop behavior does not change.

### Decisions (locked with owner)

| Question | Decision |
| --- | --- |
| Scene | **Full 3D journey** — same R3F scene, mobile-tuned (portrait framing, perf caps). No second visual tier. |
| Navigation | **Hybrid scroll-snap** — native touch scroll drives the same runway; beats snap hard so one flick reads as one beat. No new input system. |
| Inference | **Fixtures only** — no model download on mobile. Suggested prompts fully work (fixtures drive all visuals). No free-text prompt, no worker spawn. |
| Interactive extras | Keep **DeepDive Read drawer** (as bottom sheet) and **lens toggle** (Simple/Technical). Drop AttentionControls, PredictionControls, GuessNext, free-text PromptInput, Telemetry for v1. |

## 2. What "mobile" means here

Two independent signals, used for different things:

- **Layout**: CSS breakpoints only. `md:` (768px) is the existing Tailwind
  seam — below it, mobile HUD layout applies. Pure CSS; no hydration risk.
- **Behavior** (snap strength, perf caps, fixtures-only, portrait camera):
  a single `lib/mobile.ts` helper —
  `isMobileExperience() = (pointer: coarse) && viewport width < 768`,
  exposed as a store flag set once on mount (plus orientation-change
  re-check). Everything behavioral reads this one flag; nothing else calls
  `matchMedia` ad hoc.

Portrait tablets (`coarse`, ≥768px) get desktop layout with touch-snap
behavior — acceptable middle ground, revisit after v1.

## 3. Scene: portrait framing

The core visual problem. `CAMERA_OFFSETS` in `journey.ts` are authored for
landscape: negative x pushes the station right-of-center to clear the left
HUD lane. In portrait there is no left lane and the horizontal FOV is much
narrower — stations end up half off-screen.

**Approach: rig-level portrait adjustment, `journey.ts` stays pure.**

In `CameraRig` (single place, per-frame, already owns smoothing):

- **FOV**: 42 → ~54 in portrait (set once on the camera, not per frame).
  Recovers horizontal field lost to the narrow aspect.
- **Offset squeeze**: scale the authored offset's x toward 0 by ~0.4×
  (station moves to horizontal center) and multiply camera distance
  (z component) by ~1.2× so tall stages fit vertically.
- **Look target**: unchanged — stations already sit at look center; only
  the eye position shifts.

One formula, not ten authored mobile shots. Then a manual QA pass over all
10 stations in portrait; any station the formula can't frame well gets an
entry in a small optional `PORTRAIT_OFFSET_OVERRIDES: Partial<Record<StageId, Vec3>>`
table (expected: 0–3 entries, likely attention tower base and prediction
crane shot).

`journey.test.ts` invariants (x negative, z positive) still hold — the
squeeze preserves signs.

## 4. Navigation: hybrid scroll-snap

Keep the existing runway (`ScrollTrack`, `JOURNEY_UNITS × 100svh`) and
native touch scrolling (Lenis already leaves touch native). Change only the
snap gravity:

- **Desktop (unchanged)**: 0.3-unit catch radius on dwells, full-band snap
  on travels, 700ms settle timer.
- **Mobile**: catch radius widens to **0.5 units everywhere** — after
  momentum settles, the journey always comes to rest exactly on a beat
  boundary or station. A flick that carries 2–3 units is fine; it settles
  on whatever beat it lands nearest. This is the "hybrid" feel with the
  existing `armSnap` machinery — no CSS scroll-snap, no gesture library.
- Snap animation runs through the existing `scrollToProgress` path. On
  mobile Lenis is currently null-equivalent for touch; verify
  `lenis.scrollTo` animates correctly from touch rest, else fall back to a
  small rAF tween in `ScrollTrack` (one function, ~15 lines).
- **Reduced motion**: snap stays off (as today) — instant positions only.

The scrubbed in-beat animation (`beatProgress`) still plays during the
flick, so motion between beats stays alive; the snap just guarantees the
resting state is a complete beat.

## 5. HUD: per-component plan

Portrait layout has three lanes: a thin top strip, the scene (center,
unobstructed), and a bottom sheet zone. Everything respects
`env(safe-area-inset-*)`.

| Component | Mobile treatment |
| --- | --- |
| **TopBar** | Keep. Wordmark + breadcrumb shrink to one row. **Delete the "Best on desktop" banner.** |
| **StagePanel** | Merge into the top strip: phase + title only (no IN/OUT `dl` — that detail lives in the Read sheet). Single line under the breadcrumb, or replaces it while dwelling. |
| **StageCaptions** | All four anchors (`center`, `bottom-left`, `right`, …) collapse to **one bottom caption strip** above the safe area. `REGION` map gets a mobile variant; `center` beats may keep centered treatment (they're deliberate full-screen moments). Font sizes step down; max 3 lines. |
| **ProgressRail** | Slim right-edge dot rail, labels removed, act group labels removed (breadcrumb carries act context). Tap targets stay ≥44px via the existing `-m-2 p-2` padding trick. Tap = fly to stage (existing `scrollToStage`). |
| **DeepDive** | Lens toggle: compact pill, top-right. Read drawer becomes a **bottom sheet**: ~85svh, drag-handle affordance, scrollable MDX inside, backdrop tap + Escape close. Focus management carries over. |
| **PromptInput** | Fixtures-only mode: no textarea, no model load/status UI. Replace with a compact **prompt chip picker** (the existing `SUGGESTIONS` chips) so users can still swap which fixture prompt flows through the journey. Collapsed by default after stage 0, same as desktop auto-close. |
| **TravelInterstitial** | Keep — it's the star of travel bands. Typography scales down (`clamp()` on the ghost numeral + title); `titleX` glide distance already derives from `innerWidth`. |
| **EndCard** | Keep, full-width minus margins at bottom. |
| **KineticStat** | Hide v1 (fights with the caption strip for bottom-left). Revisit as inline caption garnish later. |
| **GuessNext** | Hide v1 (decision). |
| **AttentionControls / PredictionControls** | Hide v1 (decision). Stage visuals render their default layer/head/temperature state, which is what fixtures show anyway. |
| **Telemetry** | Hide v1 (decision). |
| **PromptNudge** | Hide v1 — it nudges toward free-text input, which mobile doesn't have. |

Mechanism: mostly Tailwind `hidden md:flex` / `md:hidden` pairs; the few
behavioral forks (DeepDive sheet vs drawer, PromptInput chip mode) read the
mobile store flag.

## 6. Inference: fixtures only

- `PromptInput` on mobile never calls `useModelStore.load/run` — the
  worker is never spawned, ORT/transformers chunks are never fetched
  (they're already lazy behind the worker import).
- `useActiveOutput` already resolves `live ?? fixture ?? first fixture` —
  zero changes needed in stage visuals.
- Chip picker sets `prompt` in the journey store; fixture matching picks
  the right fixture per prompt, exactly as pre-download desktop works today.
- Copy note in the Read sheet or EndCard: "On desktop, this page runs the
  real model live in your browser" — turns the limitation into a hook.

## 7. Performance budget

Baseline is already decent: adaptive DPR via `PerformanceMonitor`, bloom
sheds first, frameloop pauses when hidden, stations mount only within ±1
stage. Mobile additions:

- **DPR cap 1.5** on mobile (phones have DPR 3 screens; native DPR ×
  full-screen postprocessing is the main GPU cliff). Floor stays 1.
- **Stars count** ~3200 → ~1600 on mobile.
- **Antialias off** when DPR ≥ 1.5 on mobile (bloom + high DPR hides
  aliasing well enough).
- Keep the existing bloom-shedding logic untouched.
- Target: 60fps steady on an iPhone 12 / Pixel 6 class device; no thermal
  throttle over one full journey (~3 min).

## 8. Risks & open questions

- **iOS Safari toolbar collapse** changes viewport height mid-scroll.
  Runway already uses `svh` (stable unit) — verify snap math uses the same
  basis as the runway height (`scrollMax()` uses `innerHeight`, which
  changes as the toolbar hides; may need `document.documentElement.clientHeight`
  or a resize re-clamp).
- **Lenis + touch snap**: confirm programmatic `scrollTo` from rest works
  on iOS Safari; fallback tween specified in §4.
- **Portrait QA is per-station**: the formula in §3 is a hypothesis; budget
  a device pass over all 10 stations × key beats before calling M2 done.
- **WebGL fallback copy** (`Experience.tsx`) references "Explain" — ensure
  that path (Read sheet) is reachable without WebGL on mobile.
- Landscape phones: treat as desktop layout at `md:`? Most are <768px tall
  but >768px wide — Tailwind breakpoints are width-based, so landscape
  phones get desktop layout with touch behavior. Acceptable v1; note in QA.

## 9. Milestones

- **M1 — Unlock & relayout** (pure CSS + hides): delete the desktop-only
  banner; hide dropped panels; top strip (TopBar+StagePanel merge); bottom
  caption strip; slim progress rail; safe-area padding. Journey is usable
  on a phone, framing still imperfect.
- **M2 — Portrait framing**: mobile store flag; CameraRig portrait FOV +
  offset squeeze; device QA pass over all stations; override table if needed.
- **M3 — Touch nav & sheets**: mobile snap radius; DeepDive bottom sheet;
  PromptInput chip-picker mode (fixtures only).
- **M4 — Perf & polish**: DPR cap, star count, antialias rule; travel
  interstitial type scaling; EndCard; full-journey thermal test on device;
  Lighthouse mobile pass.

Each milestone is shippable behind the `md:` seam without touching desktop.

## 10. Acceptance criteria

1. On a 390×844 viewport (touch), the full 10-stage journey completes by
   scroll; every station is framed on-screen at every beat.
2. Resting state after any flick is a beat boundary (mobile snap).
3. No model download occurs on mobile (network tab: no ORT/onnx fetches).
4. Read sheet opens/closes with drag handle, backdrop tap, and Escape;
   lens toggle switches captions + sheet content site-wide.
5. Desktop rendering and behavior byte-identical for ≥768px pointer-fine
   (visual regression: existing screenshots unchanged).
6. `npm run typecheck`, `lint`, `test` green; `journey.test.ts` untouched.
