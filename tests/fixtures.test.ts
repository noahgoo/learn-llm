import { describe, expect, it } from "vitest";
import fixtures from "@/fixtures/sentences.json";
import { N_HEAD, N_LAYER } from "@/lib/model/protocol";
import { SUGGESTIONS } from "@/lib/suggestions";

describe("model fixtures (real GPT-2 outputs)", () => {
  it("contains the example sentences", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(5);
  });

  it("every suggested payload has fixture data", () => {
    const texts = fixtures.map((f) => f.text);
    for (const s of SUGGESTIONS) expect(texts).toContain(s);
  });

  it.each(fixtures.map((f) => [f.text, f] as const))(
    "%s — shapes and invariants",
    (_text, f) => {
      expect(f.ids).toHaveLength(f.seq);
      expect(f.tokens).toHaveLength(f.seq);
      // tokens reassemble the original text
      expect(f.tokens.join("")).toBe(f.text);
      // attention: 12 layers of [12, seq, seq], rows sum to ~1
      expect(f.attention).toHaveLength(N_LAYER);
      for (const layer of f.attention) {
        expect(layer).toHaveLength(N_HEAD * f.seq * f.seq);
        for (let h = 0; h < N_HEAD; h++) {
          for (let i = 0; i < f.seq; i++) {
            let sum = 0;
            for (let j = 0; j < f.seq; j++) {
              sum += layer[(h * f.seq + i) * f.seq + j];
            }
            expect(sum).toBeCloseTo(1, 3);
          }
        }
      }
      // causal mask: scores strictly above the diagonal are -inf sentinel
      for (const layer of f.scores) {
        for (let h = 0; h < N_HEAD; h++) {
          for (let i = 0; i < f.seq; i++) {
            for (let j = i + 1; j < f.seq; j++) {
              expect(layer[(h * f.seq + i) * f.seq + j]).toBeLessThan(-1e8);
            }
          }
        }
      }
      // topk: descending probabilities in (0, 1]
      for (let i = 1; i < f.topk.length; i++) {
        expect(f.topk[i].prob).toBeLessThanOrEqual(f.topk[i - 1].prob);
      }
      expect(f.topk[0].prob).toBeGreaterThan(0);
      expect(f.finalLogits).toHaveLength(50257);
      expect(f.hiddens).toHaveLength(N_LAYER + 1);
      for (const hidden of f.hiddens) {
        expect(hidden).toHaveLength(f.seq * 768);
      }
    },
  );

  it("tokenizes 'The cat sat on the' to the canonical GPT-2 ids", () => {
    const cat = fixtures.find((f) => f.text === "The cat sat on the")!;
    expect(cat.ids).toEqual([464, 3797, 3332, 319, 262]);
    expect(cat.topk[0].token).toBe(" floor");
  });
});
