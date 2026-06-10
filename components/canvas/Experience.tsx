"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useSyncExternalStore } from "react";
import { CameraRig } from "./CameraRig";
import { Stations } from "./Stations";
import { TokenStream } from "./TokenStream";

let webglSupport: boolean | undefined;
function supportsWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(
        canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
      );
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const noopSubscribe = () => () => {};

function WebGLFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md border border-line bg-abyss/70 p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
          Signal lost
        </p>
        <p className="mt-4 text-sm leading-relaxed text-dim">
          This experience needs WebGL, which your browser doesn&apos;t
          support or has disabled. The written journey — every stage, fully
          cited — still works without it (coming in a later milestone).
        </p>
      </div>
    </div>
  );
}

/**
 * Scene root. Mounts the R3F canvas (fixed, behind the HUD) once WebGL
 * support is confirmed client-side.
 */
export function Experience() {
  // null on the server/first paint (static export), resolved on the client
  const webgl = useSyncExternalStore(
    noopSubscribe,
    supportsWebGL,
    () => null,
  );

  if (webgl === null) return null;
  if (!webgl) return <WebGLFallback />;

  return (
    <Canvas
      camera={{ fov: 42, near: 0.1, far: 400, position: [0, 4.5, 17] }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#06040c"]} />
      <fog attach="fog" args={["#06040c", 60, 220]} />
      <Stars radius={180} depth={120} count={3200} factor={3} saturation={0.6} fade speed={0.4} />
      <ambientLight intensity={0.15} />
      <CameraRig />
      <TokenStream />
      <Stations />
    </Canvas>
  );
}
