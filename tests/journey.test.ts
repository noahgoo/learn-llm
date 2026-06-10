import { describe, expect, it } from "vitest";
import {
  cameraKeyframe,
  STAGE_COUNT,
  STAGES,
  stageIndexForProgress,
  stationPosition,
} from "@/lib/journey";

describe("journey", () => {
  it("has 10 uniquely-identified stages", () => {
    expect(STAGE_COUNT).toBe(10);
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(10);
  });

  it("maps progress to stage indices within bounds", () => {
    expect(stageIndexForProgress(0)).toBe(0);
    expect(stageIndexForProgress(1)).toBe(STAGE_COUNT - 1);
    expect(stageIndexForProgress(-0.5)).toBe(0);
    expect(stageIndexForProgress(1.5)).toBe(STAGE_COUNT - 1);
    // midpoint of the journey lands mid-stage
    expect(stageIndexForProgress(0.5)).toBe(Math.round((STAGE_COUNT - 1) / 2));
  });

  it("keeps stations spaced apart along the path", () => {
    for (let i = 1; i < STAGE_COUNT; i++) {
      const [, , zPrev] = stationPosition(i - 1);
      const [, , z] = stationPosition(i);
      expect(zPrev - z).toBeGreaterThan(20);
    }
  });

  it("places camera keyframes behind their stations (toward viewer)", () => {
    for (let i = 0; i < STAGE_COUNT; i++) {
      expect(cameraKeyframe(i)[2]).toBeGreaterThan(stationPosition(i)[2]);
    }
  });
});
