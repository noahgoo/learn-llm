import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import citations from "@/content/citations.json";

const stagesDir = path.join(__dirname, "..", "content", "stages");
const mdxFiles = readdirSync(stagesDir).filter((f) => f.endsWith(".mdx"));

function citeIdsIn(file: string): string[] {
  const src = readFileSync(path.join(stagesDir, file), "utf8");
  return [...src.matchAll(/<Cite\s+id="([^"]+)"\s*\/>/g)].map((m) => m[1]);
}

describe("citation integrity", () => {
  it("every <Cite> id resolves to a citations.json entry", () => {
    for (const file of mdxFiles) {
      for (const id of citeIdsIn(file)) {
        expect(citations, `${file}: unknown citation "${id}"`).toHaveProperty(
          id,
        );
      }
    }
  });

  it("every citation entry is complete with a plausible url", () => {
    for (const [id, c] of Object.entries(citations)) {
      expect(c.title, id).toBeTruthy();
      expect(c.authors, id).toBeTruthy();
      expect(c.venue, id).toBeTruthy();
      expect(c.year, id).toBeGreaterThan(1990);
      expect(c.url, id).toMatch(/^https:\/\//);
    }
  });

  it("every built stage cites at least one source per lens", () => {
    for (const file of mdxFiles) {
      expect(citeIdsIn(file).length, `${file} has no citations`).toBeGreaterThan(0);
    }
  });

  it("no orphan citations (every entry is cited somewhere)", () => {
    const used = new Set(mdxFiles.flatMap(citeIdsIn));
    const orphans = Object.keys(citations).filter((id) => !used.has(id));
    // hendrycks2016/ba2016/holtzman2020 become non-orphans in M3 stages
    const allowedUntilM3 = new Set(["hendrycks2016", "ba2016", "holtzman2020"]);
    expect(orphans.filter((o) => !allowedUntilM3.has(o))).toEqual([]);
  });
});
