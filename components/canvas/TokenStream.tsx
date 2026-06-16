"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { STAGE_COUNT, stationPosition } from "@/lib/journey";

/**
 * The journey's spine: a single faint guide line threading every station.
 * The user's actual tokens are the thing that travels along it (see
 * TokenFlow) — so there are no ambient filler particles here, just the rail
 * that gives the path continuity.
 */
export function TokenStream() {
  const lineGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: STAGE_COUNT }, (_, i) => {
        const [x, y, z] = stationPosition(i);
        return new THREE.Vector3(x, y, z);
      }),
    );
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(280));
  }, []);

  return (
    <primitive
      object={
        new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: "#9d7bff",
            transparent: true,
            opacity: 0.12,
          }),
        )
      }
    />
  );
}
