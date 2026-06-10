"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { STAGE_COUNT, stationPosition } from "@/lib/journey";

/** Faint guide line tracing the journey between stations. */
export function PathLine() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: STAGE_COUNT }, (_, i) => {
        const [x, y, z] = stationPosition(i);
        return new THREE.Vector3(x, y - 7.5, z);
      }),
    );
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(240));
  }, []);

  return (
    <primitive
      object={
        new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: "#8d97a7",
            transparent: true,
            opacity: 0.22,
          }),
        )
      }
    />
  );
}
