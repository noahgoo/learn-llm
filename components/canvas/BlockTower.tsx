"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { STAGE_COUNT, TOWER_AXIS } from "@/lib/journey";
import { useModelStore } from "@/lib/model/client";
import { useJourneyStore } from "@/lib/store";

const SLAB_COUNT = 12; // GPT-2 small: 12 transformer blocks
const FOOTPRINT = 30;
const SLAB_HEIGHT = 5.2;

// Build choreography (in cameraT space, denom = STAGE_COUNT - 1): the tower
// stacks floor-by-floor during the flight from positional (2) into
// attention (3), finishing just as the camera arrives at the base.
const DENOM = STAGE_COUNT - 1;
const BUILD_START = 2.1 / DENOM;
const SLAB_STAGGER = 0.055 / DENOM;
const SLAB_WINDOW = 0.3 / DENOM;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The transformer block tower: 12 translucent slabs — one per layer of
 * GPT-2 small — wrapping the vertical segment of the journey (stages 3–7
 * climb its floors). It assembles on approach, scrubbed by scroll position
 * (NRG-style build): reverse scrolling un-builds it symmetrically. Purely
 * structural; stage visuals live inside it.
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

  const groups = useRef<(THREE.Group | null)[]>([]);
  const fills = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const lines = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const weights = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame(() => {
    const { cameraT } = useJourneyStore.getState();
    // Preloader-as-lesson: while the real GPT-2 downloads, its weights
    // visibly pour into the skeleton, slab by slab, bottom-up. In fixture
    // mode (no download) the tower stays an empty frame — architecture
    // without learned parameters, which is exactly the lesson.
    const { status, progress } = useModelStore.getState();
    const weightsFill =
      status === "ready" ? 1 : status === "loading" ? progress : 0;
    // Inside the tower (stages 3-7) the slab faces read as big washed-out
    // planes at grazing angles, so the fills dim while the camera is within
    // the climb and return on the way out. Edges stay — the wireframe is
    // what says "architecture" from within.
    const sF = cameraT * (STAGE_COUNT - 1);
    const inside =
      smooth(Math.min(1, Math.max(0, (sF - 2.8) / 0.5))) *
      (1 - smooth(Math.min(1, Math.max(0, (sF - 7.3) / 0.6))));
    const fillDim = 1 - 0.85 * inside;
    for (let i = 0; i < SLAB_COUNT; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const start = BUILD_START + i * SLAB_STAGGER;
      const s = smooth(
        Math.min(1, Math.max(0, (cameraT - start) / SLAB_WINDOW)),
      );
      g.visible = s > 0.001;
      g.scale.y = Math.max(0.0001, s);
      const fill = fills.current[i];
      const line = lines.current[i];
      if (fill) fill.opacity = 0.03 * s * fillDim;
      if (line) line.opacity = 0.18 * s;
      const w = weights.current[i];
      if (w) {
        // slab i's share of the download: fills when progress passes i/12
        const filled = Math.min(1, Math.max(0, weightsFill * SLAB_COUNT - i));
        w.opacity = 0.09 * filled * s;
      }
    }
  });

  return (
    <group position={[TOWER_AXIS.x, 0, TOWER_AXIS.z]}>
      {ys.map((y, i) => (
        <group
          key={i}
          position={[0, y, 0]}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh geometry={slabGeometry}>
            <meshBasicMaterial
              ref={(el) => {
                fills.current[i] = el;
              }}
              color="#9d7bff"
              transparent
              opacity={0.03}
              depthWrite={false}
            />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial
              ref={(el) => {
                lines.current[i] = el;
              }}
              color="#9d7bff"
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </lineSegments>
          {/* the weights: an inner glow that exists only once downloaded */}
          <mesh scale={[0.86, 0.68, 0.86]} geometry={slabGeometry}>
            <meshBasicMaterial
              ref={(el) => {
                weights.current[i] = el;
              }}
              color="#c9b4ff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
