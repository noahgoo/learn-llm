"use client";

import { Billboard, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import cloudData from "@/fixtures/embedding-cloud.json";
import { projectEmbedding, type EmbeddingCloud } from "@/lib/model/embedding";
import { useActiveOutput } from "@/lib/model/data";
import { useJourneyStore } from "@/lib/store";

const FONT = "/fonts/IBMPlexMono-Regular.ttf";
const cloud = cloudData as EmbeddingCloud;
const D_MODEL = 768;

/** Static point cloud: 1500 common-token embeddings, PCA-projected. */
function Cloud() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    cloud.points.forEach((pt, i) => {
      dummy.position.set(pt.p[0], pt.p[1], pt.p[2]);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, cloud.points.length]}>
      <sphereGeometry args={[0.045, 6, 6]} />
      <meshBasicMaterial color="#4f4a63" transparent opacity={0.8} />
    </instancedMesh>
  );
}

/**
 * Phase 02 — the user's tokens located inside GPT-2's embedding space,
 * with their nearest common-token neighbors labeled.
 */
export function EmbeddingsStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);

  const { positions, neighbors } = useMemo(() => {
    if (!output) return { positions: [], neighbors: [] };
    const positions = Array.from({ length: output.seq }, (_, i) =>
      projectEmbedding(output.tokEmb.subarray(i * D_MODEL, (i + 1) * D_MODEL), cloud),
    );
    // nearest cloud point per token (3-D distance in the projected space)
    const neighbors = positions.map((p) => {
      let best = 0;
      let bestD = Infinity;
      cloud.points.forEach((pt, j) => {
        const d =
          (pt.p[0] - p[0]) ** 2 + (pt.p[1] - p[1]) ** 2 + (pt.p[2] - p[2]) ** 2;
        if (d > 1e-6 && d < bestD) {
          bestD = d;
          best = j;
        }
      });
      return cloud.points[best];
    });
    return { positions, neighbors };
  }, [output]);

  if (!output) return null;

  return (
    <group scale={0.85}>
      <Cloud />
      {positions.map((p, i) => (
        <group key={`${i}-${output.ids[i]}`}>
          <mesh position={p}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshBasicMaterial color="#c9b4ff" />
          </mesh>
          <Billboard position={[p[0], p[1] + 0.42, p[2]]}>
            <Text font={FONT} fontSize={0.3} color="#c9b4ff" anchorX="center">
              {output.tokens[i].trim() || "·"}
            </Text>
          </Billboard>
          {/* nearest neighbor in the cloud */}
          <Billboard
            position={[
              neighbors[i].p[0],
              neighbors[i].p[1] - 0.3,
              neighbors[i].p[2],
            ]}
          >
            <Text font={FONT} fontSize={0.2} color="#8d97a7" anchorX="center">
              {neighbors[i].t.trim()}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
}
