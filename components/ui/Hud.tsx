"use client";

import { AttentionControls } from "./AttentionControls";
import { DeepDive } from "./DeepDive";
import { ProgressRail } from "./ProgressRail";
import { PromptInput } from "./PromptInput";
import { StageCaptions } from "./StageCaptions";
import { StagePanel } from "./StagePanel";
import { Telemetry } from "./Telemetry";
import { TopBar } from "./TopBar";

/**
 * Full DOM overlay above the 3D canvas. Everything here is HUD chrome;
 * the scene itself never renders DOM, and the HUD never imports three.js.
 */
export function Hud() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <TopBar />
      <ProgressRail />
      <StagePanel />
      <StageCaptions />
      <DeepDive />
      <PromptInput />
      <AttentionControls />
      <Telemetry />
    </div>
  );
}
