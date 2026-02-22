import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks - must be declared before component import
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: ((key: string) => key) as (key: string) => string,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { OrderTypeSelector } from "../components/OrderTypeSelector";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_TYPES = ["dine_in", "pickup", "delivery"];

function renderSelector(overrides: Partial<{
  enabledTypes: string[];
  selected: string;
  onSelect: (type: string) => void;
}> = {}) {
  const props = {
    enabledTypes: overrides.enabledTypes ?? ALL_TYPES,
    selected: overrides.selected ?? "dine_in",
    onSelect: overrides.onSelect ?? vi.fn(),
  };

  return render(
    <OrderTypeSelector
      enabledTypes={props.enabledTypes}
      selected={props.selected}
      onSelect={props.onSelect}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OrderTypeSelector", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── 1. Renders all enabled order type buttons ───────────────────

  it("renders a radio button for each enabled order type", () => {
    renderSelector({ enabledTypes: ALL_TYPES });

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(3);

    // Each button label is the translation key echoed back by the mock
    expect(screen.getByText("orderTracking.orderType.dine_in")).toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.pickup")).toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.delivery")).toBeInTheDocument();
  });

  it("wraps buttons in a radiogroup with correct aria-label", () => {
    renderSelector();

    const group = screen.getByRole("radiogroup");

    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("aria-label", "orderTracking.orderType.label");
  });

  // ── 2. Only renders buttons for enabled types ───────────────────

  it("only renders buttons for the types present in enabledTypes", () => {
    renderSelector({ enabledTypes: ["dine_in", "pickup"] });

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(2);

    expect(screen.getByText("orderTracking.orderType.dine_in")).toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.pickup")).toBeInTheDocument();
    expect(screen.queryByText("orderTracking.orderType.delivery")).not.toBeInTheDocument();
  });

  it("renders only pickup and delivery when dine_in is not enabled", () => {
    renderSelector({ enabledTypes: ["pickup", "delivery"] });

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(2);

    expect(screen.queryByText("orderTracking.orderType.dine_in")).not.toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.pickup")).toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.delivery")).toBeInTheDocument();
  });

  // ── 3. Selected type has correct aria-checked treatment ─────────

  it("marks the selected type with aria-checked='true' and others with 'false'", () => {
    renderSelector({ enabledTypes: ALL_TYPES, selected: "pickup" });

    const radios = screen.getAllByRole("radio");

    const dineIn = radios.find((r) => r.textContent === "orderTracking.orderType.dine_in")!;
    const pickup = radios.find((r) => r.textContent === "orderTracking.orderType.pickup")!;
    const delivery = radios.find((r) => r.textContent === "orderTracking.orderType.delivery")!;

    expect(dineIn).toHaveAttribute("aria-checked", "false");
    expect(pickup).toHaveAttribute("aria-checked", "true");
    expect(delivery).toHaveAttribute("aria-checked", "false");
  });

  it("selected button has font-weight 600 via inline style", () => {
    renderSelector({ enabledTypes: ALL_TYPES, selected: "delivery" });

    const radios = screen.getAllByRole("radio");
    const delivery = radios.find((r) => r.textContent === "orderTracking.orderType.delivery")!;
    const dineIn = radios.find((r) => r.textContent === "orderTracking.orderType.dine_in")!;

    expect(delivery.style.fontWeight).toBe("600");
    expect(dineIn.style.fontWeight).toBe("500");
  });

  // ── 4. Clicking a type calls onSelect with correct value ────────

  it("calls onSelect with 'pickup' when pickup button is clicked", () => {
    const onSelect = vi.fn();

    renderSelector({ enabledTypes: ALL_TYPES, selected: "dine_in", onSelect });

    const pickupBtn = screen.getByText("orderTracking.orderType.pickup");

    fireEvent.click(pickupBtn);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("pickup");
  });

  it("calls onSelect with 'delivery' when delivery button is clicked", () => {
    const onSelect = vi.fn();

    renderSelector({ enabledTypes: ALL_TYPES, selected: "dine_in", onSelect });

    const deliveryBtn = screen.getByText("orderTracking.orderType.delivery");

    fireEvent.click(deliveryBtn);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("delivery");
  });

  it("calls onSelect with 'dine_in' when dine-in button is clicked", () => {
    const onSelect = vi.fn();

    renderSelector({ enabledTypes: ALL_TYPES, selected: "pickup", onSelect });

    const dineInBtn = screen.getByText("orderTracking.orderType.dine_in");

    fireEvent.click(dineInBtn);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("dine_in");
  });

  it("calls onSelect even when clicking the already-selected type", () => {
    const onSelect = vi.fn();

    renderSelector({ enabledTypes: ALL_TYPES, selected: "dine_in", onSelect });

    const dineInBtn = screen.getByText("orderTracking.orderType.dine_in");

    fireEvent.click(dineInBtn);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("dine_in");
  });

  // ── 5. Shows correct i18n labels for each type ──────────────────

  it("uses translation keys from ORDER_TYPE_LABELS mapping", () => {
    renderSelector({ enabledTypes: ALL_TYPES });

    // The mock t() returns keys verbatim, so we can verify the correct keys
    expect(screen.getByText("orderTracking.orderType.dine_in")).toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.pickup")).toBeInTheDocument();
    expect(screen.getByText("orderTracking.orderType.delivery")).toBeInTheDocument();
  });

  it("falls back to raw type string for unknown order types", () => {
    renderSelector({ enabledTypes: ["dine_in", "catering"], selected: "dine_in" });

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(2);

    // "catering" has no entry in ORDER_TYPE_LABELS, so labelKey becomes "catering"
    // and t("catering") returns "catering" via the mock
    expect(screen.getByText("catering")).toBeInTheDocument();
  });

  // ── 6. Renders nothing for empty enabledTypes array ─────────────

  it("renders nothing when enabledTypes is empty", () => {
    const { container } = renderSelector({ enabledTypes: [] });

    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  // ── 7. Single enabled type returns null ─────────────────────────

  it("renders nothing when only one type is enabled", () => {
    const { container } = renderSelector({ enabledTypes: ["dine_in"] });

    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("renders nothing when enabledTypes has exactly one entry (pickup)", () => {
    const { container } = renderSelector({ enabledTypes: ["pickup"] });

    expect(container.innerHTML).toBe("");
  });

  // ── Additional coverage ─────────────────────────────────────────

  it("all buttons have type='button' to prevent form submission", () => {
    renderSelector({ enabledTypes: ALL_TYPES });

    const radios = screen.getAllByRole("radio");

    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("type", "button");
    });
  });

  it("renders with two enabled types", () => {
    renderSelector({ enabledTypes: ["dine_in", "delivery"], selected: "delivery" });

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(2);

    const dineIn = radios.find((r) => r.textContent === "orderTracking.orderType.dine_in")!;
    const delivery = radios.find((r) => r.textContent === "orderTracking.orderType.delivery")!;

    expect(dineIn).toHaveAttribute("aria-checked", "false");
    expect(delivery).toHaveAttribute("aria-checked", "true");
  });

  it("does not call onSelect on render", () => {
    const onSelect = vi.fn();

    renderSelector({ enabledTypes: ALL_TYPES, onSelect });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
