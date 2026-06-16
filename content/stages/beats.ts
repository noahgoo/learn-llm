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
};

/** Beats for a stage, or an empty list for placeholder stations. */
export function beatsFor(id: StageId): Beat[] {
  return STAGE_BEATS[id] ?? [];
}
