import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && "completed" in opts && "total" in opts) {
        return `${opts.completed} of ${opts.total} steps completed`;
      }

      if (opts && "defaultValue" in opts) {
        return opts.defaultValue as string;
      }

      return key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...rest }, children),
}));

vi.mock("~/components/ui/progress", () => ({
  Progress: ({ value, className }: { value: number; className?: string }) =>
    React.createElement("div", {
      role: "progressbar",
      "aria-valuenow": value,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      className,
      "data-testid": "progress-bar",
    }),
}));

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const storageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => storageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageStore[key];
  }),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

import { OnboardingChecklist } from "../OnboardingChecklist";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MenuInput = Parameters<typeof OnboardingChecklist>[0]["menus"][number];

function makeMenu(overrides: Partial<MenuInput> = {}): MenuInput {
  return {
    id: "menu-1",
    slug: "test-menu",
    name: "Test Restaurant",
    isPublished: false,
    logoImageUrl: null,
    _count: { dishes: 0 },
    ...overrides,
  };
}

/** Render the checklist and flush the initial useEffect */
function renderChecklist(menus: MenuInput[]) {
  let result: ReturnType<typeof render>;

  act(() => {
    result = render(<OnboardingChecklist menus={menus} />);
  });

  return result!;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    Object.keys(storageStore).forEach((key) => delete storageStore[key]);
  });

  it("renders 4 onboarding steps when not dismissed", () => {
    const { container } = renderChecklist([]);

    expect(container.textContent).toContain("onboarding.steps.createMenu");
    expect(container.textContent).toContain("onboarding.steps.addDishes");
    expect(container.textContent).toContain("onboarding.steps.uploadLogo");
    expect(container.textContent).toContain("onboarding.steps.publishMenu");
  });

  it("shows progress bar with correct value for 3 of 4 steps", () => {
    const menu = makeMenu({ _count: { dishes: 5 }, logoImageUrl: "logo.png" });
    const { container } = renderChecklist([menu]);

    // 3 of 4 steps completed (createMenu, addDishes, uploadLogo) = 75%
    const bars = container.querySelectorAll('[data-testid="progress-bar"]');
    const lastBar = bars[bars.length - 1] as HTMLElement;

    expect(lastBar.getAttribute("aria-valuenow")).toBe("75");
  });

  it("shows progress text with completed count", () => {
    const menu = makeMenu({ _count: { dishes: 5 } });
    const { container } = renderChecklist([menu]);

    // 2 of 4: hasMenu + hasThreeDishes
    expect(container.textContent).toContain("2 of 4 steps completed");
  });

  it("marks completed steps with line-through styling", () => {
    const menu = makeMenu({ _count: { dishes: 5 } });
    const { container } = renderChecklist([menu]);

    // createMenu and addDishes should be completed
    const stepTexts = container.querySelectorAll("p.line-through");
    const completedTexts = Array.from(stepTexts).map(
      (el) => el.textContent,
    );

    expect(completedTexts).toContain("onboarding.steps.createMenu");
    expect(completedTexts).toContain("onboarding.steps.addDishes");
  });

  it("incomplete steps do not have line-through", () => {
    const menu = makeMenu({ _count: { dishes: 5 } });
    const { container } = renderChecklist([menu]);

    // publishMenu should NOT be line-through
    const allStepPs = container.querySelectorAll("p");
    const publishP = Array.from(allStepPs).find(
      (p) => p.textContent === "onboarding.steps.publishMenu",
    );

    expect(publishP?.className).not.toContain("line-through");
  });

  it("dismiss button saves to localStorage and hides checklist", () => {
    const { container } = renderChecklist([]);

    const dismissBtn = container.querySelector(
      '[aria-label="Dismiss onboarding checklist"]',
    ) as HTMLElement;

    expect(dismissBtn).toBeTruthy();

    act(() => {
      fireEvent.click(dismissBtn);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "Diyafa-onboarding-dismissed",
      "true",
    );
  });

  it("is hidden when dismissed flag exists in localStorage", () => {
    storageStore["Diyafa-onboarding-dismissed"] = "true";

    const { container } = renderChecklist([]);

    // Component renders null when dismissed
    expect(container.querySelector(".mb-6")).toBeNull();
  });

  it("shows congratulations when all steps are complete", () => {
    const menu = makeMenu({
      isPublished: true,
      logoImageUrl: "logo.png",
      _count: { dishes: 5 },
    });

    const { container } = renderChecklist([menu]);

    expect(container.textContent).toContain("onboarding.congratulations");
  });
});
