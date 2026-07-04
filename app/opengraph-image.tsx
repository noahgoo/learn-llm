import { ImageResponse } from "next/og";

// static export: render once at build time
export const dynamic = "force-static";

export const alt =
  "Learn LLM — an interactive 3D journey through a transformer, stage by stage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SLABS = 12;

/**
 * The share card IS the ad for a visual site: the block tower rendered as
 * flat art (12 slabs = 12 GPT-2 layers, conduit rising through them) next
 * to the wordmark. Generated statically at build via satori — no runtime.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#06040c",
          padding: "70px 90px",
          fontFamily: "sans-serif",
        }}
      >
        {/* the tower */}
        <div
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            gap: 10,
            marginRight: 90,
          }}
        >
          {Array.from({ length: SLABS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 190,
                height: 28,
                border: "1.5px solid rgba(157,123,255,0.55)",
                background: `rgba(157,123,255,${0.04 + i * 0.012})`,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
        {/* the words */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 8,
              color: "#9d7bff",
              textTransform: "uppercase",
            }}
          >
            Learn · LLM
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 76,
              lineHeight: 1.05,
              color: "#ede9f7",
              fontWeight: 700,
              maxWidth: 640,
            }}
          >
            Watch a language model think.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 27,
              lineHeight: 1.45,
              color: "#948da8",
              maxWidth: 620,
            }}
          >
            Walk through GPT-2 in 3D — tokens, attention, and the next-word
            guess, running live in your browser.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
