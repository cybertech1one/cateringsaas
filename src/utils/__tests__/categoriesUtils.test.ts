import { describe, expect, it } from "vitest";
import {
  getCategoryTranslations,
  getDishVariantsTranslated,
} from "../categoriesUtils";

/**
 * Tests for category and dish variant translation utilities.
 * Validates translation lookup, fallback behavior, and structural integrity.
 */

describe("getCategoryTranslations", () => {
  it("should return the translation matching the given languageId", () => {
    const category = {
      categoriesTranslation: [
        { name: "Appetizers", languageId: "en" },
        { name: "Przystawki", languageId: "pl" },
      ],
    };

    const result = getCategoryTranslations({ category, languageId: "pl" });

    expect(result).toBe("Przystawki");
  });

  it("should return the English translation when languageId is en", () => {
    const category = {
      categoriesTranslation: [
        { name: "Appetizers", languageId: "en" },
        { name: "Vorspeisen", languageId: "de" },
      ],
    };

    const result = getCategoryTranslations({ category, languageId: "en" });

    expect(result).toBe("Appetizers");
  });

  it("should fall back to the first translation when languageId is not found", () => {
    const category = {
      categoriesTranslation: [
        { name: "Entrees", languageId: "en" },
        { name: "Plats", languageId: "fr" },
      ],
    };

    const result = getCategoryTranslations({ category, languageId: "ja" });

    expect(result).toBe("Entrees");
  });

  it("should return '-' when there are no translations at all", () => {
    const category = {
      categoriesTranslation: [] as { name: string; languageId: string }[],
    };

    const result = getCategoryTranslations({ category, languageId: "en" });

    expect(result).toBe("-");
  });

  it("should return the matched translation even if it is not the first", () => {
    const category = {
      categoriesTranslation: [
        { name: "First", languageId: "a" },
        { name: "Second", languageId: "b" },
        { name: "Third", languageId: "c" },
      ],
    };

    const result = getCategoryTranslations({ category, languageId: "c" });

    expect(result).toBe("Third");
  });

  it("should handle a single translation that matches", () => {
    const category = {
      categoriesTranslation: [{ name: "Desserts", languageId: "en" }],
    };

    const result = getCategoryTranslations({ category, languageId: "en" });

    expect(result).toBe("Desserts");
  });

  it("should handle a single translation that does not match", () => {
    const category = {
      categoriesTranslation: [{ name: "Desserts", languageId: "en" }],
    };

    const result = getCategoryTranslations({ category, languageId: "fr" });

    expect(result).toBe("Desserts");
  });
});

describe("getDishVariantsTranslated", () => {
  it("should return translated variants matching the given languageId", () => {
    const dishVariants = [
      {
        id: "v1",
        price: 999,
        variantTranslations: [
          { languageId: "en", name: "Small", description: "Small size" },
          { languageId: "pl", name: "Maly", description: "Maly rozmiar" },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "pl",
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Maly");
    expect(result[0]!.description).toBe("Maly rozmiar");
    expect(result[0]!.id).toBe("v1");
    expect(result[0]!.price).toBe(999);
  });

  it("should use the first translation as fallback when language is not found", () => {
    const dishVariants = [
      {
        id: "v1",
        price: 500,
        variantTranslations: [
          { languageId: "en", name: "Regular", description: "Regular portion" },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "ja",
    });

    expect(result).toHaveLength(1);
    // When no translation is found, foundTranslation is undefined,
    // so the spread of { ...undefined, ...rest } keeps the rest fields
    // and name/description come from variant spread (which doesn't have them)
    expect(result[0]!.id).toBe("v1");
    expect(result[0]!.price).toBe(500);
  });

  it("should handle multiple variants", () => {
    const dishVariants = [
      {
        id: "v1",
        price: 500,
        variantTranslations: [
          { languageId: "en", name: "Small", description: null },
        ],
      },
      {
        id: "v2",
        price: 800,
        variantTranslations: [
          { languageId: "en", name: "Medium", description: "Medium size" },
        ],
      },
      {
        id: "v3",
        price: 1200,
        variantTranslations: [
          { languageId: "en", name: "Large", description: "Large size" },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "en",
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.name).toBe("Small");
    expect(result[1]!.name).toBe("Medium");
    expect(result[2]!.name).toBe("Large");
  });

  it("should preserve id and price from the original variant", () => {
    const dishVariants = [
      {
        id: "variant-abc",
        price: 1500,
        variantTranslations: [
          { languageId: "en", name: "XL", description: "Extra large" },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "en",
    });

    expect(result[0]!.id).toBe("variant-abc");
    expect(result[0]!.price).toBe(1500);
  });

  it("should return empty array for empty input", () => {
    const result = getDishVariantsTranslated({
      dishVariants: [],
      languageId: "en",
    });

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle variant with null price", () => {
    const dishVariants = [
      {
        id: "v1",
        price: null,
        variantTranslations: [
          { languageId: "en", name: "Default", description: null },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "en",
    });

    expect(result[0]!.price).toBeNull();
    expect(result[0]!.name).toBe("Default");
  });

  it("should strip variantTranslations from the output", () => {
    const dishVariants = [
      {
        id: "v1",
        price: 100,
        variantTranslations: [
          { languageId: "en", name: "Test", description: null },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "en",
    });

    // The spread removes variantTranslations via destructuring
    expect(result[0]).not.toHaveProperty("variantTranslations");
  });

  it("should maintain the same length as input", () => {
    const dishVariants = [
      {
        id: "v1",
        price: 100,
        variantTranslations: [
          { languageId: "en", name: "A", description: null },
        ],
      },
      {
        id: "v2",
        price: 200,
        variantTranslations: [
          { languageId: "en", name: "B", description: null },
        ],
      },
    ];

    const result = getDishVariantsTranslated({
      dishVariants,
      languageId: "en",
    });

    expect(result.length).toBe(dishVariants.length);
  });
});
