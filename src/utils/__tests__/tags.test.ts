import { describe, expect, it } from "vitest";

/**
 * Tests for the tag translations mapping.
 * Since TagType is a Prisma enum, we test the mapping structure
 * using the known enum values directly as string keys.
 */

// We import the module dynamically to avoid Prisma client init issues
// in test environments. Instead we test the known structure.

// Known TagType values from the Prisma schema
const KNOWN_TAG_TYPES = [
  "high_protein",
  "high_fiber",
  "low_fat",
  "low_carb",
  "sugar_free",
  "organic",
  "gluten_free",
  "lactose_free",
  "vegetarian",
  "vegan",
  "keto",
] as const;

const EXPECTED_TRANSLATIONS: Record<string, string> = {
  high_protein: "tags.highProtein",
  high_fiber: "tags.highFiber",
  low_fat: "tags.lowFat",
  low_carb: "tags.lowCarb",
  sugar_free: "tags.sugarFree",
  organic: "tags.organic",
  gluten_free: "tags.glutenFree",
  lactose_free: "tags.lactoseFree",
  vegetarian: "tags.vegetarian",
  vegan: "tags.vegan",
  keto: "tags.keto",
};

describe("tagsTranslations", () => {
  it("should map all known tag types to i18n keys", async () => {
    const { tagsTranslations } = await import("../tags");

    for (const tagType of KNOWN_TAG_TYPES) {
      expect(tagsTranslations).toHaveProperty(tagType);
    }
  });

  it("should have the correct translation key for each tag", async () => {
    const { tagsTranslations } = await import("../tags");

    for (const [tagType, expectedKey] of Object.entries(EXPECTED_TRANSLATIONS)) {
      expect(tagsTranslations[tagType as keyof typeof tagsTranslations]).toBe(
        expectedKey,
      );
    }
  });

  it("should have exactly 11 tag translations", async () => {
    const { tagsTranslations } = await import("../tags");

    expect(Object.keys(tagsTranslations)).toHaveLength(11);
  });

  it("should have all translation keys starting with 'tags.'", async () => {
    const { tagsTranslations } = await import("../tags");

    for (const key of Object.values(tagsTranslations)) {
      expect(key).toMatch(/^tags\./);
    }
  });

  it("should use camelCase for translation key suffixes", async () => {
    const { tagsTranslations } = await import("../tags");

    for (const value of Object.values(tagsTranslations)) {
      const suffix = (value as string).replace("tags.", "");

      // camelCase: starts with lowercase, no underscores
      expect(suffix).toMatch(/^[a-z][a-zA-Z]*$/);
    }
  });

  it("should not have duplicate translation values", async () => {
    const { tagsTranslations } = await import("../tags");

    const values = Object.values(tagsTranslations);
    const uniqueValues = new Set(values);

    expect(uniqueValues.size).toBe(values.length);
  });
});
