"use client";

/**
 * Root error boundary. Replaces the root layout when an uncaught error
 * bubbles up, so this file must define its own <html> and <body>.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#06040c",
          color: "#ede9f7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: "28rem", padding: "2rem", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "11px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#9d7bff",
            }}
          >
            Signal lost
          </p>
          <p style={{ marginTop: "1rem", fontSize: "14px", lineHeight: 1.6, color: "#948da8" }}>
            Something went wrong while loading the experience.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              border: "1px solid rgb(237 233 247 / 0.14)",
              background: "transparent",
              color: "#ede9f7",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
