/** Pure projection math for the embedding-space visualization. */

export interface EmbeddingCloud {
  scale: number;
  mean: number[];
  /** 3 principal components, each length-768, pre-scaled to world units */
  components: number[][];
  points: { t: string; p: number[] }[];
}

/**
 * Project a single 768-d embedding into the cloud's 3-D PCA space.
 * `emb` is a row slice of the model's tok_emb output.
 */
export function projectEmbedding(
  emb: ArrayLike<number>,
  cloud: Pick<EmbeddingCloud, "mean" | "components">,
): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const comp = cloud.components[k];
    let dot = 0;
    for (let d = 0; d < comp.length; d++) {
      dot += (Number(emb[d]) - cloud.mean[d]) * comp[d];
    }
    out[k] = dot;
  }
  return out;
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
