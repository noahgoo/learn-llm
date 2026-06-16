"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useJourneyStore } from "@/lib/store";
import { useActiveOutput } from "@/lib/model/data";

import { FONT } from "@/lib/public-path";

/**
 * Phase 01 backdrop. The token chips themselves live in TokenFlow (they
 * travel continuously into the embedding stage), so this stage only renders
 * the "solid bar" the packed tokens sit on — fading as they crack — plus the
 * self-teaching fallback when the user's text happens not to split.
 */
export function TokenizationStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const reveal = useRef(0);
  const scan = useRef(0);
  const barMat = useRef<THREE.MeshBasicMaterial>(null);
  const stripMat = useRef<THREE.MeshBasicMaterial>(null);
  const scanner = useRef<THREE.Mesh>(null);

  const info = useMemo(() => {
    if (!output) return null;
    const labels = output.tokens.map((t) => t.replaceAll(" ", "·"));
    const widths = labels.map((l) => Math.max(0.9, l.length * 0.34));
    const total = widths.reduce((a, b) => a + b, 0) + 0.12 * (labels.length - 1);
    const ids = output.ids.join(" · ");
    const splits = labels
      .map((_, i) => i)
      .filter((i) => i > 0 && !output.tokens[i].startsWith(" "));
    const stripWidth = Math.min(7.2, Math.max(5.4, total * 0.72));
    return { total, stripWidth, ids, splits };
  }, [output]);

  useFrame((_, rawDelta) => {
    if (!info) return;
    const delta = Math.min(rawDelta, 0.1);
    const s = useJourneyStore.getState();
    const target =
      s.activeStage === 0
        ? s.beat === 0
          ? 0
          : s.beat === 1
            ? s.beatProgress
            : 1
        : 1;
    reveal.current += (target - reveal.current) * (1 - Math.exp(-5 * delta));
    const scanTarget = s.activeStage === 0 && s.beat === 0 ? s.beatProgress : 1;
    scan.current += (scanTarget - scan.current) * (1 - Math.exp(-7 * delta));
    if (barMat.current) {
      barMat.current.opacity = 0.55 * (1 - Math.min(1, reveal.current * 1.6));
    }
    if (stripMat.current) {
      stripMat.current.opacity = 0.5 * (1 - Math.min(1, reveal.current));
    }
    if (scanner.current) {
      scanner.current.position.x =
        -info.stripWidth / 2 + info.stripWidth * scan.current;
    }
  });

  if (!output || !info) return null;
  const showFallback = activeStage === 0 && beat >= 2 && info.splits.length === 0;
  const showRawStrip = activeStage === 0 && beat <= 1;

  return (
    <group>
      {showRawStrip && (
        <>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[info.stripWidth, 1.75]} />
            <meshBasicMaterial
              ref={stripMat}
              color="#0f0b1b"
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={scanner} position={[-info.stripWidth / 2, 0, 0.08]}>
            <planeGeometry args={[0.08, 1.95]} />
            <meshBasicMaterial
              color="#ffb454"
              transparent
              opacity={0.75}
              depthWrite={false}
            />
          </mesh>
          <Billboard position={[0, 0.16, 0.12]}>
            <Text
              font={FONT}
              fontSize={0.34}
              color="#ede9f7"
              anchorX="center"
              anchorY="middle"
              maxWidth={info.stripWidth - 0.6}
              textAlign="center"
              renderOrder={3}
              material-depthTest={false}
              material-transparent
            >
              {output.text}
            </Text>
            <Text
              font={FONT}
              fontSize={0.16}
              color="#8d87a8"
              anchorX="center"
              position={[0, -0.68, 0]}
              maxWidth={info.stripWidth - 0.6}
              textAlign="center"
              renderOrder={3}
              material-depthTest={false}
              material-transparent
            >
              {info.ids}
            </Text>
          </Billboard>
        </>
      )}
      <mesh position={[0, 0, -0.12]}>
        <planeGeometry args={[info.total + 0.5, 1.05]} />
        <meshBasicMaterial
          ref={barMat}
          color="#171127"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
      {showFallback && (
        <Billboard position={[0, 2.7, 2]}>
          <Text
            font={FONT}
            fontSize={0.3}
            color="#ffb454"
            anchorX="center"
            anchorY="middle"
            renderOrder={3}
            material-depthTest={false}
            material-transparent
          >
            {"rare words split:  transformer → transform·er"}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
