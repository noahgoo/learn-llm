"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraKeyframe, STAGE_COUNT, stationPosition } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

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
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();

  useFrame((_, rawDelta) => {
    const { progress, exploring } = useJourneyStore.getState();
    if (exploring) return; // OrbitControls owns the camera

    if (reducedMotion) {
      smoothed.current = progress;
    } else {
      // critically-damped approach: frame-rate independent
      const delta = Math.min(rawDelta, 0.1);
      const k = 4.2;
      smoothed.current +=
        (progress - smoothed.current) * (1 - Math.exp(-k * delta));
    }
    const t = THREE.MathUtils.clamp(smoothed.current, 0, 1);
    cameraPath.getPoint(t, target);
    camera.position.copy(target);
    stationPath.getPoint(Math.min(t + 0.035, 1), look);
    camera.lookAt(look);
  });

  return null;
}
