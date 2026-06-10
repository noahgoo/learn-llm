"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { STAGES, stationPosition } from "@/lib/journey";

const ION = new THREE.Color("#6ee7ff");
const FAINT = new THREE.Color("#4c5666");

function Station({ index, built }: { index: number; built: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (core.current) {
      core.current.rotation.y += delta * 0.18;
      core.current.rotation.x += delta * 0.07;
    }
    if (ring.current) ring.current.rotation.z += delta * 0.05;
  });

  const color = built ? ION : FAINT;
  return (
    <group position={stationPosition(index)}>
      {/* portal ring */}
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[6.4, 0.045, 8, 96]} />
        <meshBasicMaterial color={color} transparent opacity={built ? 0.6 : 0.3} />
      </mesh>
      {/* placeholder core — replaced by real stage visuals in M2/M3 */}
      <mesh ref={core}>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={built ? 0.85 : 0.35} />
      </mesh>
      <pointLight color={color} intensity={built ? 14 : 4} distance={26} decay={2} />
    </group>
  );
}

export function Stations() {
  return (
    <>
      {STAGES.map((stage, i) => (
        <Station key={stage.id} index={i} built={stage.built} />
      ))}
    </>
  );
}
