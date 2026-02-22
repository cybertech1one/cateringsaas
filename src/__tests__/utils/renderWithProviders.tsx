/**
 * Custom render function that wraps components with all providers needed
 * for testing FeastQR React components.
 *
 * Includes:
 *  - i18next (initialised synchronously with English translations)
 *  - React Query (QueryClientProvider with short staleTime)
 *  - ThemeProvider (forced to "light", matching production)
 *
 * tRPC is intentionally NOT wrapped here. Components that call tRPC hooks
 * should mock `~/trpc/react` at the module level via `vi.mock()` in the
 * individual test file, because tRPC client setup requires network config
 * that is not meaningful in unit tests.
 */

import React from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import messagesEn from "~/i18n/locales/en/common";

// ---------------------------------------------------------------------------
// Test-only i18next instance (synchronous, English only)
// ---------------------------------------------------------------------------

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["common"],
  defaultNS: "common",
  resources: {
    en: {
      common: messagesEn,
    },
  },
  interpolation: {
    escapeValue: false, // React already escapes
  },
  // Disable suspense in tests
  react: {
    useSuspense: false,
  },
});

// ---------------------------------------------------------------------------
// QueryClient factory (fresh per test to avoid leaking state)
// ---------------------------------------------------------------------------

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// AllProviders wrapper
// ---------------------------------------------------------------------------

interface ProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function AllProviders({ children, queryClient }: ProvidersProps) {
  const client = queryClient ?? createTestQueryClient();

  return (
    <I18nextProvider i18n={testI18n}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </I18nextProvider>
  );
}

// ---------------------------------------------------------------------------
// Custom render
// ---------------------------------------------------------------------------

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /** Supply a pre-configured QueryClient (e.g. with seeded cache) */
  queryClient?: QueryClient;
}

/**
 * Render a React element wrapped in all application providers.
 *
 * @example
 * ```ts
 * const { getByText } = renderWithProviders(<Dashboard />);
 * expect(getByText("Dashboard")).toBeInTheDocument();
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions,
): RenderResult {
  const { queryClient, ...renderOptions } = options ?? {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Re-export the test-only i18n instance so tests can inspect or change
 * language without side-effecting the global singleton.
 */
export { testI18n, createTestQueryClient };
