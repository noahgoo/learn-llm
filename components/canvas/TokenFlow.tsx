"use client";

import { Billboard, Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import cloudData from "@/fixtures/embedding-cloud.json";
import { STAGE_COUNT, STAGES, stationPosition } from "@/lib/journey";
import {
  CLOUD_VIEW_SCALE,
  projectEmbedding,
  type EmbeddingCloud,
} from "@/lib/model/embedding";
import { useActiveOutput } from "@/lib/model/data";
import { useAttentionStore, useJourneyStore } from "@/lib/store";
import { TokenChip } from "./stages/TokenChip";

const FONT = "/fonts/IBMPlexMono-Regular.ttf";
const cloud = cloudData as EmbeddingCloud;
const D_MODEL = 768;
const TOK = STAGES.findIndex((s) => s.id === "tokenization");
const EMB = STAGES.findIndex((s) => s.id === "embeddings");
const POS = STAGES.findIndex((s) => s.id === "positional");
const ATT = STAGES.findIndex((s) => s.id === "attention");

type Vec3 = [number, number, number];

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => THREE.MathUtils.clamp(t, 0, 1);

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function helixPlace(i: number, n: number): Vec3 {
  const a = i * 0.62 - Math.PI / 2;
  return [Math.cos(a) * 4.6, i * 0.62 - (n * 0.62) / 2, Math.sin(a) * 4.6];
}

function arcPoints(a: Vec3, b: Vec3, lift: number): Vec3[] {
  const mid: Vec3 = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + lift, (a[2] + b[2]) / 2];
  return [a, mid, b];
}

/**
 * The user's tokens as one unbroken stream across phases 01–04. The same
 * objects move from raw text → token IDs → embedding beads → ordered vectors
 * → attention lookback, so scroll feels like one artifact passing through a
 * transparent machine instead of separate demos.
 */
export function TokenFlow() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const activeStage = useJourneyStore((s) => s.activeStage);
  const beat = useJourneyStore((s) => s.beat);
  const beatProgress = useJourneyStore((s) => s.beatProgress);
  const layer = useAttentionStore((s) => s.layer);
  const head = useAttentionStore((s) => s.head);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const chipScale = useRef<(THREE.Group | null)[]>([]);
  const dotScale = useRef<(THREE.Group | null)[]>([]);
  const crack = useRef(0);
  const land = useRef(0);
  const positionAdd = useRef(0);
  const flowCursor = useRef(0);

  const data = useMemo(() => {
    if (!output) return null;
    const n = output.seq;
    if (n < 1) return null;
    const labels = output.tokens.map((t) => t.replaceAll(" ", "·"));
    const s0 = stationPosition(TOK);
    const s1 = stationPosition(EMB);
    const s2 = stationPosition(POS);
    const s3 = stationPosition(ATT);

    // packed bar slots at the tokenization station (local → world)
    const widths = labels.map((l) => Math.max(0.9, l.length * 0.34));
    const gap = 0.12;
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
    let cursor = -totalW / 2;
    const bar: Vec3[] = widths.map((w) => {
      const x = cursor + w / 2;
      cursor += w + gap;
      return [s0[0] + x, s0[1], s0[2]];
    });
    // even spacing wide enough that no chip's panel overlaps its neighbor
    const spacing = Math.max(2.6, Math.max(...widths) + 0.6);
    // cracked left→right row, mid band
    const row: Vec3[] = labels.map((_, i) => [
      s0[0] + (i - (n - 1) / 2) * spacing,
      s0[1] + (i % 2 ? 0.4 : -0.4),
      s0[2],
    ]);
    // arrival clump as the tokens reach the embedding station
    const arrival: Vec3[] = labels.map((_, i) => [
      s1[0] + (i - (n - 1) / 2) * spacing,
      s1[1] + 1.6,
      s1[2] + 9,
    ]);
    // real PCA coordinates inside the cloud (local → world), compressed by
    // the shared view scale so the scatter stays inside the camera frame
    const K = CLOUD_VIEW_SCALE;
    const coords: Vec3[] = labels.map((_, i) => {
      const p = projectEmbedding(
        output.tokEmb.subarray(i * D_MODEL, (i + 1) * D_MODEL),
        cloud,
      );
      return [s1[0] + p[0] * K, s1[1] + p[1] * K, s1[2] + p[2] * K];
    });
    // incoming ordered vectors before position is added
    const posIntro: Vec3[] = labels.map((_, i) => [
      s2[0] + (i - (n - 1) / 2) * spacing,
      s2[1] + (i % 2 ? 0.35 : -0.35),
      s2[2] + 6,
    ]);
    const posSlots: Vec3[] = labels.map((_, i) => {
      const [x, y, z] = helixPlace(i, n);
      return [s2[0] + x, s2[1] + y, s2[2] + z];
    });
    const attentionSpacing = Math.max(0.9, Math.min(2.1, 9 / Math.max(1, n - 1)));
    const attRow: Vec3[] = labels.map((_, i) => [
      s3[0] + (i - (n - 1) / 2) * attentionSpacing,
      s3[1] - 3.1,
      s3[2] + 4.8,
    ]);
    // nearest cloud neighbor per token (world)
    const neighbors = coords.map((p) => {
      let best = 0;
      let bestD = Infinity;
      cloud.points.forEach((pt, j) => {
        const d =
          (s1[0] + pt.p[0] * K - p[0]) ** 2 +
          (s1[1] + pt.p[1] * K - p[1]) ** 2 +
          (s1[2] + pt.p[2] * K - p[2]) ** 2;
        if (d > 1e-6 && d < bestD) {
          bestD = d;
          best = j;
        }
      });
      const c = cloud.points[best];
      return {
        t: c.t,
        p: [s1[0] + c.p[0] * K, s1[1] + c.p[1] * K, s1[2] + c.p[2] * K] as Vec3,
      };
    });
    const splits = labels
      .map((_, i) => i)
      .filter((i) => i > 0 && !output.tokens[i].startsWith(" "));
    return { n, labels, bar, row, arrival, coords, posIntro, posSlots, attRow, neighbors, splits };
  }, [output]);

  useFrame((_, rawDelta) => {
    if (!data) return;
    const delta = Math.min(rawDelta, 0.1);
    const s = useJourneyStore.getState();
    const eBeats = Math.max(1, STAGES[EMB].beats);

    // crack: bar → row across the tokenization beats
    const crackTarget =
      s.activeStage < TOK
        ? 0
        : s.activeStage > TOK
          ? 1
          : s.beat === 0
            ? 0
            : s.beat === 1
              ? s.beatProgress
              : 1;
    // land: arrival clump → real coordinates across the embedding beats
    const landTarget =
      s.activeStage < EMB
        ? 0
        : s.activeStage > EMB
          ? 1
          : Math.min(1, (s.beat + s.beatProgress) / eBeats);
    // position: vector beads receive their slot vectors across positional beats
    const positionTarget =
      s.activeStage < POS
        ? 0
        : s.activeStage > POS
          ? 1
          : s.beat === 0
            ? 0
            : s.beat === 1
              ? s.beatProgress
              : 1;
    // flow cursor: station-to-station glide, driven by the smooth camera param
    const camDenom = Math.max(1, STAGE_COUNT - 1);
    const flowTarget = THREE.MathUtils.clamp(s.cameraT * camDenom, TOK, ATT);

    crack.current += (crackTarget - crack.current) * (1 - Math.exp(-5 * delta));
    land.current += (landTarget - land.current) * (1 - Math.exp(-4 * delta));
    positionAdd.current +=
      (positionTarget - positionAdd.current) * (1 - Math.exp(-5 * delta));
    flowCursor.current += (flowTarget - flowCursor.current) * (1 - Math.exp(-6 * delta));

    const cursor = flowCursor.current;
    const cr = crack.current;
    const ld = land.current;
    const pos = smoothstep(positionAdd.current);
    for (let i = 0; i < data.n; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const [bx, by, bz] = data.bar[i];
      const [rx, ry, rz] = data.row[i];
      const [ax, ay, az] = data.arrival[i];
      const [cx, cy, cz] = data.coords[i];
      // station-0 anchor: bar → row;  station-1 anchor: arrival → coords
      const s0pos = lerpVec([bx, by, bz], [rx, ry, rz], cr);
      const s1pos = lerpVec([ax, ay, az], [cx, cy, cz], ld);
      const s2pos = lerpVec(data.posIntro[i], data.posSlots[i], pos);
      const s3pos = data.attRow[i];
      let p: Vec3;
      if (cursor <= EMB) {
        p = lerpVec(s0pos, s1pos, smoothstep(clamp01(cursor - TOK)));
      } else if (cursor <= POS) {
        p = lerpVec(s1pos, s2pos, smoothstep(clamp01(cursor - EMB)));
      } else {
        p = lerpVec(s2pos, s3pos, smoothstep(clamp01(cursor - POS)));
      }
      g.position.set(p[0], p[1], p[2]);
      // token cards appear as the raw strip cracks, then become vector beads
      const m = smoothstep(ld);
      const cs = chipScale.current[i];
      const ds = dotScale.current[i];
      if (cs) cs.scale.setScalar(Math.max(0.0001, smoothstep(cr) * (1 - m)));
      if (ds) ds.scale.setScalar(m);
    }
  });

  if (!output || !data) return null;
  // only relevant around the first four stations
  if (activeStage > ATT) return null;

  const seamVisible = activeStage === TOK && beat >= 2;
  const settled = activeStage === EMB && beat >= 2;
  const attentionVisible = activeStage === ATT;
  const queryIndex = Math.max(0, data.n - 1);
  const attentionSource = output.attention[layer];
  const attentionWeight = (keyIndex: number) =>
    attentionSource?.[(head * data.n + queryIndex) * data.n + keyIndex] ?? 0;
  const sweepCount = Math.ceil(queryIndex * beatProgress);

  return (
    <group>
      {data.labels.map((label, i) => (
        <Billboard
          key={`${i}-${output.ids[i]}`}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={data.bar[i]}
        >
          {/* chip form (tokenization → travel) */}
          <group
            ref={(el) => {
              chipScale.current[i] = el;
            }}
          >
            <TokenChip
              label={label}
              sublabel={`${output.ids[i]}`}
              position={[0, 0, 0]}
              color={i % 2 ? "#c9b4ff" : "#a5b8ff"}
            />
          </group>
          {/* dot form (settled in the cloud) — grows in as the chip shrinks */}
          <group
            scale={0}
            ref={(el) => {
              dotScale.current[i] = el;
            }}
          >
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="#c9b4ff" depthWrite={false} />
            </mesh>
            <group position={[0, 0.5, 0]}>
              <Text
                font={FONT}
                fontSize={0.34}
                color="#ede9f7"
                anchorX="center"
                renderOrder={4}
                material-depthTest={false}
                material-transparent
              >
                {output.tokens[i].trim() || "·"}
              </Text>
              {activeStage >= POS && (
                <Text
                  font={FONT}
                  fontSize={0.18}
                  color="#8d87a8"
                  anchorX="center"
                  position={[0, -0.36, 0]}
                  renderOrder={4}
                  material-depthTest={false}
                  material-transparent
                >
                  {activeStage >= ATT ? (i === queryIndex ? "query" : "key") : `pos ${i}`}
                </Text>
              )}
            </group>
            {attentionVisible && i === queryIndex && (
              <mesh>
                <torusGeometry args={[0.42, 0.025, 8, 48]} />
                <meshBasicMaterial
                  color="#ffb454"
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
          {seamVisible && data.splits.includes(i) && (
            <group position={[0, 0.62, 0.02]}>
              <Text
                font={FONT}
                fontSize={0.16}
                color="#ffb454"
                anchorX="center"
                anchorY="bottom"
              >
                ⌇ split
              </Text>
            </group>
          )}
        </Billboard>
      ))}

      {/* neighbor links once the tokens have settled in the cloud */}
      {settled &&
        data.coords.map((p, i) => (
          <group key={`nb-${i}`}>
            <Line
              points={[p, data.neighbors[i].p]}
              color="#9d7bff"
              transparent
              opacity={0.7}
              lineWidth={1.5}
            />
            <Billboard
              position={[
                data.neighbors[i].p[0],
                data.neighbors[i].p[1] - 0.32,
                data.neighbors[i].p[2],
              ]}
            >
              <Text font={FONT} fontSize={0.24} color="#948da8" anchorX="center">
                {data.neighbors[i].t.trim()}
              </Text>
            </Billboard>
          </group>
        ))}

      {/* one query token visibly looks back before the matrix takes over */}
      {attentionVisible &&
        beat === 0 &&
        data.attRow.slice(0, queryIndex).map((p, i) => {
          const shown = i >= queryIndex - Math.max(1, sweepCount);
          if (!shown) return null;
          return (
            <Line
              key={`sweep-${i}`}
              points={arcPoints(data.attRow[queryIndex], p, 0.7)}
              color="#ffb454"
              transparent
              opacity={0.35}
              lineWidth={1}
            />
          );
        })}
      {attentionVisible &&
        beat >= 1 &&
        data.attRow.slice(0, queryIndex + 1).map((p, i) => {
          const w = attentionWeight(i);
          const fadeForMatrix = beat >= 2 ? 1 - smoothstep(beatProgress) : 1;
          return (
            <Line
              key={`attn-${i}`}
              points={arcPoints(data.attRow[queryIndex], p, 0.8 + w * 1.2)}
              color={i === queryIndex ? "#ffb454" : "#c9b4ff"}
              transparent
              opacity={(0.22 + Math.min(0.78, w * 3)) * fadeForMatrix}
              lineWidth={1 + Math.min(5, w * 18)}
            />
          );
        })}
    </group>
  );
}
