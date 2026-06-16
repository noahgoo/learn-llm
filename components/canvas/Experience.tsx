"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Stars } from "@react-three/drei";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useFixtureStore } from "@/lib/model/data";
import { CameraRig } from "./CameraRig";
import { Stations } from "./Stations";
import { TokenFlow } from "./TokenFlow";
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
      <div className="max-w-md border border-line bg-abyss/80 p-8 text-center backdrop-blur-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide3 text-accent">
          3D signal unavailable
        </p>
        <p className="mt-4 text-sm leading-relaxed text-dim">
          The 3D journey is best on a desktop browser with WebGL enabled. If
          this device cannot render the scene, open Explain for the written
          journey through each stage.
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
  // illustrative-mode data for stage visuals before the model downloads
  const loadFixtures = useFixtureStore((s) => s.loadFixtures);
  useEffect(() => loadFixtures(), [loadFixtures]);

  // adaptive resolution: start mid, let PerformanceMonitor scale 1..2 by GPU headroom
  const [dpr, setDpr] = useState(1.5);
  // stop rendering entirely while the tab is backgrounded (saves CPU/GPU/battery)
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  useEffect(() => {
    const onVisibility = () =>
      setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (webgl === null) return null;
  if (!webgl) return <WebGLFallback />;

  return (
    <Canvas
      frameloop={frameloop}
      camera={{ fov: 42, near: 0.1, far: 400, position: [0, 4.5, 17] }}
      dpr={dpr}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor
        onChange={({ factor }) => setDpr(Math.min(2, Math.max(1, 1 + factor)))}
      />
      <color attach="background" args={["#06040c"]} />
      <fog attach="fog" args={["#06040c", 60, 220]} />
      <Stars radius={180} depth={120} count={3200} factor={3} saturation={0.6} fade speed={0.4} />
      <CameraRig />
      <TokenStream />
      <TokenFlow />
      <Stations />
    </Canvas>
  );
}
