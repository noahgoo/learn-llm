"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraKeyframe, STAGE_COUNT, STAGES, stationPosition } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

const EMBEDDINGS_INDEX = STAGES.findIndex((s) => s.id === "embeddings");
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
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
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
    stationPath.getPoint(Math.min(t + 0.035, 1), look);
    // fly toward the station center as the dolly deepens (embeddings push-in)
    if (dolly.current > 1e-3) {
      target.lerp(look, dolly.current);
    }
    camera.position.copy(target);
    camera.lookAt(look);
  });

  return null;
}
