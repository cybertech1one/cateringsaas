import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks - must be declared before component import
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: ((key: string, opts?: Record<string, unknown>) => {
      if (opts && Object.keys(opts).length > 0) {
        // Interpolate options into the key for readable assertions
        const parts = Object.entries(opts)
          .map(([k, v]) => `${k}:${v}`)
          .join(",");

        return `${key}{${parts}}`;
      }

      return key;
    }) as (key: string, opts?: Record<string, unknown>) => string,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

// Mutable cart state so each test can override values
const mockRemoveItem = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockUpdateNotes = vi.fn();
const mockClearCart = vi.fn();
const mockSetTableNumber = vi.fn();
const mockSetCustomerName = vi.fn();
const mockSetCustomerPhone = vi.fn();
const mockSetDeliveryAddress = vi.fn();
const mockSetOrderType = vi.fn();
const mockSetIsOpen = vi.fn();

let cartState: Record<string, unknown> = {};

function defaultCartState() {
  return {
    items: [],
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    updateNotes: mockUpdateNotes,
    clearCart: mockClearCart,
    totalItems: 0,
    totalPrice: 0,
    tableNumber: "",
    setTableNumber: mockSetTableNumber,
    customerName: "",
    setCustomerName: mockSetCustomerName,
    customerPhone: "",
    setCustomerPhone: mockSetCustomerPhone,
    deliveryAddress: "",
    setDeliveryAddress: mockSetDeliveryAddress,
    orderType: "dine_in" as const,
    setOrderType: mockSetOrderType,
    isOpen: true,
    setIsOpen: mockSetIsOpen,
    menuId: "menu-001",
    menuName: "Riad Marrakech",
    currency: "MAD",
    whatsappNumber: null,
    enabledOrderTypes: ["dine_in"],
    deliveryFee: 0,
    minOrderAmount: 0,
  };
}

vi.mock("../components/CartProvider", () => ({
  useCart: () => cartState,
}));

const mockMutate = vi.fn();
let mutationState = {
  mutate: mockMutate,
  isLoading: false,
  isError: false,
  error: null as { message: string } | null,
};

vi.mock("~/trpc/react", () => ({
  api: {
    orders: {
      createOrder: {
        useMutation: vi.fn(() => mutationState),
      },
    },
  },
}));

vi.mock("~/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({
    containerRef: { current: null },
    handleKeyDown: vi.fn(),
  }),
}));

vi.mock("../components/OrderConfirmation", () => ({
  OrderConfirmation: () =>
    React.createElement("div", { "data-testid": "order-confirmation" }, "Order confirmed"),
}));

vi.mock("../components/WhatsAppOrderButton", () => ({
  WhatsAppOrderButton: () =>
    React.createElement("div", { "data-testid": "whatsapp-button" }, "WhatsApp"),
}));

vi.mock("../components/OrderTypeSelector", () => ({
  OrderTypeSelector: () =>
    React.createElement("div", { "data-testid": "order-type-selector" }, "OrderTypeSelector"),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { CartDrawer } from "../components/CartDrawer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    dishId: "dish-1",
    name: "Lamb Tagine",
    price: 8500,
    quantity: 2,
    variantId: undefined,
    variantName: undefined,
    notes: undefined,
    ...overrides,
  };
}

function renderDrawer() {
  return render(<CartDrawer />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CartDrawer", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    cartState = defaultCartState();
    mutationState = {
      mutate: mockMutate,
      isLoading: false,
      isError: false,
      error: null,
    };
  });

  // ── 1. Does NOT render when isOpen is false ─────────────────────

  it("does not render when isOpen is false", () => {
    cartState = { ...defaultCartState(), isOpen: false };
    const { container } = renderDrawer();

    expect(container.innerHTML).toBe("");
  });

  // ── 2. Renders dialog with role="dialog" and aria-modal="true" ──

  it('renders dialog with role="dialog" and aria-modal="true" when open', () => {
    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items: [makeCartItem()],
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "ordering.cart");
  });

  // ── 3. Shows empty cart state with correct messaging ────────────

  it("shows empty cart state with correct messaging when cart has no items", () => {
    cartState = { ...defaultCartState(), isOpen: true, items: [], totalItems: 0 };
    renderDrawer();

    // The empty cart heading (h3) and description should be visible
    const emptyHeading = screen.getByRole("heading", { level: 3 });

    expect(emptyHeading.textContent).toBe("ordering.emptyCart");
    expect(screen.getByText("ordering.emptyCartDescription")).toBeInTheDocument();
  });

  // ── 4. Shows cart items with name, price, and quantity ──────────

  it("shows cart items with name, price, and quantity", () => {
    const items = [
      makeCartItem({ dishId: "dish-1", name: "Lamb Tagine", price: 8500, quantity: 2 }),
      makeCartItem({ dishId: "dish-2", name: "Couscous Royal", price: 12000, quantity: 1 }),
    ];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 3,
      totalPrice: 29000,
    };
    renderDrawer();

    // Item names
    expect(screen.getByText("Lamb Tagine")).toBeInTheDocument();
    expect(screen.getByText("Couscous Royal")).toBeInTheDocument();

    // Prices: 8500 -> "85.00", 12000 -> "120.00"
    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).toContain("85.00");
    expect(dialog.textContent).toContain("120.00");

    // Quantities displayed in the stepper span (aria-live="polite")
    const liveRegions = dialog.querySelectorAll('[aria-live="polite"]');
    const quantityTexts = Array.from(liveRegions).map((el) => el.textContent);

    expect(quantityTexts).toContain("2");
    expect(quantityTexts).toContain("1");
  });

  // ── 5. Increment/decrement buttons have correct aria-labels ─────

  it("increment/decrement buttons have correct i18n aria-labels", () => {
    const items = [makeCartItem({ dishId: "dish-1", name: "Lamb Tagine", price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    // Quantity > 1: decrease button shows "ariaDecreaseQuantity"
    const decreaseBtn = screen.getByLabelText("cart.ariaDecreaseQuantity{name:Lamb Tagine}");

    expect(decreaseBtn).toBeInTheDocument();

    // Increase button
    const increaseBtn = screen.getByLabelText("cart.ariaIncreaseQuantity{name:Lamb Tagine}");

    expect(increaseBtn).toBeInTheDocument();
  });

  it("shows remove aria-label when quantity is 1", () => {
    const items = [makeCartItem({ dishId: "dish-1", name: "Lamb Tagine", price: 8500, quantity: 1 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 1,
      totalPrice: 8500,
    };
    renderDrawer();

    // quantity <= 1: decrease button shows "ariaRemoveItem"
    const removeBtn = screen.getByLabelText("cart.ariaRemoveItem{name:Lamb Tagine}");

    expect(removeBtn).toBeInTheDocument();
  });

  // ── 6. Close button has aria-label ──────────────────────────────

  it("close button has correct aria-label", () => {
    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items: [makeCartItem()],
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const closeBtn = screen.getByLabelText("cart.ariaCloseCart");

    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn.tagName.toLowerCase()).toBe("button");
  });

  // ── 7. Shows delivery fee when order type is delivery ───────────

  it("shows delivery fee row when order type is delivery with fee > 0", () => {
    const items = [makeCartItem()];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      orderType: "delivery",
      deliveryFee: 1500,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    // Delivery fee label
    expect(dialog.textContent).toContain("cart.deliveryFee");

    // Delivery fee value: 1500 cents -> "15.00"
    expect(dialog.textContent).toContain("15.00");

    // Grand total should include delivery fee: 17000 + 1500 = 18500 -> "185.00"
    expect(dialog.textContent).toContain("185.00");
  });

  it("does not show delivery fee row when order type is dine_in", () => {
    const items = [makeCartItem()];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      orderType: "dine_in",
      deliveryFee: 1500,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).not.toContain("cart.deliveryFee");
  });

  // ── 8. Shows minimum order warning when below threshold ─────────

  it("shows minimum order warning when cart total is below minimum", () => {
    const items = [makeCartItem({ price: 2000, quantity: 1 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 1,
      totalPrice: 2000,
      minOrderAmount: 5000,
    };
    renderDrawer();

    // The warning should use role="alert"
    const alerts = screen.getAllByRole("alert");
    const minOrderAlert = alerts.find((a) =>
      a.textContent?.includes("ordering.minimumOrder"),
    );

    expect(minOrderAlert).toBeTruthy();

    // Should show the minimum order amount: 5000 -> "50.00"
    expect(minOrderAlert!.textContent).toContain("50.00");

    // Should show the remaining amount: 5000 - 2000 = 3000 -> "30.00"
    expect(minOrderAlert!.textContent).toContain("ordering.addMore");
    expect(minOrderAlert!.textContent).toContain("30.00");
  });

  it("does not show minimum order warning when above threshold", () => {
    const items = [makeCartItem({ price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      minOrderAmount: 5000,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).not.toContain("ordering.minimumOrder");
  });

  // ── 9. Submit button is disabled when below minimum order ───────

  it("submit button is disabled when below minimum order amount", () => {
    const items = [makeCartItem({ price: 2000, quantity: 1 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 1,
      totalPrice: 2000,
      minOrderAmount: 5000,
    };
    renderDrawer();

    const submitBtn = screen.getByRole("button", { name: "ordering.sendOrder" });

    expect(submitBtn).toBeDisabled();
  });

  it("submit button is enabled when above minimum order amount", () => {
    const items = [makeCartItem({ price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      minOrderAmount: 5000,
    };
    renderDrawer();

    const submitBtn = screen.getByRole("button", { name: "ordering.sendOrder" });

    expect(submitBtn).not.toBeDisabled();
  });

  // ── 10. ARIA live region shows cart summary text ─────────────────

  it("ARIA live region shows cart summary when items are present", () => {
    const items = [makeCartItem({ price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      currency: "MAD",
    };
    renderDrawer();

    // The sr-only div with aria-live="polite" and aria-atomic="true"
    const dialog = screen.getByRole("dialog");
    const liveRegion = dialog.querySelector('[aria-live="polite"][aria-atomic="true"]');

    expect(liveRegion).toBeTruthy();
    expect(liveRegion!.textContent).toContain("cart.ariaCartSummary");
  });

  it("ARIA live region shows empty cart message when cart is empty", () => {
    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");
    const liveRegion = dialog.querySelector('[aria-live="polite"][aria-atomic="true"]');

    expect(liveRegion).toBeTruthy();
    expect(liveRegion!.textContent).toContain("ordering.emptyCart");
  });

  // ── Additional coverage ─────────────────────────────────────────

  it("shows item count in header when totalItems > 0", () => {
    const items = [makeCartItem()];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 3,
      totalPrice: 25500,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    // t("ordering.items", { count: 3 }) => "ordering.items{count:3}"
    expect(dialog.textContent).toContain("ordering.items{count:3}");
  });

  it("renders cart title heading", () => {
    cartState = { ...defaultCartState(), isOpen: true };
    renderDrawer();

    // h2 with text "ordering.cart"
    const heading = screen.getByRole("heading", { level: 2 });

    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe("ordering.cart");
  });

  it("shows subtotal and total rows when items are present", () => {
    const items = [makeCartItem({ price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).toContain("ordering.subtotal");
    expect(dialog.textContent).toContain("ordering.total");
    // 17000 -> "170.00"
    expect(dialog.textContent).toContain("170.00");
  });

  it("shows variant name when item has variantName", () => {
    const items = [
      makeCartItem({
        dishId: "dish-1",
        name: "Tagine",
        variantId: "v-1",
        variantName: "Large",
        price: 9500,
        quantity: 1,
      }),
    ];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 1,
      totalPrice: 9500,
    };
    renderDrawer();

    expect(screen.getByText("Tagine")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
  });

  it("shows clear cart button when more than one item", () => {
    const items = [
      makeCartItem({ dishId: "dish-1", name: "Lamb Tagine" }),
      makeCartItem({ dishId: "dish-2", name: "Couscous" }),
    ];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 3,
      totalPrice: 17000,
    };
    renderDrawer();

    const clearBtn = screen.getByText("ordering.clearCart");

    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn.tagName.toLowerCase()).toBe("button");

    fireEvent.click(clearBtn);
    expect(mockClearCart).toHaveBeenCalledOnce();
  });

  it("does not show clear cart button when only one item", () => {
    const items = [makeCartItem()];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).not.toContain("ordering.clearCart");
  });

  it("increment button calls updateQuantity with quantity + 1", () => {
    const items = [makeCartItem({ dishId: "dish-1", name: "Lamb Tagine", price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const increaseBtn = screen.getByLabelText("cart.ariaIncreaseQuantity{name:Lamb Tagine}");

    fireEvent.click(increaseBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledWith("dish-1", 3, undefined);
  });

  it("decrement button calls updateQuantity with quantity - 1", () => {
    const items = [makeCartItem({ dishId: "dish-1", name: "Lamb Tagine", price: 8500, quantity: 2 })];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const decreaseBtn = screen.getByLabelText("cart.ariaDecreaseQuantity{name:Lamb Tagine}");

    fireEvent.click(decreaseBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledWith("dish-1", 1, undefined);
  });

  it("backdrop has aria-hidden='true'", () => {
    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items: [makeCartItem()],
      totalItems: 2,
      totalPrice: 17000,
    };
    renderDrawer();

    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;

    expect(backdrop).toBeTruthy();
  });

  it("does not show footer when cart is empty", () => {
    cartState = { ...defaultCartState(), isOpen: true, items: [], totalItems: 0 };
    renderDrawer();

    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).not.toContain("ordering.sendOrder");
    expect(dialog.textContent).not.toContain("ordering.subtotal");
  });

  it("shows WhatsApp button section when whatsappNumber is provided", () => {
    const items = [makeCartItem()];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      whatsappNumber: "+212600123456",
    };
    renderDrawer();

    // The "or via" divider text
    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).toContain("ordering.orVia");

    // Mocked WhatsApp button
    expect(screen.getByTestId("whatsapp-button")).toBeInTheDocument();
  });

  it("does not show WhatsApp section when whatsappNumber is null", () => {
    const items = [makeCartItem()];

    cartState = {
      ...defaultCartState(),
      isOpen: true,
      items,
      totalItems: 2,
      totalPrice: 17000,
      whatsappNumber: null,
    };
    renderDrawer();

    expect(screen.queryByTestId("whatsapp-button")).not.toBeInTheDocument();
  });
});
