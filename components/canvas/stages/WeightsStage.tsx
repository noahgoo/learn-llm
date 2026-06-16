"use client";

import { Line, Text } from "@react-three/drei";
import { useActiveOutput } from "@/lib/model/data";
import { useJourneyStore } from "@/lib/store";

import { FONT } from "@/lib/public-path";

const randomTokens = ["thrum", "##", "violet", "?", "marmalade"];

function Machine({
  x,
  title,
  hot,
}: {
  x: number;
  title: string;
  hot: boolean;
}) {
  const color = hot ? "#c9b4ff" : "#4f4a63";
  return (
    <group position={[x, 0, 0]}>
      <Line
        points={[
          [-1.1, -1.1, 0],
          [1.1, -1.1, 0],
          [1.1, 1.1, 0],
          [-1.1, 1.1, 0],
          [-1.1, -1.1, 0],
        ]}
        color={color}
        transparent
        opacity={hot ? 0.85 : 0.35}
        lineWidth={1.5}
      />
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[(i - 2) * 0.38, 0.2 * Math.sin(i), 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={hot ? 0.8 : 0.28} depthWrite={false} />
        </mesh>
      ))}
      <Text font={FONT} fontSize={0.2} color={color} anchorX="center" position={[0, 1.45, 0]} material-depthTest={false}>
        {title}
      </Text>
    </group>
  );
}

export function WeightsStage() {
  const prompt = useJourneyStore((s) => s.prompt);
  const output = useActiveOutput(prompt);
  const beat = useJourneyStore((s) => s.beat);
  const trained = output?.topk[0]?.token ?? " next";

  return (
    <group>
      <Machine x={-2.1} title="random weights" hot={beat < 1} />
      <Machine x={2.1} title="trained weights" hot={beat >= 1} />
      {beat >= 1 && (
        <>
          <Text font={FONT} fontSize={0.18} color="#4f4a63" anchorX="center" position={[-2.1, -1.75, 0]} material-depthTest={false}>
            {randomTokens.join(" ")}
          </Text>
          <Text font={FONT} fontSize={0.18} color="#c9b4ff" anchorX="center" position={[2.1, -1.75, 0]} material-depthTest={false}>
            {`next token: ${JSON.stringify(trained)}`}
          </Text>
        </>
      )}
      {beat >= 2 && (
        <Text font={FONT} fontSize={0.18} color="#ffb454" anchorX="center" position={[0, -2.35, 0]} material-depthTest={false}>
          same architecture · different learned parameters
        </Text>
      )}
    </group>
  );
}
