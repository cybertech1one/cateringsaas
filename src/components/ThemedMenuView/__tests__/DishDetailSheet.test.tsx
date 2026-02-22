import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    React.createElement("img", {
      src: props.src as string,
      alt: props.alt as string,
      "data-testid": "next-image",
    }),
}));

vi.mock("~/utils/shimmer", () => ({
  shimmerToBase64: () => "data:image/svg+xml;base64,mock",
}));

vi.mock("~/utils/categoriesUtils", () => ({
  getDishVariantsTranslated: ({
    dishVariants,
  }: {
    dishVariants: Array<{
      id: string;
      price: number | null;
      variantTranslations: Array<{
        languageId: string;
        name: string;
        description: string | null;
      }>;
    }>;
    languageId: string;
  }) =>
    dishVariants.map((v) => ({
      id: v.id,
      price: v.price,
      name: v.variantTranslations[0]?.name ?? "",
      description: v.variantTranslations[0]?.description ?? null,
    })),
}));

const addItemMock = vi.fn();

vi.mock("../components/CartProvider", () => ({
  useCart: () => ({
    addItem: addItemMock,
    items: [],
    totalItems: 0,
    totalPrice: 0,
  }),
}));

import { DishDetailSheet } from "../components/DishDetailSheet";
import { type ParsedDish } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDish(overrides: Partial<ParsedDish> = {}): ParsedDish {
  return {
    id: "dish-1",
    name: "Lamb Tagine",
    description: "Slow-cooked with preserved lemons and olives",
    price: 8500,
    pictureUrl: null,
    isSoldOut: false,
    isFeatured: false,
    calories: 420,
    protein: 28,
    carbohydrates: 45,
    fats: 12,
    weight: 350,
    prepTimeMinutes: 25,
    sortOrder: 0,
    createdAt: new Date("2025-03-01"),
    menuId: "menu-1",
    categoryId: "cat-1",
    stockQuantity: null,
    lowStockThreshold: 5,
    trackInventory: false,
    kitchenStationId: null,
    dishesTranslation: [],
    dishVariants: [],
    dishesTag: [],
    languageId: "en",
    ...overrides,
  } as unknown as ParsedDish;
}

function renderSheet(
  dish: ParsedDish | null,
  { isOpen = true, currency = "MAD" } = {},
) {
  const onClose = vi.fn();

  const result = render(
    <DishDetailSheet
      dish={dish}
      isOpen={isOpen}
      onClose={onClose}
      currency={currency}
      languageId="en"
    />,
  );

  return { ...result, onClose };
}

/** Get the sheet element via data attribute (always unique) */
function getSheet(): HTMLElement {
  return document.querySelector("[data-dish-detail-sheet]") as HTMLElement;
}

/** Get the CTA section */
function getCTA(): HTMLElement | null {
  return document.querySelector("[data-dish-detail-cta]");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DishDetailSheet", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders dish name when open", () => {
    renderSheet(makeDish());
    const sheet = getSheet();

    expect(sheet).toBeTruthy();
    expect(sheet.textContent).toContain("Lamb Tagine");
  });

  it("renders dish price formatted from cents", () => {
    renderSheet(makeDish({ price: 8500 }));
    const sheet = getSheet();

    // 8500 cents -> "85.00"
    expect(sheet.textContent).toContain("85.00");
  });

  it("renders dish description when present", () => {
    renderSheet(makeDish());
    const sheet = getSheet();

    expect(sheet.textContent).toContain(
      "Slow-cooked with preserved lemons and olives",
    );
  });

  it("does not render description '-' as visible text paragraph", () => {
    renderSheet(makeDish({ description: "-" }));
    const sheet = getSheet();
    // Check that there's no <p> with just "-"
    const paragraphs = sheet.querySelectorAll("p");
    const hasHyphenParagraph = Array.from(paragraphs).some(
      (p) => p.textContent?.trim() === "-",
    );

    expect(hasHyphenParagraph).toBe(false);
  });

  it("shows sold out badge for sold-out dishes", () => {
    renderSheet(makeDish({ isSoldOut: true }));
    const sheet = getSheet();

    expect(sheet.textContent).toContain("publicMenu.soldOut");
  });

  it("hides add-to-cart CTA when sold out", () => {
    renderSheet(makeDish({ isSoldOut: true }));
    const cta = getCTA();

    expect(cta).toBeNull();
  });

  it("shows variant selector when dish has variants", () => {
    const dish = makeDish({
      dishVariants: [
        {
          id: "v1",
          price: 9500,
          variantTranslations: [
            { languageId: "en", name: "Large", description: null },
          ],
        },
        {
          id: "v2",
          price: 7500,
          variantTranslations: [
            { languageId: "en", name: "Small", description: null },
          ],
        },
      ] as ParsedDish["dishVariants"],
    });

    renderSheet(dish);
    const sheet = getSheet();

    expect(sheet.textContent).toContain(
      "publicMenu.dishDetail.selectVariant",
    );
    expect(sheet.textContent).toContain("Large");
    expect(sheet.textContent).toContain("Small");
  });

  it("updates displayed price when a different variant is selected", () => {
    const dish = makeDish({
      price: 8500,
      dishVariants: [
        {
          id: "v1",
          price: 9500,
          variantTranslations: [
            { languageId: "en", name: "Large", description: null },
          ],
        },
        {
          id: "v2",
          price: 7500,
          variantTranslations: [
            { languageId: "en", name: "Small", description: null },
          ],
        },
      ] as ParsedDish["dishVariants"],
    });

    renderSheet(dish);

    // Initially auto-selects first variant (Large, 95.00)
    let sheet = getSheet();

    expect(sheet.textContent).toContain("95.00");

    // Click "Small" variant button
    const smallBtn = screen.getByText("Small").closest("button")!;

    fireEvent.click(smallBtn);

    // Now 75.00 should be visible
    sheet = getSheet();
    expect(sheet.textContent).toContain("75.00");
  });

  it("quantity stepper shows decrease and increase buttons", () => {
    renderSheet(makeDish());
    const sheet = getSheet();
    const decreaseBtn = sheet.querySelector(
      '[aria-label="Decrease quantity"]',
    );
    const increaseBtn = sheet.querySelector(
      '[aria-label="Increase quantity"]',
    );

    expect(decreaseBtn).toBeTruthy();
    expect(increaseBtn).toBeTruthy();
  });

  it("increment button increases quantity", () => {
    renderSheet(makeDish());
    const sheet = getSheet();

    const increaseBtn = sheet.querySelector(
      '[aria-label="Increase quantity"]',
    ) as HTMLElement;

    fireEvent.click(increaseBtn);

    // The quantity span sits between the buttons
    const decreaseBtn = sheet.querySelector(
      '[aria-label="Decrease quantity"]',
    )!;
    const quantitySpan = decreaseBtn.nextElementSibling as HTMLElement;

    expect(quantitySpan.textContent).toBe("2");
  });

  it("decrement button is disabled at quantity 1", () => {
    renderSheet(makeDish());
    const sheet = getSheet();
    const decreaseBtn = sheet.querySelector(
      '[aria-label="Decrease quantity"]',
    ) as HTMLButtonElement;

    expect(decreaseBtn.disabled).toBe(true);
  });

  it("add to cart button calls addItem with correct dish data", () => {
    renderSheet(makeDish({ id: "dish-42", name: "Lamb Tagine", price: 8500 }));

    const cta = getCTA()!;
    const addBtn = cta.querySelector("button")!;

    fireEvent.click(addBtn);

    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dishId: "dish-42",
        name: "Lamb Tagine",
        price: 8500,
      }),
    );
  });

  it("add to cart calls addItem N times for quantity N", () => {
    renderSheet(makeDish());
    const sheet = getSheet();

    const increaseBtn = sheet.querySelector(
      '[aria-label="Increase quantity"]',
    ) as HTMLElement;

    fireEvent.click(increaseBtn); // -> 2
    fireEvent.click(increaseBtn); // -> 3

    const cta = getCTA()!;
    const addBtn = cta.querySelector("button")!;

    fireEvent.click(addBtn);

    expect(addItemMock).toHaveBeenCalledTimes(3);
  });

  it("close button exists and is clickable", () => {
    const { onClose: _onClose } = renderSheet(makeDish());
    const sheet = getSheet();

    const closeBtn = sheet.querySelector(
      '[aria-label="Close"]',
    ) as HTMLElement;

    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);

    // onClose is called after setTimeout(280ms) - we just verify the button exists
    // The actual close is async but the handler is wired up
  });

  it("backdrop overlay exists and is clickable", () => {
    renderSheet(makeDish());
    const backdrop = document.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;

    expect(backdrop).toBeTruthy();
    // backdrop has click handler via the component's onClick={handleClose}
  });

  it("shows allergen/tag badges", () => {
    const dish = makeDish({
      dishesTag: [
        { tagName: "gluten_free" },
        { tagName: "vegan" },
      ] as ParsedDish["dishesTag"],
    });

    renderSheet(dish);
    const sheet = getSheet();

    expect(sheet.textContent).toContain("gluten_free");
    expect(sheet.textContent).toContain("vegan");
  });

  it("shows nutrition section when macros are available", () => {
    renderSheet(
      makeDish({
        calories: 420,
        protein: 28,
        carbohydrates: 45,
        fats: 12,
      }),
    );

    const sheet = getSheet();

    expect(sheet.textContent).toContain(
      "publicMenu.dishDetail.nutrition",
    );
    expect(sheet.textContent).toContain("420");
    expect(sheet.textContent).toContain("28g");
    expect(sheet.textContent).toContain("45g");
    expect(sheet.textContent).toContain("12g");
  });

  it("hides nutrition section when all macros are zero", () => {
    renderSheet(
      makeDish({
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fats: 0,
      }),
    );

    const sheet = getSheet();

    expect(sheet.textContent).not.toContain(
      "publicMenu.dishDetail.nutrition",
    );
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = renderSheet(makeDish(), { isOpen: false });

    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when dish is null", () => {
    const { container } = renderSheet(null);

    expect(container.innerHTML).toBe("");
  });
});
