"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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

const MAX_PITCH = 0.55;
const DRAG_SENS = 0.005;

/**
 * Flies the camera along a Catmull-Rom path between stage keyframes,
 * looking slightly down-path at the stations. Spring-smoothed; with
 * prefers-reduced-motion the camera snaps instead of gliding.
 *
 * Drag-to-peek: dragging on the scene swings the camera around the
 * current look target (yaw freely, pitch clamped); releasing springs the
 * view back onto the canonical path. Full free orbit lives in Explore.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
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
  const drag = useRef({ active: false, yaw: 0, pitch: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const qYaw = useMemo(() => new THREE.Quaternion(), []);
  const qPitch = useMemo(() => new THREE.Quaternion(), []);
  const UP = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    const el = gl.domElement;
    el.style.setProperty("cursor", "grab");
    const down = (e: PointerEvent) => {
      if (useJourneyStore.getState().exploring) return;
      drag.current.active = true;
      el.style.setProperty("cursor", "grabbing");
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return;
      drag.current.yaw -= e.movementX * DRAG_SENS;
      drag.current.pitch = THREE.MathUtils.clamp(
        drag.current.pitch - e.movementY * DRAG_SENS,
        -MAX_PITCH,
        MAX_PITCH,
      );
    };
    const up = () => {
      drag.current.active = false;
      el.style.setProperty("cursor", "grab");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const { progress, exploring } = useJourneyStore.getState();
    if (exploring) return; // OrbitControls owns the camera

    const delta = Math.min(rawDelta, 0.1);
    if (reducedMotion) {
      smoothed.current = progress;
    } else {
      // critically-damped approach: frame-rate independent
      const k = 4.2;
      smoothed.current +=
        (progress - smoothed.current) * (1 - Math.exp(-k * delta));
    }
    const t = THREE.MathUtils.clamp(smoothed.current, 0, 1);
    cameraPath.getPoint(t, target);
    stationPath.getPoint(Math.min(t + 0.035, 1), look);

    // spring the peek offset back once the pointer releases
    const d = drag.current;
    if (!d.active) {
      const decay = reducedMotion ? 1 : 1 - Math.exp(-5 * delta);
      d.yaw += (0 - d.yaw) * decay;
      d.pitch += (0 - d.pitch) * decay;
    }
    if (Math.abs(d.yaw) > 1e-4 || Math.abs(d.pitch) > 1e-4) {
      offset.copy(target).sub(look);
      qYaw.setFromAxisAngle(UP, d.yaw);
      offset.applyQuaternion(qYaw);
      right.crossVectors(offset, UP).normalize();
      qPitch.setFromAxisAngle(right, d.pitch);
      offset.applyQuaternion(qPitch);
      camera.position.copy(look).add(offset);
    } else {
      camera.position.copy(target);
    }
    camera.lookAt(look);
  });

  return null;
}
