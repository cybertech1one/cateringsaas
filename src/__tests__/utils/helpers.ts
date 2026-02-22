/**
 * Common test helpers for Diyafa.
 *
 * Provides utilities for waiting on async renders, mocking fetch,
 * and creating a mock Next.js router object.
 */

import { screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// waitForLoadingToFinish
// ---------------------------------------------------------------------------

/**
 * Wait until no loading indicators are present in the DOM.
 * Looks for common loading patterns used in the Diyafa codebase:
 *  - Elements with role="progressbar"
 *  - Elements with aria-busy="true"
 *  - Text content "Loading..."
 *
 * Times out after the default `waitFor` timeout (1 000 ms by default in RTL).
 */
export async function waitForLoadingToFinish(): Promise<void> {
  await waitFor(() => {
    const progressBars = screen.queryAllByRole("progressbar");
    const busyElements = document.querySelectorAll('[aria-busy="true"]');
    const loadingTexts = screen.queryAllByText(/loading/i);

    if (progressBars.length > 0 || busyElements.length > 0 || loadingTexts.length > 0) {
      throw new Error("Still loading");
    }
  });
}

// ---------------------------------------------------------------------------
// mockFetch
// ---------------------------------------------------------------------------

/**
 * Replace `globalThis.fetch` with a mock that resolves with the given data
 * as JSON. Automatically restores the original fetch after the current test
 * via `vi.restoreAllMocks()` (which vitest calls if you use `vi.fn()`).
 *
 * @param data  The JSON body to return.
 * @param status HTTP status code (default 200).
 *
 * @example
 * ```ts
 * mockFetch({ menus: [] });
 * // ... trigger component that calls fetch ...
 * expect(globalThis.fetch).toHaveBeenCalledTimes(1);
 * ```
 */
export function mockFetch(data: unknown, status = 200): void {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ "content-type": "application/json" }),
    clone: function () {
      return { ...this, json: () => Promise.resolve(data) };
    },
  } as unknown as Response;

  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(mockResponse)));
}

// ---------------------------------------------------------------------------
// createMockRouter
// ---------------------------------------------------------------------------

/**
 * Minimal mock of the Next.js App Router `useRouter()` return value.
 * Suitable for components that read `router.push`, `router.pathname`, etc.
 *
 * Use with vi.mock:
 * ```ts
 * vi.mock("next/navigation", () => ({
 *   useRouter: () => createMockRouter({ pathname: "/dashboard" }),
 *   usePathname: () => "/dashboard",
 *   useSearchParams: () => new URLSearchParams(),
 * }));
 * ```
 */
export function createMockRouter(overrides?: Partial<MockRouter>): MockRouter {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(() => Promise.resolve()),
    pathname: "/",
    query: {},
    asPath: "/",
    basePath: "",
    locale: "en",
    locales: ["en", "fr", "ar"],
    defaultLocale: "en",
    isReady: true,
    isPreview: false,
    isLocaleDomain: false,
    route: "/",
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    beforePopState: vi.fn(),
    ...overrides,
  };
}

interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
  pathname: string;
  query: Record<string, string | string[]>;
  asPath: string;
  basePath: string;
  locale: string;
  locales: string[];
  defaultLocale: string;
  isReady: boolean;
  isPreview: boolean;
  isLocaleDomain: boolean;
  route: string;
  events: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
  isFallback: boolean;
  beforePopState: ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/**
 * Create a Date that is `n` units in the past from "now".
 * Useful for testing relative time formatters.
 */
export function dateAgo(
  amount: number,
  unit: "seconds" | "minutes" | "hours" | "days",
): Date {
  const ms = {
    seconds: 1_000,
    minutes: 60_000,
    hours: 3_600_000,
    days: 86_400_000,
  }[unit];

  return new Date(Date.now() - amount * ms);
}

/**
 * Generate a random UUID v4 string.
 * Useful when you need a unique ID that doesn't come from the factories.
 */
export function randomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}
