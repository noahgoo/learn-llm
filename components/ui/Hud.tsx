"use client";

import { AttentionControls } from "./AttentionControls";
import { DeepDive } from "./DeepDive";
import { EndCard } from "./EndCard";
import { GuessNext } from "./GuessNext";
import { KineticStat } from "./KineticStat";
import { ProgressRail } from "./ProgressRail";
import { PromptInput } from "./PromptInput";
import { PromptNudge } from "./PromptNudge";
import { PredictionControls } from "./PredictionControls";
import { StageCaptions } from "./StageCaptions";
import { StagePanel } from "./StagePanel";
import { Telemetry } from "./Telemetry";
import { TopBar } from "./TopBar";
import { TravelInterstitial } from "./TravelInterstitial";

/**
 * Full DOM overlay above the 3D canvas. Everything here is HUD chrome;
 * the scene itself never renders DOM, and the HUD never imports three.js.
 */
export function Hud() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <TopBar />
      <ProgressRail />
      <TravelInterstitial />
      {/* the narrative content is the page's main region; TopBar (banner)
          and ProgressRail (nav) stay outside it. display:contents keeps the
          fixed-position layout untouched. */}
      <main className="contents">
        <StagePanel />
        <StageCaptions />
        <KineticStat />
        <DeepDive />
        <PromptInput />
        <PromptNudge />
        <GuessNext />
        <AttentionControls />
        <PredictionControls />
        <Telemetry />
        <EndCard />
      </main>
    </div>
  );
}
