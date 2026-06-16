"use client";

import { Billboard, Text } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import cloudData from "@/fixtures/embedding-cloud.json";
import { CLOUD_VIEW_SCALE, type EmbeddingCloud } from "@/lib/model/embedding";
import { useJourneyStore } from "@/lib/store";

const cloud = cloudData as EmbeddingCloud;
const FONT = "/fonts/IBMPlexMono-Regular.ttf";

/**
 * Phase 02 backdrop: the embedding space as a dim point field you fly into.
 * The user's own tokens (which travel in from tokenization and settle at
 * their real coordinates here) plus the neighbor links live in TokenFlow —
 * this stage just renders the surrounding cloud.
 */
export function EmbeddingsStage() {
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
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

  const showLookup = activeStage === 1 && beat <= 1;

  return (
    <>
      {showLookup && (
        <Billboard position={[0, 2.7, 7.2]}>
          <mesh>
            <planeGeometry args={[5.8, 1.2]} />
            <meshBasicMaterial
              color="#0f0b1b"
              transparent
              opacity={0.72}
              depthWrite={false}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(5.8, 1.2)]} />
            <lineBasicMaterial
              color="#9d7bff"
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </lineSegments>
          <Text
            font={FONT}
            fontSize={0.22}
            color="#a5b8ff"
            anchorX="center"
            renderOrder={3}
            material-depthTest={false}
            material-transparent
          >
            token ID → embedding table → vector
          </Text>
        </Billboard>
      )}
      <group scale={CLOUD_VIEW_SCALE}>
        <instancedMesh ref={mesh} args={[undefined, undefined, cloud.points.length]}>
          <sphereGeometry args={[0.05 / CLOUD_VIEW_SCALE, 6, 6]} />
          <meshBasicMaterial
            color="#3a3650"
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </instancedMesh>
      </group>
    </>
  );
}
