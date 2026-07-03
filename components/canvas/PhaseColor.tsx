"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { ACTS, STAGE_COUNT } from "@/lib/journey";
import { useJourneyStore } from "@/lib/store";

/**
 * Per-act color temperature: the void's background + fog drift subtly as
 * the journey crosses acts — peri-cool through the input corridor, deep
 * violet inside the compute tower, a warm ember hint at the output summit.
 * Position becomes felt, not just read. Tints are near-black so the brand
 * palette is untouched; blends happen across the act-boundary travels.
 */
const ACT_TINTS = ["#060714", "#080412", "#0c070b"];

export function PhaseColor() {
  const scene = useThree((s) => s.scene);

  const { tints, current } = useMemo(
    () => ({
      tints: ACT_TINTS.map((c) => new THREE.Color(c)),
      current: new THREE.Color(ACT_TINTS[0]),
    }),
    [],
  );

  useFrame(() => {
    const { cameraT } = useJourneyStore.getState();
    const s = cameraT * (STAGE_COUNT - 1); // stage-space position
    // act coordinate: holds inside an act, blends across boundary travels
    const b1 = ACTS[1].range[0]; // compute begins
    const b2 = ACTS[2].range[0]; // output begins
    const a =
      s < b1 - 0.5
        ? 0
        : s < b1 + 0.5
          ? s - (b1 - 0.5)
          : s < b2 - 0.5
            ? 1
            : s < b2 + 0.5
              ? 1 + (s - (b2 - 0.5))
              : 2;
    const lo = Math.min(tints.length - 1, Math.floor(a));
    const hi = Math.min(tints.length - 1, lo + 1);
    current.lerpColors(tints[lo], tints[hi], a - lo);
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(current);
    }
    if (scene.fog) scene.fog.color.copy(current);
  });

  return null;
}
