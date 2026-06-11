# Exports the embedding-space visualization data:
#  - 3 principal components of GPT-2's embedding matrix W_E (and its mean),
#    so the client can project any live tok_emb vector into the same 3-D space
#  - a cloud of common-token points already projected, with labels
# Run: .venv/bin/python scripts/export_embedding_cloud.py
import json

import numpy as np
import torch
from transformers import GPT2LMHeadModel, GPT2TokenizerFast

N_POINTS = 1500
SCALE = 9.0  # world-units scale applied client-side consistency

model = GPT2LMHeadModel.from_pretrained("gpt2")
tok = GPT2TokenizerFast.from_pretrained("gpt2")
W = model.transformer.wte.weight.detach().numpy()  # [50257, 768]

mean = W.mean(axis=0)
X = W - mean
# PCA via eigendecomposition of the 768x768 covariance — cheap and exact
cov = X.T @ X / X.shape[0]
eigvals, eigvecs = np.linalg.eigh(cov)
components = eigvecs[:, -3:][:, ::-1]  # top-3, descending variance [768, 3]

proj = X @ components  # [50257, 3]
# normalize so the cloud fits nicely in a ~SCALE-unit radius
norm = np.percentile(np.linalg.norm(proj, axis=1), 95)
components_scaled = components * (SCALE / norm)
proj_scaled = proj * (SCALE / norm)

# BPE merge order roughly tracks corpus frequency: ids just above the byte
# alphabet are the most common subwords. Keep clean alphabetic ones.
points = []
for i in range(256, 50257):
    if len(points) >= N_POINTS:
        break
    s = tok.decode([i])
    if s.strip().isalpha() and len(s.strip()) >= 2:
        points.append(
            {"t": s, "p": [round(float(v), 3) for v in proj_scaled[i]]}
        )

out = {
    "scale": SCALE,
    "mean": [round(float(v), 5) for v in mean],
    "components": [
        [round(float(v), 7) for v in components_scaled[:, k]] for k in range(3)
    ],
    "points": points,
}
with open("fixtures/embedding-cloud.json", "w") as f:
    json.dump(out, f)
print(f"wrote fixtures/embedding-cloud.json ({len(points)} points)")
