"use client";

import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraKeyframe, STAGES, stationPosition } from "@/lib/journey";
import { useActiveOutput } from "@/lib/model/data";
import { useAttentionStore, useJourneyStore } from "@/lib/store";

const STAGE_INDEX = STAGES.findIndex((s) => s.id === "attention");

const FONT = "/fonts/IBMPlexMono-Regular.ttf";
const CELL = 0.5;
const VOID = new THREE.Color("#16121f");
const ACCENT = new THREE.Color("#9d7bff");
const HOT = new THREE.Color("#e7dcff");

/**
 * Phase 04 — the attention pattern for the user's text, one head at a
 * time. Rows = queries (who is looking), columns = keys (being looked at).
 * Softmax view shows the probability matrix; scores view the masked
 * Q·K/√d input to it.
 */
export function AttentionStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const layer = useAttentionStore((s) => s.layer);
  const head = useAttentionStore((s) => s.head);
  const view = useAttentionStore((s) => s.view);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const panel = useRef<THREE.Group>(null);

  // world-fixed panel facing the journey's arrival camera: head-on when you
  // fly in, genuinely 3-D when you drag/orbit around it
  useEffect(() => {
    if (!panel.current) return;
    const [sx, sy, sz] = stationPosition(STAGE_INDEX);
    const [cx, cy, cz] = cameraKeyframe(STAGE_INDEX);
    panel.current.lookAt(cx - sx + panel.current.position.x, cy - sy, cz - sz);
  }, []);

  const n = output?.seq ?? 0;
  const half = ((n - 1) * CELL) / 2;

  // cell weights for the selected layer/head
  const weights = useMemo(() => {
    if (!output) return null;
    const src = (view === "softmax" ? output.attention : output.scores)[layer];
    const out = new Float32Array(n * n);
    let min = Infinity;
    let max = -Infinity;
    if (view === "scores") {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
          const v = src[(head * n + i) * n + j];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (j > i) {
          out[i * n + j] = -1; // masked
        } else if (view === "softmax") {
          out[i * n + j] = src[(head * n + i) * n + j];
        } else {
          const v = src[(head * n + i) * n + j];
          out[i * n + j] = max > min ? (v - min) / (max - min) : 0;
        }
      }
    }
    return out;
  }, [output, layer, head, view, n]);

  useEffect(() => {
    const m = mesh.current;
    if (!m || !weights) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const idx = i * n + j;
        const w = weights[idx];
        // cells extrude toward the viewer by weight — a relief map you can
        // read from any angle
        const depth = w < 0 ? 0.02 : 0.08 + 1.6 * Math.min(1, w);
        dummy.position.set(j * CELL - half, half - i * CELL, depth / 2);
        const s = w < 0 ? 0.12 : 0.3 + 0.68 * Math.min(1, w);
        dummy.scale.set(s, s, depth);
        dummy.updateMatrix();
        m.setMatrixAt(idx, dummy.matrix);
        if (w < 0) color.copy(VOID);
        else if (w < 0.5) color.lerpColors(VOID, ACCENT, w * 2);
        else color.lerpColors(ACCENT, HOT, (w - 0.5) * 2);
        m.setColorAt(idx, color);
      }
    }
    m.count = n * n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [weights, n, half]);

  if (!output || !weights) return null;

  return (
    <group ref={panel} position={[1.2, 0, 0]}>
      <group>
        <instancedMesh
          ref={mesh}
          key={n}
          args={[undefined, undefined, Math.max(1, n * n)]}
        >
          <boxGeometry args={[CELL * 0.86, CELL * 0.86, 1]} />
          {/* per-instance colors come from setColorAt; vertexColors would
              read a missing geometry attribute and render black */}
          <meshBasicMaterial />
        </instancedMesh>
        {output.tokens.map((tok, i) => (
          <group key={`${i}-${output.ids[i]}`}>
            {/* query rows (left) */}
            <Text
              font={FONT}
              fontSize={Math.min(0.3, 2.6 / n + 0.16)}
              color="#a5b8ff"
              anchorX="right"
              position={[-half - CELL, half - i * CELL, 0]}
            >
              {tok.replaceAll(" ", "·")}
            </Text>
            {/* key columns (top, rotated) */}
            <Text
              font={FONT}
              fontSize={Math.min(0.3, 2.6 / n + 0.16)}
              color="#c9b4ff"
              anchorX="left"
              rotation={[0, 0, Math.PI / 3]}
              position={[i * CELL - half, half + CELL, 0]}
            >
              {tok.replaceAll(" ", "·")}
            </Text>
          </group>
        ))}
        <Text
          font={FONT}
          fontSize={0.24}
          color="#8d97a7"
          anchorX="center"
          position={[0, -half - CELL * 1.8, 0]}
        >
          {`layer ${layer + 1} · head ${head + 1} · ${
            view === "softmax" ? "softmax(QKᵀ/√d + mask)" : "QKᵀ/√d (masked)"
          }`}
        </Text>
      </group>
    </group>
  );
}
