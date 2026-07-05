import type { StageId } from "@/lib/journey";
import type { Lens } from "@/lib/store";
import type { CitationId } from "@/components/ui/Cite";

/**
 * Beat-scroll narration. Each built stage is a short sequence of beats; as
 * the camera dwells on a station, the active beat's headline fades into a
 * screen region (varying per beat, so text appears where the action is).
 * Full cited prose still lives in the per-stage MDX, surfaced on demand via
 * the explanation drawer — these are the hooks, not the textbook.
 *
 * Dual-lens: the base fields are the SIMPLE lens; `technical` overlays the
 * headline/caption for the technical lens. Keys, anchors, cites, and cues
 * are shared, so beat counts and choreography cannot drift between lenses.
 */
export type BeatAnchor = "center" | "top-left" | "bottom-left" | "right";

export interface Beat {
  key: string;
  /** Short hook, the line the eye lands on. */
  headline: string;
  /** Optional supporting line under the headline. */
  caption?: string;
  /** Screen region the caption occupies for this beat. */
  anchor: BeatAnchor;
  /** Citation markers rendered after the caption. */
  cite?: CitationId[];
  /** Entry cue: an action line with an animated scroll chevron (beat 0 only). */
  cue?: string;
  /** Technical-lens copy; falls back to the simple copy when absent. */
  technical?: { headline: string; caption?: string };
}

export const STAGE_BEATS: Partial<Record<StageId, Beat[]>> = {
  tokenization: [
    {
      key: "tok-numbers",
      headline: "Your sentence enters as one strip of text.",
      caption: "The scanner previews the numeric IDs the model will actually read.",
      anchor: "center",
      cue: "Scroll to follow your words through the model",
      technical: {
        headline: "Text in, integer IDs out.",
        caption:
          "The model never sees characters — byte-level BPE segments your string into a sequence of vocabulary IDs, shape [seq].",
      },
    },
    {
      key: "tok-split",
      headline: "The strip cracks into token cards.",
      caption:
        "Each card keeps a piece of text and gets stamped with a vocabulary ID.",
      anchor: "bottom-left",
      cite: ["sennrich2016"],
      technical: {
        headline: "Greedy BPE merges carve the strip.",
        caption:
          "Learned merge rules segment deterministically; each piece maps to one of 50,257 entries — 256 bytes + 50,000 merges + <|endoftext|>.",
      },
    },
    {
      key: "tok-rare",
      headline: "Rare words break into pieces.",
      caption:
        "If a chunk is not common enough, the tokenizer falls back to smaller pieces.",
      anchor: "bottom-left",
      cite: ["radford2019"],
      technical: {
        headline: "No out-of-vocabulary token exists.",
        caption:
          "Rare strings fall back toward raw bytes — and whitespace is part of the token, so \" the\" and \"the\" are different IDs.",
      },
    },
  ],
  embeddings: [
    {
      key: "emb-address",
      headline: "An ID is only an address.",
      caption: "The card pauses at a lookup table; the number itself has no meaning yet.",
      anchor: "center",
      technical: {
        headline: "ID i selects row i of the embedding matrix.",
        caption:
          "W_E ∈ ℝ^(50,257 × 768) is a plain lookup table — no computation, just indexing into learned parameters.",
      },
    },
    {
      key: "emb-point",
      headline: "The address returns a vector.",
      caption:
        "Each token flips from a card into a bead and flies to its learned location.",
      anchor: "bottom-left",
      cite: ["radford2019"],
      technical: {
        headline: "Each token becomes a 768-d vector.",
        caption:
          "The cloud is a PCA projection of the live W_E rows — 3 of 768 components, so distances compress but neighborhoods survive.",
      },
    },
    {
      key: "emb-geometry",
      headline: "Nearby points wake up.",
      caption:
        "Tokens used in similar contexts cluster together, so distance starts to carry meaning.",
      anchor: "right",
      technical: {
        headline: "Neighborhoods are learned structure.",
        caption:
          "The rows are ordinary parameters trained end-to-end; GPT-2 also ties W_E to the output head, one token space end to end.",
      },
    },
  ],
  positional: [
    {
      key: "pos-order",
      headline: "Order is information.",
      caption:
        "The same beads can mean different things when their order changes.",
      anchor: "center",
      technical: {
        headline: "Self-attention is permutation-equivariant.",
        caption:
          "Shuffle the inputs and the outputs shuffle identically — position must be injected explicitly.",
      },
    },
    {
      key: "pos-vector",
      headline: "Each slot emits a position vector.",
      caption:
        "The bead receives that offset, turning meaning into meaning-at-a-place.",
      anchor: "bottom-left",
      cite: ["vaswani2017"],
      technical: {
        headline: "GPT-2 adds learned absolute positions.",
        caption:
          "Block 0's input is W_E[tᵢ] + W_P[i], with W_P ∈ ℝ^(1024 × 768) — no row for position 1025, so context is capped.",
      },
    },
    {
      key: "pos-ribbon",
      headline: "The vectors settle into sequence.",
      caption:
        "The ordered ribbon preserves both what each token is and where it appears.",
      anchor: "right",
      technical: {
        headline: "Modern models rotate instead of add.",
        caption:
          "RoPE turns position into Q/K rotations inside attention, so scores depend on relative offsets — better length behavior.",
      },
    },
  ],
  attention: [
    {
      key: "attn-lookback",
      headline: "One token becomes the query.",
      caption:
        "The spotlight sweeps backward only; future tokens stay masked.",
      anchor: "center",
      technical: {
        headline: "The last position forms a query.",
        caption:
          "Q = XW_Q and K = XW_K per head; the causal mask sets every j > i to −∞, so the future gets exactly zero weight.",
      },
    },
    {
      key: "attn-qk",
      headline: "The query weighs earlier tokens.",
      caption:
        "Thicker arcs mean this head is pulling more context from that position.",
      anchor: "bottom-left",
      cite: ["vaswani2017"],
      technical: {
        headline: "Affinities are QKᵀ / √d_k.",
        caption:
          "Dot products are scaled by √d_k (d_k = 64 here) so softmax doesn't saturate as head dimension grows.",
      },
    },
    {
      key: "attn-softmax",
      headline: "Scores become shares.",
      caption:
        "Each row is softmaxed — the weights along a row sum to one, so attention is a budget the query spends.",
      anchor: "bottom-left",
      cite: ["vaswani2017"],
      technical: {
        headline: "Each row softmaxes to sum 1.",
        caption:
          "The row weights a convex combination of value vectors V; the result is added to the residual stream, not swapped in.",
      },
    },
    {
      key: "attn-matrix",
      headline: "The arcs fold into a heatmap.",
      caption:
        "Rows are queries, columns are keys; the highlighted row is the lookback you just watched.",
      anchor: "right",
      technical: {
        headline: "This is softmax(QKᵀ/√d_k + M), live.",
        caption:
          "Straight from the model in your browser — rows are queries, columns keys, and the empty upper triangle is the causal mask M.",
      },
    },
  ],
  "multi-head": [
    {
      key: "mh-split",
      headline: "One attention step becomes many.",
      caption:
        "Learned projections branch the same stream into parallel heads, each with its own pattern.",
      anchor: "center",
      cite: ["vaswani2017"],
      technical: {
        headline: "12 heads per layer, d_k = 64 each.",
        caption:
          "Q/K/V projections of the 768-wide stream reshape into 12 parallel head spaces; attention runs independently in each.",
      },
    },
    {
      key: "mh-gallery",
      headline: "Heads watch different relationships.",
      caption: "Some focus nearby, some look back, some lock onto repeated structure.",
      anchor: "bottom-left",
      technical: {
        headline: "Same mechanism, different learned projections.",
        caption:
          "Each panel is one head's live softmax matrix. Interpret gently — pruning studies show few heads carry clean human labels.",
      },
    },
    {
      key: "mh-explore",
      headline: "Flip through the heads yourself.",
      caption:
        "The layer and head selectors drive the live view — every combination is a different learned pattern.",
      anchor: "bottom-left",
      cite: ["michel2019"],
      technical: {
        headline: "12 layers × 12 heads = 144 patterns.",
        caption:
          "The selectors index the live attention tensor [12, 12, seq, seq] — every combination is a real matrix for your prompt.",
      },
    },
    {
      key: "mh-merge",
      headline: "The heads recombine.",
      caption: "Their outputs concatenate and pass through an output projection.",
      anchor: "right",
      cite: ["vaswani2017"],
      technical: {
        headline: "Concat, then W_O projects back.",
        caption:
          "Head outputs concatenate to 768 dims and W_O mixes them into one write to the residual stream. Modern LLMs often share K/V across query heads (GQA) to shrink the KV cache.",
      },
    },
  ],
  ffn: [
    {
      key: "ffn-local",
      headline: "Now each token thinks alone.",
      caption: "The feed-forward network transforms each token without mixing positions.",
      anchor: "center",
      technical: {
        headline: "The MLP is position-wise.",
        caption:
          "The same 768 → 3072 → 768 network applies at every sequence position independently — cross-token mixing already happened in attention.",
      },
    },
    {
      key: "ffn-expand",
      headline: "The vector expands through a gate.",
      caption:
        "GPT-2 uses GELU; many newer LLMs use SwiGLU-style gates or routed experts.",
      anchor: "bottom-left",
      cite: ["hendrycks2016", "shazeer2020", "fedus2022"],
      technical: {
        headline: "768 → 3072 through GELU.",
        caption:
          "A smooth Gaussian-weighted gate rather than ReLU's hard cut. Llama/PaLM-style models use SwiGLU; MoE models route each token to a few expert FFNs.",
      },
    },
    {
      key: "ffn-compress",
      headline: "The result compresses back.",
      caption: "The token leaves with the same width, but a changed internal pattern.",
      anchor: "right",
      cite: ["radford2019"],
      technical: {
        headline: "3072 → 768, features rewritten.",
        caption:
          "One useful reading: FFNs as key–value memories — the input pattern selects features, the down-projection writes them back to the stream.",
      },
    },
  ],
  residual: [
    {
      key: "res-stream",
      headline: "The stream keeps carrying state.",
      caption: "Each layer reads from the stream and writes a change back into it.",
      anchor: "center",
      cite: ["elhage2021"],
      technical: {
        headline: "One 768-d stream, twelve blocks.",
        caption:
          "Each block computes x + Attn(LN(x)), then + MLP(LN(x)) — sublayers contribute additive updates to a shared stream.",
      },
    },
    {
      key: "res-write",
      headline: "Layer outputs add, not replace.",
      caption:
        "Attention and MLP writes join the highway; the snapshots trace the same token evolving across blocks.",
      anchor: "bottom-left",
      technical: {
        headline: "hidden_0 through hidden_12, live.",
        caption:
          "The curve traces your last token's norm across the exported snapshots — the same state persisting and evolving, never replaced.",
      },
    },
  ],
  layernorm: [
    {
      key: "ln-uneven",
      headline: "Activations can get uneven.",
      caption: "A token vector may have large and tiny channels side by side.",
      anchor: "center",
      technical: {
        headline: "Channel scales drift across 768 dims.",
        caption:
          "Twelve blocks of additive writes let activation magnitudes wander — each read needs a well-conditioned input.",
      },
    },
    {
      key: "ln-normalize",
      headline: "LayerNorm recenters the signal.",
      caption:
        "Each vector is shifted and scaled before the next read — GPT-2 pre-norm; newer LLMs often use RMSNorm.",
      anchor: "bottom-left",
      cite: ["ba2016", "xiong2020", "zhang2019"],
      technical: {
        headline: "Pre-LN: normalize before every read.",
        caption:
          "Per token: subtract the mean, divide by σ, apply learned gain and bias. RMSNorm (most modern LLMs) drops the mean step entirely.",
      },
    },
  ],
  prediction: [
    {
      key: "pred-logits",
      headline: "The final vector scores the vocabulary.",
      caption: "Every possible next token gets a raw logit.",
      anchor: "center",
      technical: {
        headline: "The unembedding is tied: W_E, transposed.",
        caption:
          "The final hidden state multiplies the same matrix that embedded the input — one logit for each of 50,257 tokens.",
      },
    },
    {
      key: "pred-softmax",
      headline: "Softmax turns scores into probabilities.",
      caption: "The biggest logits become the most likely next tokens.",
      anchor: "bottom-left",
      technical: {
        headline: "Softmax with a temperature dial.",
        caption:
          "P(i) = exp(zᵢ/T) / Σⱼ exp(zⱼ/T) — T → 0 approaches argmax, T > 1 flattens the distribution.",
      },
    },
    {
      key: "pred-sample",
      headline: "Temperature reshapes the choice.",
      caption:
        "Sample one token, append it, and repeat; temperature controls how sharp each choice is.",
      anchor: "right",
      cite: ["holtzman2020", "radford2019"],
      technical: {
        headline: "Nucleus sampling truncates the tail.",
        caption:
          "Keep the smallest set with cumulative probability ≥ p, sample, append, repeat — cached K/V make each next step cheap.",
      },
    },
  ],
  weights: [
    {
      key: "weights-architecture",
      headline: "The architecture is the family pattern.",
      caption:
        "The live path is GPT-2; modern LLMs swap pieces like RoPE, RMSNorm, and GQA.",
      anchor: "center",
      cite: ["vaswani2017", "su2021", "zhang2019", "ainslie2023"],
      technical: {
        headline: "The computation graph is the constant.",
        caption:
          "Modern decoder LLMs still walk this path, with swaps: RoPE for learned positions, RMSNorm for LayerNorm, SwiGLU FFNs, grouped-query attention.",
      },
    },
    {
      key: "weights-trained",
      headline: "Training fills in the machinery.",
      caption: "Weights and post-training turn the family pattern into behavior.",
      anchor: "bottom-left",
      cite: ["radford2019", "ouyang2022"],
      technical: {
        headline: "124,439,808 parameters make it speak.",
        caption:
          "Random weights score the vocabulary as noise; pretraining plus post-training (instruction tuning, RLHF) turn the graph into behavior.",
      },
    },
    {
      key: "weights-finale",
      headline: "A model is architecture plus weights.",
      caption: "The journey ends where design choices and learned parameters meet.",
      anchor: "right",
      technical: {
        headline: "Architecture × weights × data.",
        caption:
          "The differences that matter most aren't code switches — scale, tokenizer, data distribution, and post-training set models apart.",
      },
    },
  ],
};

/**
 * Beats for a stage in the given lens, or an empty list for placeholder
 * stations. The technical lens overlays headline/caption per beat; keys,
 * anchors, cites, and cues stay shared.
 */
export function beatsFor(id: StageId, lens: Lens = "simple"): Beat[] {
  const beats = STAGE_BEATS[id] ?? [];
  if (lens !== "technical") return beats;
  return beats.map((b) => (b.technical ? { ...b, ...b.technical } : b));
}
