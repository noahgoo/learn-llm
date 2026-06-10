import { describe, expect, it } from "vitest";
import { softmax, topkIndices } from "@/lib/model/math";

describe("softmax", () => {
  it("sums to 1 and preserves order", () => {
    const p = softmax([1, 3, 2]);
    expect(p[0] + p[1] + p[2]).toBeCloseTo(1, 6);
    expect(p[1]).toBeGreaterThan(p[2]);
    expect(p[2]).toBeGreaterThan(p[0]);
  });

  it("is numerically stable for large logits", () => {
    const p = softmax([1000, 1001]);
    expect(p[1]).toBeCloseTo(1 / (1 + Math.exp(-1)), 6);
  });

  it("sharpens with low temperature, flattens with high", () => {
    const cold = softmax([1, 2], 0.5);
    const hot = softmax([1, 2], 10);
    expect(cold[1]).toBeGreaterThan(hot[1]);
    expect(hot[1]).toBeGreaterThan(0.5);
  });
});

describe("topkIndices", () => {
  it("returns the k largest, descending", () => {
    expect(topkIndices([5, 9, 1, 7, 3], 3)).toEqual([1, 3, 0]);
  });
  it("handles k larger than input", () => {
    expect(topkIndices([2, 1], 5)).toEqual([0, 1]);
  });
});
