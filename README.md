# Inside the Model

An interactive, cinematic 3D journey through a real transformer. Type any text and watch *your* tokens flow through tokenization, embeddings, attention, and out the other side as a next-token prediction — powered by GPT-2 running live in your browser.

> **Status: early development.** See [SPEC.md](SPEC.md) for the vision and [tasks/plan.md](tasks/plan.md) for the roadmap.

## Goals

- **Learn by flying, not reading** — a scroll-driven camera journey through one coherent 3D model, with free-explore breakout at every stage.
- **Real math, live** — GPT-2 small via Transformers.js: real tokens, real attention weights, real probabilities.
- **Two depths everywhere** — a Simple lens for intuition, a Technical lens for equations and tensor shapes.
- **Everything cited** — every claim traces to a research paper.

## Development

```bash
npm install
npm run dev        # localhost:3000
npm run build      # static export → out/
npm run lint
npm run typecheck
npm run test
```

## Deploying

The site builds to a static export (`out/`) and publishes via the **Deploy to
GitHub Pages** Actions workflow (manual `workflow_dispatch`).

The 160 MB instrumented model is too large for git, so it lives as a **Release
asset** and is pulled in at build time. One-time setup (after `scripts/setup.sh`
has produced `public/model/gpt2-instrumented.onnx` locally):

```bash
gh release create model-v1 public/model/gpt2-instrumented.onnx \
  --title "Model weights (GPT-2 instrumented)" \
  --notes "Instrumented GPT-2 small (int8) for in-browser inference"
```

Re-upload whenever the export changes (tag must match `MODEL_RELEASE_TAG` in the
workflow):

```bash
gh release upload model-v1 public/model/gpt2-instrumented.onnx --clobber
```

The ONNX Runtime wasm files are vendored from `node_modules` in CI via
`scripts/vendor-ort.sh`. Trigger a deploy with
`gh workflow run "Deploy to GitHub Pages"`.

## License

[MIT](LICENSE)
