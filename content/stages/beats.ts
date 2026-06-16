import type { StageId } from "@/lib/journey";
import type { CitationId } from "@/components/ui/Cite";

/**
 * Beat-scroll narration. Each built stage is a short sequence of beats; as
 * the camera dwells on a station, the active beat's headline fades into a
 * screen region (varying per beat, so text appears where the action is).
 * Full cited prose still lives in the per-stage MDX, surfaced on demand via
 * the Deep Dive panel — these are the hooks, not the textbook.
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
}

export const STAGE_BEATS: Partial<Record<StageId, Beat[]>> = {
  tokenization: [
    {
      key: "tok-numbers",
      headline: "Your sentence enters as one strip of text.",
      caption: "The scanner previews the numeric IDs the model will actually read.",
      anchor: "center",
      cue: "Scroll to follow your words through the model",
    },
    {
      key: "tok-split",
      headline: "The strip cracks into token cards.",
      caption:
        "Each card keeps a piece of text and gets stamped with a vocabulary ID.",
      anchor: "bottom-left",
      cite: ["sennrich2016"],
    },
    {
      key: "tok-rare",
      headline: "Rare words break into pieces.",
      caption:
        "If a chunk is not common enough, the tokenizer falls back to smaller pieces.",
      anchor: "bottom-left",
      cite: ["radford2019"],
    },
  ],
  embeddings: [
    {
      key: "emb-address",
      headline: "An ID is only an address.",
      caption: "The card pauses at a lookup table; the number itself has no meaning yet.",
      anchor: "center",
    },
    {
      key: "emb-point",
      headline: "The address returns a vector.",
      caption:
        "Each token flips from a card into a bead and flies to its learned location.",
      anchor: "bottom-left",
      cite: ["radford2019"],
    },
    {
      key: "emb-geometry",
      headline: "Nearby points wake up.",
      caption:
        "Tokens used in similar contexts cluster together, so distance starts to carry meaning.",
      anchor: "right",
    },
  ],
  positional: [
    {
      key: "pos-order",
      headline: "Order is information.",
      caption:
        "The same beads can mean different things when their order changes.",
      anchor: "center",
    },
    {
      key: "pos-vector",
      headline: "Each slot emits a position vector.",
      caption:
        "The bead receives that offset, turning meaning into meaning-at-a-place.",
      anchor: "bottom-left",
      cite: ["vaswani2017"],
    },
    {
      key: "pos-ribbon",
      headline: "The vectors settle into sequence.",
      caption:
        "The ordered ribbon preserves both what each token is and where it appears.",
      anchor: "right",
    },
  ],
  attention: [
    {
      key: "attn-lookback",
      headline: "One token becomes the query.",
      caption:
        "The spotlight sweeps backward only; future tokens stay masked.",
      anchor: "center",
    },
    {
      key: "attn-qk",
      headline: "The query weighs earlier tokens.",
      caption:
        "Thicker arcs mean this head is pulling more context from that position.",
      anchor: "bottom-left",
      cite: ["vaswani2017"],
    },
    {
      key: "attn-matrix",
      headline: "The arcs fold into a heatmap.",
      caption:
        "Rows are queries, columns are keys; the highlighted row is the lookback you just watched.",
      anchor: "right",
    },
  ],
  "multi-head": [
    {
      key: "mh-split",
      headline: "One attention map becomes many.",
      caption: "The same tokens branch into parallel heads, each with its own pattern.",
      anchor: "center",
      cite: ["vaswani2017"],
    },
    {
      key: "mh-gallery",
      headline: "Heads watch different relationships.",
      caption: "Some focus nearby, some look back, some lock onto repeated structure.",
      anchor: "bottom-left",
    },
    {
      key: "mh-merge",
      headline: "The heads recombine.",
      caption: "Their outputs concatenate and pass through an output projection.",
      anchor: "right",
      cite: ["vaswani2017"],
    },
  ],
  ffn: [
    {
      key: "ffn-local",
      headline: "Now each token thinks alone.",
      caption: "The feed-forward network transforms every token independently.",
      anchor: "center",
    },
    {
      key: "ffn-expand",
      headline: "The vector expands through GELU.",
      caption: "GPT-2 widens each 768-value vector to 3072 channels, then gates it.",
      anchor: "bottom-left",
      cite: ["hendrycks2016"],
    },
    {
      key: "ffn-compress",
      headline: "The result compresses back.",
      caption: "The token leaves with the same width, but a changed internal pattern.",
      anchor: "right",
      cite: ["radford2019"],
    },
  ],
  residual: [
    {
      key: "res-stream",
      headline: "The stream keeps carrying state.",
      caption: "Each layer reads from the stream and writes a change back into it.",
      anchor: "center",
      cite: ["elhage2021"],
    },
    {
      key: "res-write",
      headline: "Layer outputs add, not replace.",
      caption: "Attention and MLP updates join the highway as residual writes.",
      anchor: "bottom-left",
    },
    {
      key: "res-layers",
      headline: "Snapshots show the stream evolving.",
      caption: "Hidden states trace how the same token changes across blocks.",
      anchor: "right",
    },
  ],
  layernorm: [
    {
      key: "ln-uneven",
      headline: "Activations can get uneven.",
      caption: "A token vector may have large and tiny channels side by side.",
      anchor: "center",
    },
    {
      key: "ln-normalize",
      headline: "LayerNorm recenters the signal.",
      caption: "It shifts and scales each token vector before the next read.",
      anchor: "bottom-left",
      cite: ["ba2016"],
    },
    {
      key: "ln-pre",
      headline: "GPT-2 normalizes before sublayers.",
      caption: "Pre-LN keeps deep residual paths easier to train and follow.",
      anchor: "right",
    },
  ],
  prediction: [
    {
      key: "pred-logits",
      headline: "The final vector scores the vocabulary.",
      caption: "Every possible next token gets a raw logit.",
      anchor: "center",
    },
    {
      key: "pred-softmax",
      headline: "Softmax turns scores into probabilities.",
      caption: "The biggest logits become the most likely next tokens.",
      anchor: "bottom-left",
    },
    {
      key: "pred-sample",
      headline: "Temperature reshapes the choice.",
      caption: "Lower temperature sharpens; higher temperature spreads probability out.",
      anchor: "right",
      cite: ["holtzman2020"],
    },
  ],
  weights: [
    {
      key: "weights-architecture",
      headline: "The architecture is the recipe.",
      caption: "The same blocks can run with useful weights or random ones.",
      anchor: "center",
      cite: ["vaswani2017"],
    },
    {
      key: "weights-trained",
      headline: "Training fills in the machinery.",
      caption: "Learned weights turn the recipe into behavior.",
      anchor: "bottom-left",
      cite: ["radford2019"],
    },
    {
      key: "weights-finale",
      headline: "A model is code plus memory.",
      caption: "The journey ends where architecture and learned parameters meet.",
      anchor: "right",
    },
  ],
};

/** Beats for a stage, or an empty list for placeholder stations. */
export function beatsFor(id: StageId): Beat[] {
  return STAGE_BEATS[id] ?? [];
}
