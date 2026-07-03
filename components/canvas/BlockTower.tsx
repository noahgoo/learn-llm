"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { TOWER_AXIS } from "@/lib/journey";

const SLAB_COUNT = 12; // GPT-2 small: 12 transformer blocks
const FOOTPRINT = 30;
const SLAB_HEIGHT = 5.2;

/**
 * The transformer block tower: 12 translucent slabs — one per layer of
 * GPT-2 small — wrapping the vertical segment of the journey (stages 3–7
 * climb its floors). Reads as architecture from the corridor approach and
 * as "inside the machine" while climbing. Purely structural; stage visuals
 * live inside it.
 */
export function BlockTower() {
  const { slabGeometry, edges, ys } = useMemo(() => {
    const span = TOWER_AXIS.yMax - TOWER_AXIS.yMin;
    const gap = (span - SLAB_COUNT * SLAB_HEIGHT) / (SLAB_COUNT - 1);
    const box = new THREE.BoxGeometry(FOOTPRINT, SLAB_HEIGHT, FOOTPRINT);
    return {
      slabGeometry: box,
      edges: new THREE.EdgesGeometry(box),
      ys: Array.from(
        { length: SLAB_COUNT },
        (_, i) => TOWER_AXIS.yMin + SLAB_HEIGHT / 2 + i * (SLAB_HEIGHT + gap),
      ),
    };
  }, []);

  return (
    <group position={[TOWER_AXIS.x, 0, TOWER_AXIS.z]}>
      {ys.map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh geometry={slabGeometry}>
            <meshBasicMaterial
              color="#9d7bff"
              transparent
              opacity={0.03}
              depthWrite={false}
            />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial
              color="#9d7bff"
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
