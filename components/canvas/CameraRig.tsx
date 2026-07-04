"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraKeyframe, STAGE_COUNT, STAGES, stationPosition } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

const EMBEDDINGS_INDEX = STAGES.findIndex((s) => s.id === "embeddings");
/** Travel band that becomes the first-person conduit ride (ffn → residual). */
const POV_FROM = STAGES.findIndex((s) => s.id === "ffn");
/**
 * How far (0..1 of the way to the station) the embeddings dwell flies in.
 * Disabled for the authored first-four-phase pass: the embedding cloud needs
 * a wider view so the user can see the whole batch settle at once.
 */
const EMBEDDINGS_DOLLY = 0;

function usePrefersReducedMotion() {
  return useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
}

/**
 * Flies the camera along a Catmull-Rom path between stage keyframes,
 * looking slightly down-path at the stations. Spring-smoothed; with
 * prefers-reduced-motion the camera snaps instead of gliding.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const reducedMotion = usePrefersReducedMotion();

  const { cameraPath, stationPath } = useMemo(() => {
    const indices = Array.from({ length: STAGE_COUNT }, (_, i) => i);
    return {
      cameraPath: new THREE.CatmullRomCurve3(
        indices.map((i) => new THREE.Vector3(...cameraKeyframe(i))),
      ),
      stationPath: new THREE.CatmullRomCurve3(
        indices.map((i) => new THREE.Vector3(...stationPosition(i))),
      ),
    };
  }, []);

  const smoothed = useRef(0);
  const dolly = useRef(0);
  const parallax = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lookAhead = useMemo(() => new THREE.Vector3(), []);
  const povPoint = useMemo(() => new THREE.Vector3(), []);
  const povAhead = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ pointer }, rawDelta) => {
    const { cameraT, activeStage, beat, beatProgress, traveling } =
      useJourneyStore.getState();

    const delta = Math.min(rawDelta, 0.1);
    // target dolly: ease the camera into the embedding cloud across its dwell
    const stageBeats = STAGES[activeStage]?.beats ?? 1;
    const dollyTarget =
      !traveling && activeStage === EMBEDDINGS_INDEX
        ? THREE.MathUtils.clamp(
            (beat + beatProgress) / Math.max(1, stageBeats),
            0,
            1,
          ) * EMBEDDINGS_DOLLY
        : 0;
    if (reducedMotion) {
      smoothed.current = cameraT;
      dolly.current = dollyTarget;
    } else {
      // critically-damped approach: frame-rate independent
      const k = 4.2;
      smoothed.current +=
        (cameraT - smoothed.current) * (1 - Math.exp(-k * delta));
      dolly.current += (dollyTarget - dolly.current) * (1 - Math.exp(-3 * delta));
    }
    const t = THREE.MathUtils.clamp(smoothed.current, 0, 1);
    cameraPath.getPoint(t, target);
    // Gaze: at rest, look AT the station (with a slight down-path bias for
    // continuity); in flight, look down the path. The old always-ahead gaze
    // broke the tower act — the path turns vertical there, so "ahead" was a
    // floor above and every station's visual sat below the frame. Blend is
    // scrubbed by distance to the nearest station, so it's reversible and
    // pop-free (at the mid-travel stage flip the station term has 0 weight).
    const sFloat = t * (STAGE_COUNT - 1);
    const nearest = Math.round(sFloat);
    const travelDepth = Math.min(1, Math.abs(sFloat - nearest) * 2);
    stationPath.getPoint(Math.min(t + 0.035, 1), lookAhead);
    stationPath.getPoint(nearest / (STAGE_COUNT - 1), look);
    look.lerp(lookAhead, 0.3 + 0.7 * (travelDepth * travelDepth * (3 - 2 * travelDepth)));
    // fly toward the station center as the dolly deepens (embeddings push-in)
    if (dolly.current > 1e-3) {
      target.lerp(look, dolly.current);
    }
    // The POV moment: on the ffn → residual travel the camera dives onto
    // the conduit itself and rides it first-person up the tower core —
    // "this is what happens to your word". Blend is a sine of travel
    // fraction, so it enters/exits seamlessly and scrubs symmetrically.
    // (Skipped under reduced motion: the standard framing stays.)
    if (!reducedMotion) {
      const u = t * (STAGE_COUNT - 1) - POV_FROM;
      if (u > 0 && u < 1) {
        const dive = Math.sin(Math.PI * u);
        stationPath.getPoint(Math.min(t + 0.008, 1), povPoint);
        povPoint.setY(povPoint.y + 0.8); // ride just above the stream
        target.lerp(povPoint, dive);
        // gaze further down the tunnel while inside it
        stationPath.getPoint(Math.min(t + 0.08, 1), povAhead);
        look.lerp(povAhead, dive);
      }
    }
    camera.position.copy(target);
    camera.lookAt(look);
    // Noomo-style aliveness: ±1° camera drift toward the pointer, spring-
    // smoothed so it trails the mouse rather than tracking it rigidly.
    if (!reducedMotion) {
      const p = parallax.current;
      const ease = 1 - Math.exp(-3 * delta);
      p.x += (pointer.x - p.x) * ease;
      p.y += (pointer.y - p.y) * ease;
      camera.rotation.set(
        camera.rotation.x + p.y * 0.014,
        camera.rotation.y - p.x * 0.02,
        camera.rotation.z,
      );
    }
  });

  return null;
}
