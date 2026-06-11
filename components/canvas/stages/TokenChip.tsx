"use client";

import { Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const FONT = "/fonts/IBMPlexMono-Regular.ttf";

/** A single token rendered as a floating labeled chip with a hairline border. */
export function TokenChip({
  label,
  sublabel,
  position,
  color = "#a5b8ff",
  scale = 1,
}: {
  label: string;
  sublabel?: string;
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  const width = Math.max(0.9, label.length * 0.34) * scale;
  const height = 0.72 * scale;
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height)),
    [width, height],
  );
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#0c0916" transparent opacity={0.85} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </lineSegments>
      <Text
        font={FONT}
        fontSize={0.34 * scale}
        color={color}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.01]}
      >
        {label}
      </Text>
      {sublabel && (
        <Text
          font={FONT}
          fontSize={0.18 * scale}
          color="#8d87a8"
          anchorX="center"
          anchorY="top"
          position={[0, -0.5 * scale, 0.01]}
        >
          {sublabel}
        </Text>
      )}
    </group>
  );
}
