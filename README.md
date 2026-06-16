# Learn LLM: Inside the Model

An interactive 3D guide to how transformer-based LLMs work. Type text and watch it move through tokenization, embeddings, positional encoding, attention, MLPs, residual streams, normalization, and next-token prediction.

The live demo uses an instrumented GPT-2 small model in the browser, while the explanations connect each step to modern LLM design.

## Highlights

- Scroll-driven 3D journey through the model pipeline
- Real token IDs, attention values, hidden states, and probabilities
- Simple and Technical explanations for each stage
- Research-backed citations throughout the learning content
- Static export deployable to GitHub Pages

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # static export to out/
npm run lint
npm run typecheck
npm run test
```

## Project Notes

The roadmap lives in `tasks/todo.md` and `tasks/plan.md`. The broader product vision is in `SPEC.md`.

The instrumented model file is too large for git, so deployment expects it as a GitHub Release asset consumed by the GitHub Pages workflow.

## License

[MIT](LICENSE)
