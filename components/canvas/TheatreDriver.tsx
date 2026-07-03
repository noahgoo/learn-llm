"use client";

import { useFrame } from "@react-three/fiber";
import { journeySheet, SEQUENCE_LENGTH } from "@/lib/theatre";
import { useJourneyStore } from "@/lib/store";

/**
 * Scrubs the Theatre.js journey sequence from scroll: sequence position
 * follows cameraT, so anything keyframed in the studio timeline rides the
 * same spine as the camera. Imperative per-frame write — no React
 * subscription (see CameraRig for the pattern).
 */
export function TheatreDriver() {
  useFrame(() => {
    const { cameraT } = useJourneyStore.getState();
    journeySheet.sequence.position = cameraT * SEQUENCE_LENGTH;
  });
  return null;
}
