"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "1rem",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            backgroundColor: "hsl(var(--background, 0 0% 100%))",
            color: "hsl(var(--foreground, 0 0% 3.9%))",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              fontFamily: "var(--font-display, 'Playfair Display', serif)",
              color: "hsl(var(--foreground, 0 0% 3.9%))",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "hsl(var(--muted-foreground, 0 0% 45.1%))",
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "9999px",
              border: "1px solid hsl(var(--border, 0 0% 89.8%))",
              cursor: "pointer",
              backgroundColor: "hsl(var(--background, 0 0% 100%))",
              color: "hsl(var(--foreground, 0 0% 3.9%))",
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
