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
import MultiHeadSimple from "./multi-head.simple.mdx";
import MultiHeadTechnical from "./multi-head.technical.mdx";
import FFNSimple from "./ffn.simple.mdx";
import FFNTechnical from "./ffn.technical.mdx";
import ResidualSimple from "./residual.simple.mdx";
import ResidualTechnical from "./residual.technical.mdx";
import LayerNormSimple from "./layernorm.simple.mdx";
import LayerNormTechnical from "./layernorm.technical.mdx";
import PredictionSimple from "./prediction.simple.mdx";
import PredictionTechnical from "./prediction.technical.mdx";
import WeightsSimple from "./weights.simple.mdx";
import WeightsTechnical from "./weights.technical.mdx";

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
  "multi-head": { simple: MultiHeadSimple, technical: MultiHeadTechnical },
  ffn: { simple: FFNSimple, technical: FFNTechnical },
  residual: { simple: ResidualSimple, technical: ResidualTechnical },
  layernorm: { simple: LayerNormSimple, technical: LayerNormTechnical },
  prediction: { simple: PredictionSimple, technical: PredictionTechnical },
  weights: { simple: WeightsSimple, technical: WeightsTechnical },
};
