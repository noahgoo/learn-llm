import Link from "next/link";
import citations from "@/content/citations.json";

export const metadata = { title: "References — Learn LLM: Inside the Model" };

/** Every source cited anywhere in the journey, in one place. */
export default function ReferencesPage() {
  const entries = Object.entries(citations).sort(
    (a, b) => a[1].year - b[1].year,
  );
  return (
    <main className="atmosphere min-h-dvh px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-wide2 text-dim transition-colors hover:text-ink"
        >
          ← Back to the journey
        </Link>
        <h1 className="mt-6 font-display text-5xl text-ink">References</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-dim">
          Every factual claim in the journey carries an inline marker tracing
          to one of these sources.
        </p>
        <div className="rule-x mt-8" />
        <ol className="mt-8 space-y-6">
          {entries.map(([id, c]) => (
            <li key={id} className="group">
              <a href={c.url} target="_blank" rel="noreferrer">
                <span className="text-[16px] leading-snug text-ink transition-colors group-hover:text-lavender">
                  {c.title}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-dim">
                  {c.authors}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide2 text-faint">
                  {c.venue} · {c.year}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
