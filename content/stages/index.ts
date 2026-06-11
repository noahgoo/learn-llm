import type { ComponentType } from "react";
import type { StageId } from "@/lib/journey";

import TokenizationSimple from "./tokenization.simple.mdx";
import TokenizationTechnical from "./tokenization.technical.mdx";
import EmbeddingsSimple from "./embeddings.simple.mdx";
import EmbeddingsTechnical from "./embeddings.technical.mdx";
import PositionalSimple from "./positional.simple.mdx";
import PositionalTechnical from "./positional.technical.mdx";
import AttentionSimple from "./attention.simple.mdx";
import AttentionTechnical from "./attention.technical.mdx";

export interface StageContent {
  simple: ComponentType;
  technical: ComponentType;
}

/** Dual-lens copy per stage; stages without entries show their teaser. */
export const STAGE_CONTENT: Partial<Record<StageId, StageContent>> = {
  tokenization: { simple: TokenizationSimple, technical: TokenizationTechnical },
  embeddings: { simple: EmbeddingsSimple, technical: EmbeddingsTechnical },
  positional: { simple: PositionalSimple, technical: PositionalTechnical },
  attention: { simple: AttentionSimple, technical: AttentionTechnical },
};
