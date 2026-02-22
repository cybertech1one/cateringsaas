/**
 * Server-side logger for structured error logging.
 * Centralizes all server logging so external services (Sentry, Pino, etc.)
 * can be wired in at a single point without touching every router.
 */

type LogLevel = "error" | "warn" | "info";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

function log(entry: LogEntry): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
  const ctx = entry.context ? ` [${entry.context}]` : "";
  const msg = `${prefix}${ctx} ${entry.message}`;

  if (entry.error) {
    const errorStr = formatError(entry.error);

    if (entry.level === "error") {
      console.error(msg, errorStr);
    } else {
      console.warn(msg, errorStr);
    }
  } else {
    if (entry.level === "error") {
      console.error(msg);
    } else if (entry.level === "warn") {
      console.warn(msg);
    }
  }
}

export const logger = {
  error(message: string, error?: unknown, context?: string) {
    log({ level: "error", message, error, context });

    // Fire-and-forget Sentry reporting (lazy import avoids circular deps)
    import("~/server/sentry")
      .then((sentry) =>
        sentry.captureException(error ?? message, {
          loggerContext: context,
          message,
        }),
      )
      .catch(() => {});
  },
  warn(message: string, error?: unknown, context?: string) {
    log({ level: "warn", message, error, context });
  },
  info(message: string, context?: string) {
    log({ level: "info", message, context });
  },
};
