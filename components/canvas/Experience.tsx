"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Stars } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useMobileExperience } from "@/lib/mobile";
import { useFixtureStore } from "@/lib/model/data";
import { BlockTower } from "./BlockTower";
import { CameraRig } from "./CameraRig";
import { Conduit } from "./Conduit";
import { PhaseColor } from "./PhaseColor";
import { Stations } from "./Stations";
import { TheatreDriver } from "./TheatreDriver";
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

  // portrait FOV: the narrow frame needs a wider lens (MOBILE_PLAN.md §3);
  // R3F diffs the camera prop, so rotation/resize re-frames live. The
  // companion keyframe squeeze lives in CameraRig.
  const mobile = useMobileExperience();

  // adaptive resolution: start mid, let PerformanceMonitor scale 1..2 by GPU headroom
  const [dpr, setDpr] = useState(1.5);
  // bloom is the first thing to go when the GPU struggles
  const [bloom, setBloom] = useState(true);
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
      camera={{ fov: mobile ? 54 : 42, near: 0.1, far: 400, position: [0, 4.5, 17] }}
      dpr={dpr}
      // antialias is a context-creation flag (no live toggle): skip it on
      // mobile — bloom hides the aliasing and the fill-rate savings matter
      gl={{ antialias: !mobile, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor
        onChange={({ factor }) => {
          // phones cap at 1.5: DPR-3 screens × full-screen postprocessing is
          // the main mobile GPU cliff (MOBILE_PLAN.md §7)
          setDpr(Math.min(mobile ? 1.5 : 2, Math.max(1, 1 + factor)));
          setBloom(factor > 0.25);
        }}
      />
      <color attach="background" args={["#06040c"]} />
      <fog attach="fog" args={["#06040c", 60, 220]} />
      <PhaseColor />
      <Stars radius={180} depth={120} count={mobile ? 1600 : 3200} factor={3} saturation={0.6} fade speed={0.4} />
      <CameraRig />
      <TheatreDriver />
      <Conduit />
      <BlockTower />
      <TokenStream />
      <TokenFlow />
      <Stations />
      {bloom && (
        <EffectComposer>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.35}
            intensity={0.65}
            radius={0.7}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
