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

## License

[MIT](LICENSE)
