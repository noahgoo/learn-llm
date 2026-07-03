"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { STAGE_COUNT, stationPosition } from "@/lib/journey";

const PARTICLE_COUNT = 140;
/** Lookup resolution for particle positions along the curve. */
const SAMPLES = 512;

/**
 * The residual stream made literal: a faint conduit threading every station
 * in data-flow order, with a slow current of particles riding it. This is
 * the single element that ties the space together — the camera and the
 * user's tokens both travel *along* it.
 */
export function Conduit() {
  const { tube, core, points } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: STAGE_COUNT }, (_, i) => {
        const [x, y, z] = stationPosition(i);
        return new THREE.Vector3(x, y, z);
      }),
    );
    return {
      tube: new THREE.TubeGeometry(curve, 300, 0.3, 6, false),
      core: new THREE.TubeGeometry(curve, 300, 0.05, 4, false),
      points: curve.getSpacedPoints(SAMPLES),
    };
  }, []);

  const particles = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // per-particle phase offsets: golden-ratio sequence — evenly scattered,
  // deterministic (render-pure), never clumps
  const phases = useMemo(
    () =>
      Float32Array.from(
        { length: PARTICLE_COUNT },
        (_, i) => (i * 0.6180339887) % 1,
      ),
    [],
  );

  useFrame(({ clock }) => {
    const mesh = particles.current;
    if (!mesh) return;
    const t = clock.elapsedTime * 0.012; // one full transit ≈ 80s
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = (phases[i] + t) % 1;
      const idx = u * (SAMPLES - 1);
      const lo = Math.floor(idx);
      const a = points[lo];
      const b = points[Math.min(SAMPLES, lo + 1)] ?? a;
      dummy.position.lerpVectors(a, b, idx - lo);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial
          color="#a5b8ff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={core}>
        <meshBasicMaterial
          color="#a5b8ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh
        ref={particles}
        args={[undefined, undefined, PARTICLE_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial
          color="#c9b4ff"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
