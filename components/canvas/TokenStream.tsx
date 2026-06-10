"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { STAGE_COUNT, stationPosition } from "@/lib/journey";

const PARTICLES = 36;
const PERI = new THREE.Color("#a5b8ff");
const VIOLET = new THREE.Color("#9d7bff");

/**
 * The user's data made visible: a continuous stream of token particles
 * riding the journey path through every station ring. This is the thread
 * that connects each stage to the next — and becomes the literal
 * residual-stream metaphor at Phase 07.
 */
export function TokenStream() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { curve, lineGeometry } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(
      Array.from({ length: STAGE_COUNT }, (_, i) => {
        const [x, y, z] = stationPosition(i);
        return new THREE.Vector3(x, y, z);
      }),
    );
    return {
      curve: c,
      lineGeometry: new THREE.BufferGeometry().setFromPoints(c.getPoints(280)),
    };
  }, []);

  // static per-instance colors: gradient between periwinkle and violet
  const colors = useMemo(() => {
    const arr = new Float32Array(PARTICLES * 3);
    const c = new THREE.Color();
    for (let i = 0; i < PARTICLES; i++) {
      c.copy(PERI).lerp(VIOLET, (i % 6) / 5);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, []);

  const pos = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    for (let i = 0; i < PARTICLES; i++) {
      const t = (time * 0.012 + i / PARTICLES) % 1;
      curve.getPoint(t, pos);
      // slight orbital wobble so the stream reads as living data, not beads
      const wob = time * 1.4 + i * 2.4;
      dummy.position.set(
        pos.x + Math.sin(wob) * 0.45,
        pos.y + Math.cos(wob * 0.8) * 0.45,
        pos.z,
      );
      curve.getPoint(Math.min(t + 0.004, 1), ahead);
      dummy.lookAt(ahead);
      const s = 0.34 + 0.1 * Math.sin(time * 2 + i);
      dummy.scale.set(s, s, s * 2.2);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* faint guide line under the stream */}
      <primitive
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({
              color: "#9d7bff",
              transparent: true,
              opacity: 0.16,
            }),
          )
        }
      />
      <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLES]}>
        <boxGeometry args={[1, 1, 1]}>
          <instancedBufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </boxGeometry>
        <meshBasicMaterial vertexColors transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
}
