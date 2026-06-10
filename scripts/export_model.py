# Export an instrumented GPT-2 small to ONNX for in-browser inference.
#
# Unlike stock ONNX exports (logits + KV-cache only), this graph also outputs
# the internals the visualizations need: per-layer attention softmax, masked
# pre-softmax scores, Q/K/V, token/position embeddings, and the residual
# stream after every block.
#
# Approach adapted from poloclub/transformer-explainer (MIT) and Karpathy's
# nanoGPT (MIT); weights are the original OpenAI GPT-2 small via HF hub.
#
# Usage: .venv/bin/python scripts/export_model.py
# Writes: public/model/gpt2-instrumented.onnx (int8, ~130 MB)

import math
import os

import torch
import torch.nn as nn
import torch.nn.functional as F

N_LAYER, N_HEAD, N_EMBD, BLOCK_SIZE, VOCAB = 12, 12, 768, 1024, 50257


class Block(nn.Module):
    def __init__(self):
        super().__init__()
        self.ln_1 = nn.LayerNorm(N_EMBD)
        self.attn_qkv = nn.Linear(N_EMBD, 3 * N_EMBD)
        self.attn_proj = nn.Linear(N_EMBD, N_EMBD)
        self.ln_2 = nn.LayerNorm(N_EMBD)
        self.mlp_fc = nn.Linear(N_EMBD, 4 * N_EMBD)
        self.mlp_proj = nn.Linear(4 * N_EMBD, N_EMBD)

    def forward(self, x, mask):
        b, t, c = x.shape
        h = self.ln_1(x)
        q, k, v = self.attn_qkv(h).split(N_EMBD, dim=2)
        # [b, heads, t, head_dim]
        q = q.view(b, t, N_HEAD, c // N_HEAD).transpose(1, 2)
        k = k.view(b, t, N_HEAD, c // N_HEAD).transpose(1, 2)
        v = v.view(b, t, N_HEAD, c // N_HEAD).transpose(1, 2)
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(c // N_HEAD)
        scores_masked = scores.masked_fill(mask[:, :, :t, :t] == 0, float("-inf"))
        attn = F.softmax(scores_masked, dim=-1)
        y = attn @ v
        y = y.transpose(1, 2).contiguous().view(b, t, c)
        x = x + self.attn_proj(y)
        x = x + self.mlp_proj(F.gelu(self.mlp_fc(self.ln_2(x)), approximate="tanh"))
        return x, attn, scores_masked, q, k, v


class InstrumentedGPT2(nn.Module):
    def __init__(self):
        super().__init__()
        self.wte = nn.Embedding(VOCAB, N_EMBD)
        self.wpe = nn.Embedding(BLOCK_SIZE, N_EMBD)
        self.blocks = nn.ModuleList(Block() for _ in range(N_LAYER))
        self.ln_f = nn.LayerNorm(N_EMBD)
        mask = torch.tril(torch.ones(BLOCK_SIZE, BLOCK_SIZE)).view(
            1, 1, BLOCK_SIZE, BLOCK_SIZE
        )
        self.register_buffer("mask", mask)

    def forward(self, input_ids):
        b, t = input_ids.shape
        pos = torch.arange(t, device=input_ids.device)
        tok_emb = self.wte(input_ids)
        pos_emb = self.wpe(pos)
        x = tok_emb + pos_emb
        attns, scores, qs, ks, vs, hiddens = [], [], [], [], [], [x]
        for block in self.blocks:
            x, attn, score, q, k, v = block(x, self.mask)
            attns.append(attn)
            scores.append(score)
            qs.append(q)
            ks.append(k)
            vs.append(v)
            hiddens.append(x)
        x = self.ln_f(x)
        logits = x @ self.wte.weight.T  # tied embeddings
        return (
            logits,
            tok_emb,
            pos_emb,
            *attns,
            *scores,
            *qs,
            *ks,
            *vs,
            *hiddens,
        )


def load_hf_weights(model: InstrumentedGPT2):
    from transformers import GPT2LMHeadModel

    # eager attention so output_attentions=True actually returns tensors
    hf = GPT2LMHeadModel.from_pretrained("gpt2", attn_implementation="eager")
    sd = hf.state_dict()
    model.wte.weight.data = sd["transformer.wte.weight"]
    model.wpe.weight.data = sd["transformer.wpe.weight"]
    for i, blk in enumerate(model.blocks):
        p = f"transformer.h.{i}."
        blk.ln_1.weight.data = sd[p + "ln_1.weight"]
        blk.ln_1.bias.data = sd[p + "ln_1.bias"]
        # HF uses Conv1D: weight is [in, out] — transpose for nn.Linear
        blk.attn_qkv.weight.data = sd[p + "attn.c_attn.weight"].T
        blk.attn_qkv.bias.data = sd[p + "attn.c_attn.bias"]
        blk.attn_proj.weight.data = sd[p + "attn.c_proj.weight"].T
        blk.attn_proj.bias.data = sd[p + "attn.c_proj.bias"]
        blk.ln_2.weight.data = sd[p + "ln_2.weight"]
        blk.ln_2.bias.data = sd[p + "ln_2.bias"]
        blk.mlp_fc.weight.data = sd[p + "mlp.c_fc.weight"].T
        blk.mlp_fc.bias.data = sd[p + "mlp.c_fc.bias"]
        blk.mlp_proj.weight.data = sd[p + "mlp.c_proj.weight"].T
        blk.mlp_proj.bias.data = sd[p + "mlp.c_proj.bias"]
    model.ln_f.weight.data = sd["transformer.ln_f.weight"]
    model.ln_f.bias.data = sd["transformer.ln_f.bias"]
    return hf


def verify(model: InstrumentedGPT2, hf) -> None:
    ids = torch.tensor([[464, 3797, 3332, 319, 262]])  # "The cat sat on the"
    with torch.no_grad():
        ours = model(ids)
        ref = hf(ids, output_attentions=True)
    logit_err = (ours[0] - ref.logits).abs().max().item()
    attn_err = max(
        (ours[3 + i] - ref.attentions[i]).abs().max().item() for i in range(N_LAYER)
    )
    print(f"max |logit diff| vs HF: {logit_err:.2e}")
    print(f"max |attn  diff| vs HF: {attn_err:.2e}")
    assert logit_err < 1e-3 and attn_err < 1e-4, "weight port mismatch"


def export(model: InstrumentedGPT2):
    os.makedirs("public/model", exist_ok=True)
    fp32_path = ".cache/gpt2-instrumented-fp32.onnx"
    os.makedirs(".cache", exist_ok=True)
    names = (
        ["logits", "tok_emb", "pos_emb"]
        + [f"attn_{i}" for i in range(N_LAYER)]
        + [f"scores_{i}" for i in range(N_LAYER)]
        + [f"q_{i}" for i in range(N_LAYER)]
        + [f"k_{i}" for i in range(N_LAYER)]
        + [f"v_{i}" for i in range(N_LAYER)]
        + [f"hidden_{i}" for i in range(N_LAYER + 1)]
    )
    dyn = {"input_ids": {0: "batch", 1: "seq"}}
    for n in names:
        dyn[n] = {0: "batch"} if n != "pos_emb" else {0: "seq"}
    torch.onnx.export(
        model,
        (torch.tensor([[464, 3797, 3332, 319, 262]]),),
        fp32_path,
        input_names=["input_ids"],
        output_names=names,
        dynamic_axes=dyn,
        opset_version=14,
        do_constant_folding=True,
        dynamo=False,
    )
    print(f"fp32: {os.path.getsize(fp32_path)/1e6:.0f} MB")

    from onnxruntime.quantization import QuantType, quantize_dynamic

    out_path = "public/model/gpt2-instrumented.onnx"
    quantize_dynamic(fp32_path, out_path, weight_type=QuantType.QInt8)
    print(f"int8: {os.path.getsize(out_path)/1e6:.0f} MB -> {out_path}")


if __name__ == "__main__":
    torch.manual_seed(0)
    model = InstrumentedGPT2().eval()
    hf = load_hf_weights(model)
    verify(model, hf)
    with torch.no_grad():
        export(model)
