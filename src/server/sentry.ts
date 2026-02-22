/**
 * Lightweight Sentry client using the HTTP API directly.
 * Avoids the heavy @sentry/nextjs SDK and Windows/pnpm compatibility issues.
 * Completely no-op when SENTRY_DSN is not set.
 */

const SENTRY_DSN = process.env.SENTRY_DSN ?? "";
const SENTRY_ENVIRONMENT = process.env.NODE_ENV ?? "development";

let sentryEndpoint: string | null = null;
let endpointResolved = false;

function parseDsn(dsn: string): string | null {
  try {
    // DSN format: https://<key>@<host>/<project_id>
    const url = new URL(dsn);
    const key = url.username;
    const projectId = url.pathname.replace("/", "");
    const host = url.hostname;

    return `https://${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`;
  } catch {
    return null;
  }
}

function getSentryEndpoint(): string | null {
  if (endpointResolved) {
    return sentryEndpoint;
  }

  endpointResolved = true;

  if (!SENTRY_DSN) {
    sentryEndpoint = null;

    return null;
  }

  sentryEndpoint = parseDsn(SENTRY_DSN);

  return sentryEndpoint;
}

export async function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const endpoint = getSentryEndpoint();

  if (!endpoint) return;

  const err = error instanceof Error ? error : new Error(String(error));

  const event: Record<string, unknown> = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    environment: SENTRY_ENVIRONMENT,
    server_name: "feastqr",
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split("\n")
                  .slice(1, 10)
                  .map((line: string) => ({ filename: line.trim() })),
              }
            : undefined,
        },
      ],
    },
    extra: context,
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail - don't let error reporting break the app
  }
}

export async function captureMessage(
  message: string,
  level: "error" | "warning" | "info" = "info",
  extra?: Record<string, unknown>,
): Promise<void> {
  const endpoint = getSentryEndpoint();

  if (!endpoint) return;

  const event: Record<string, unknown> = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level,
    environment: SENTRY_ENVIRONMENT,
    server_name: "feastqr",
    message: { formatted: message },
    extra,
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail
  }
}

export function isSentryEnabled(): boolean {
  return !!getSentryEndpoint();
}
