import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  act,
  renderHook,
} from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("~/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({
    containerRef: { current: null },
    handleKeyDown: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { CookieConsent } from "../CookieConsent";
import { useCookieConsent } from "../useCookieConsent";

// ---------------------------------------------------------------------------
// CookieConsent Component Tests
// ---------------------------------------------------------------------------

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not show banner initially before delay", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    expect(screen.queryByRole("dialog")).toBeNull();

    vi.useRealTimers();
  });

  it("shows banner after 1000ms timeout", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const banner = screen.getByRole("dialog");

    expect(banner).toBeTruthy();
    expect(screen.getByText("cookieConsent.title")).toBeTruthy();

    vi.useRealTimers();
  });

  it("does not show banner when consent already stored with current version", () => {
    vi.useFakeTimers();

    localStorageMock.setItem(
      "feastqr_cookie_consent",
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: false,
        version: 1,
      }),
    );
    localStorageMock.setItem("feastqr_consent_version", "1");

    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("dialog")).toBeNull();

    vi.useRealTimers();
  });

  it("shows banner when stored version is outdated", () => {
    vi.useFakeTimers();

    localStorageMock.setItem(
      "feastqr_cookie_consent",
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        version: 0,
      }),
    );
    localStorageMock.setItem("feastqr_consent_version", "0");

    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("dialog")).toBeTruthy();

    vi.useRealTimers();
  });

  it("Accept All saves correct consent state and hides banner", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const acceptBtn = screen.getByText("cookieConsent.acceptAll");

    fireEvent.click(acceptBtn);

    const savedConsent = JSON.parse(
      localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0] === "feastqr_cookie_consent",
      )![1],
    );

    expect(savedConsent).toEqual({
      essential: true,
      analytics: true,
      marketing: true,
      version: 1,
    });

    expect(screen.queryByRole("dialog")).toBeNull();

    vi.useRealTimers();
  });

  it("Manage Preferences opens modal", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const manageBtn = screen.getByText("cookieConsent.managePreferences");

    fireEvent.click(manageBtn);

    const dialogs = screen.getAllByRole("dialog");
    const modal = dialogs.find(
      (d) =>
        d.getAttribute("aria-label") === "cookieConsent.preferencesTitle",
    );

    expect(modal).toBeTruthy();

    vi.useRealTimers();
  });

  it("modal has analytics and marketing toggles", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByText("cookieConsent.managePreferences"));

    const analyticsSwitch = screen.getByRole("switch", {
      name: "cookieConsent.analytics",
    });
    const marketingSwitch = screen.getByRole("switch", {
      name: "cookieConsent.marketing",
    });

    expect(analyticsSwitch).toBeTruthy();
    expect(marketingSwitch).toBeTruthy();

    vi.useRealTimers();
  });

  it("analytics toggle can be toggled on and off", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByText("cookieConsent.managePreferences"));

    const analyticsSwitch = screen.getByRole("switch", {
      name: "cookieConsent.analytics",
    });

    expect(analyticsSwitch.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(analyticsSwitch);
    expect(analyticsSwitch.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(analyticsSwitch);
    expect(analyticsSwitch.getAttribute("aria-checked")).toBe("false");

    vi.useRealTimers();
  });

  it("Save Preferences saves current toggle state", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByText("cookieConsent.managePreferences"));

    // Toggle analytics ON, leave marketing OFF
    const analyticsSwitch = screen.getByRole("switch", {
      name: "cookieConsent.analytics",
    });

    fireEvent.click(analyticsSwitch);

    const saveBtn = screen.getByText("cookieConsent.savePreferences");

    fireEvent.click(saveBtn);

    const savedConsent = JSON.parse(
      localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0] === "feastqr_cookie_consent",
      )![1],
    );

    expect(savedConsent).toEqual({
      essential: true,
      analytics: true,
      marketing: false,
      version: 1,
    });

    expect(screen.queryByRole("dialog")).toBeNull();

    vi.useRealTimers();
  });

  it("banner uses role='dialog' and aria-label", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const banner = screen.getByRole("dialog");

    expect(banner.getAttribute("aria-label")).toBe("cookieConsent.title");

    vi.useRealTimers();
  });

  it("modal uses aria-modal='true'", () => {
    vi.useFakeTimers();
    render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByText("cookieConsent.managePreferences"));

    const dialogs = screen.getAllByRole("dialog");
    const modal = dialogs.find(
      (d) => d.getAttribute("aria-modal") === "true",
    );

    expect(modal).toBeTruthy();
    expect(modal!.getAttribute("aria-label")).toBe(
      "cookieConsent.preferencesTitle",
    );

    vi.useRealTimers();
  });

  it("returns null when no banner or modal to show", () => {
    vi.useFakeTimers();

    localStorageMock.setItem(
      "feastqr_cookie_consent",
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        version: 1,
      }),
    );
    localStorageMock.setItem("feastqr_consent_version", "1");

    const { container } = render(<CookieConsent />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(container.innerHTML).toBe("");

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// useCookieConsent Hook Tests
// ---------------------------------------------------------------------------

describe("useCookieConsent", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns null when no consent in localStorage", () => {
    const { result } = renderHook(() => useCookieConsent());

    expect(result.current).toBeNull();
  });

  it("returns consent state when valid consent stored", () => {
    const consent = {
      essential: true as const,
      analytics: true,
      marketing: false,
      version: 1,
    };

    localStorageMock.setItem(
      "feastqr_cookie_consent",
      JSON.stringify(consent),
    );
    localStorageMock.setItem("feastqr_consent_version", "1");

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current).toEqual(consent);
  });

  it("returns null when stored version does not match current", () => {
    localStorageMock.setItem(
      "feastqr_cookie_consent",
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        version: 0,
      }),
    );
    localStorageMock.setItem("feastqr_consent_version", "0");

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current).toBeNull();
  });

  it("returns null when localStorage throws", () => {
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error("localStorage unavailable");
    });

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current).toBeNull();
  });

  it("returns null when only consent key stored but no version key", () => {
    localStorageMock.setItem(
      "feastqr_cookie_consent",
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        version: 1,
      }),
    );

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current).toBeNull();
  });
});
