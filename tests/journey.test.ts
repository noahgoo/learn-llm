import { describe, expect, it } from "vitest";
import {
  cameraKeyframe,
  JOURNEY_UNITS,
  journeyFromProgress,
  scrollOffsetForStage,
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
    // midpoint lands somewhere strictly inside the journey
    const mid = stageIndexForProgress(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(STAGE_COUNT - 1);
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

  it("counts journey units as dwell beats plus travels", () => {
    const beats = STAGES.reduce((sum, s) => sum + s.beats, 0);
    expect(JOURNEY_UNITS).toBe(beats + (STAGE_COUNT - 1));
  });

  it("beat-scroll mapping is bounded and ordered", () => {
    const first = journeyFromProgress(0);
    expect(first.stageIndex).toBe(0);
    expect(first.beatIndex).toBe(0);
    expect(first.traveling).toBe(false);

    const last = journeyFromProgress(1);
    expect(last.stageIndex).toBe(STAGE_COUNT - 1);
    expect(last.cameraT).toBeCloseTo(1);

    // cameraT and stageIndex never decrease as progress advances
    let prevT = -1;
    let prevStage = -1;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const j = journeyFromProgress(Math.min(1, p));
      expect(j.cameraT).toBeGreaterThanOrEqual(prevT - 1e-9);
      expect(j.stageIndex).toBeGreaterThanOrEqual(prevStage);
      expect(j.beatProgress).toBeGreaterThanOrEqual(0);
      expect(j.beatProgress).toBeLessThanOrEqual(1);
      expect(j.beatIndex).toBeLessThan(STAGES[j.stageIndex].beats);
      prevT = j.cameraT;
      prevStage = j.stageIndex;
    }
  });

  it("walks every stage in its dwell band, in order", () => {
    for (let i = 0; i < STAGE_COUNT; i++) {
      const j = journeyFromProgress(scrollOffsetForStage(i) + 1e-6);
      expect(j.stageIndex).toBe(i);
      expect(j.beatIndex).toBe(0);
      expect(j.traveling).toBe(false);
    }
  });
});
