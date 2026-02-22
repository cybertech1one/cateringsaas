import { describe, expect, it } from "vitest";
import {
  batchGenerateDescriptions,
  batchTranslateMenu,
  detectAllergens,
  enhanceDescription,
  estimateNutrition,
  generateDishDescription,
  generateMenuScore,
  optimizeMenu,
  suggestCategory,
  suggestPricing,
  translateContent,
} from "~/server/ai/prompts";

/**
 * Additional integration tests for AI prompt template functions.
 * Focuses on edge cases: empty strings, very long inputs, special
 * characters, and structural correctness of the generated prompts.
 */

describe("AI prompt templates - edge cases", () => {
  // ── generateDishDescription edge cases ──────────────────────

  describe("generateDishDescription - edge cases", () => {
    it("should handle an empty dish name", () => {
      const prompt = generateDishDescription("");

      expect(typeof prompt).toBe("string");
      expect(prompt).toContain('""');
    });

    it("should handle a very long dish name (500 chars)", () => {
      const longName = "A".repeat(500);
      const prompt = generateDishDescription(longName);

      expect(prompt).toContain(longName);
    });

    it("should handle special characters in dish name", () => {
      const name = 'Tom & Jerry\'s "Special" <Burger>';
      const prompt = generateDishDescription(name);

      expect(prompt).toContain(name);
    });

    it("should handle unicode characters in dish name", () => {
      const name = "Pad Thai (fah thong)";
      const prompt = generateDishDescription(name);

      expect(prompt).toContain(name);
    });

    it("should include all three optional params when provided", () => {
      const prompt = generateDishDescription("Ramen", "Soups", "Japanese");

      expect(prompt).toContain("Ramen");
      expect(prompt).toContain("Soups");
      expect(prompt).toContain("Japanese");
    });

    it("should not contain language instruction when language is omitted", () => {
      const prompt = generateDishDescription("Salad");

      expect(prompt).not.toContain("Write in");
    });

    it("should not contain category context when category is omitted", () => {
      const prompt = generateDishDescription("Salad");

      expect(prompt).not.toContain("category");
    });
  });

  // ── translateContent edge cases ─────────────────────────────

  describe("translateContent - edge cases", () => {
    it("should handle empty text", () => {
      const prompt = translateContent("", "English", "French");

      expect(prompt).toContain("Text: ");
    });

    it("should handle very long text", () => {
      const longText = "word ".repeat(200);
      const prompt = translateContent(longText, "English", "German");

      expect(prompt).toContain(longText);
    });

    it("should handle text with newlines and special chars", () => {
      const text = "Line 1\nLine 2\n<script>alert('xss')</script>";
      const prompt = translateContent(text, "English", "Polish");

      expect(prompt).toContain(text);
    });

    it("should include both language names in the prompt", () => {
      const prompt = translateContent("Hello", "Mandarin", "Swahili");

      expect(prompt).toContain("Mandarin");
      expect(prompt).toContain("Swahili");
    });
  });

  // ── enhanceDescription edge cases ───────────────────────────

  describe("enhanceDescription - edge cases", () => {
    it("should handle an empty text input", () => {
      const prompt = enhanceDescription("");

      expect(prompt).toContain("Original: ");
    });

    it("should handle text with emoji", () => {
      const prompt = enhanceDescription("Great pizza! Best ever");

      expect(prompt).toContain("Great pizza");
    });

    it("should not mention a language when language is omitted", () => {
      const prompt = enhanceDescription("Some text");

      expect(prompt).not.toContain("Keep the text in");
    });

    it("should include language instruction when language is provided", () => {
      const prompt = enhanceDescription("Texto", "Spanish");

      expect(prompt).toContain("Keep the text in Spanish");
    });
  });

  // ── suggestCategory edge cases ──────────────────────────────

  describe("suggestCategory - edge cases", () => {
    it("should handle empty dish name", () => {
      const prompt = suggestCategory("", []);

      expect(typeof prompt).toBe("string");
      expect(prompt).toContain('""');
    });

    it("should handle very long list of existing categories", () => {
      const categories = Array.from({ length: 50 }, (_, i) => `Category ${i}`);
      const prompt = suggestCategory("Pizza", categories);

      expect(prompt).toContain("Category 0");
      expect(prompt).toContain("Category 49");
    });

    it("should handle categories with special characters", () => {
      const categories = ["Plats du jour", "Entrees & Sides", '"Specials"'];
      const prompt = suggestCategory("Dish", categories);

      for (const cat of categories) {
        expect(prompt).toContain(cat);
      }
    });

    it("should not include Existing categories line when array is empty", () => {
      const prompt = suggestCategory("Pizza", []);

      expect(prompt).not.toContain("Existing categories:");
    });

    it("should include Existing categories line when array has items", () => {
      const prompt = suggestCategory("Pizza", ["Mains"]);

      expect(prompt).toContain("Existing categories: Mains");
    });
  });

  // ── estimateNutrition edge cases ────────────────────────────

  describe("estimateNutrition - edge cases", () => {
    it("should handle empty dish name", () => {
      const prompt = estimateNutrition("");

      expect(prompt).toContain('""');
    });

    it("should not include Description line when description is omitted", () => {
      const prompt = estimateNutrition("Burger");

      expect(prompt).not.toContain("Description:");
    });

    it("should include Description line when description is provided", () => {
      const prompt = estimateNutrition("Burger", "Juicy beef patty");

      expect(prompt).toContain("Description: Juicy beef patty");
    });
  });

  // ── batchTranslateMenu edge cases ───────────────────────────

  describe("batchTranslateMenu - edge cases", () => {
    it("should handle an empty items array", () => {
      const prompt = batchTranslateMenu([], "English", "Spanish");

      expect(typeof prompt).toBe("string");
      expect(prompt).toContain("Items to translate:");
    });

    it("should handle items without descriptions", () => {
      const items = [{ name: "Soup" }, { name: "Bread" }];
      const prompt = batchTranslateMenu(items, "English", "French");

      expect(prompt).toContain("Soup");
      expect(prompt).toContain("Bread");
      // The individual item lines should not contain a description key
      // (the instructions/example section does mention "description", so
      // we verify the numbered item lines specifically)
      expect(prompt).toContain('{"name": "Soup"}');
      expect(prompt).toContain('{"name": "Bread"}');
    });

    it("should handle items with descriptions", () => {
      const items = [{ name: "Soup", description: "Creamy tomato" }];
      const prompt = batchTranslateMenu(items, "English", "French");

      expect(prompt).toContain("Creamy tomato");
    });

    it("should number items starting from 1", () => {
      const items = [{ name: "A" }, { name: "B" }, { name: "C" }];
      const prompt = batchTranslateMenu(items, "en", "fr");

      expect(prompt).toContain("1.");
      expect(prompt).toContain("2.");
      expect(prompt).toContain("3.");
    });
  });

  // ── optimizeMenu edge cases ─────────────────────────────────

  describe("optimizeMenu - edge cases", () => {
    it("should handle empty categories and dishes", () => {
      const prompt = optimizeMenu({ categories: [], dishes: [] });

      expect(prompt).toContain("No categories defined");
    });

    it("should format prices from cents to dollars correctly", () => {
      const prompt = optimizeMenu({
        categories: [],
        dishes: [{ name: "Tea", price: 299 }],
      });

      expect(prompt).toContain("$2.99");
    });

    it("should format whole-dollar prices correctly", () => {
      const prompt = optimizeMenu({
        categories: [],
        dishes: [{ name: "Coffee", price: 500 }],
      });

      expect(prompt).toContain("$5.00");
    });

    it("should handle dishes without descriptions", () => {
      const prompt = optimizeMenu({
        categories: ["Drinks"],
        dishes: [{ name: "Water", price: 100 }],
      });

      expect(prompt).toContain("Water");
      expect(prompt).toContain("$1.00");
    });
  });

  // ── detectAllergens edge cases ──────────────────────────────

  describe("detectAllergens - edge cases", () => {
    it("should handle empty dish name", () => {
      const prompt = detectAllergens("");

      expect(prompt).toContain('""');
    });

    it("should list all 14 common allergens", () => {
      const prompt = detectAllergens("Generic Dish");
      const expectedAllergens = [
        "gluten",
        "dairy",
        "eggs",
        "fish",
        "shellfish",
        "tree_nuts",
        "peanuts",
        "soy",
        "sesame",
        "celery",
        "mustard",
        "lupin",
        "mollusks",
        "sulfites",
      ];

      for (const allergen of expectedAllergens) {
        expect(prompt).toContain(allergen);
      }
    });

    it("should not include Description line when omitted", () => {
      const prompt = detectAllergens("Bread");

      expect(prompt).not.toContain("Description:");
    });
  });

  // ── suggestPricing edge cases ───────────────────────────────

  describe("suggestPricing - edge cases", () => {
    it("should handle empty dish name", () => {
      const prompt = suggestPricing("");

      expect(prompt).toContain('""');
    });

    it("should work with only dishName", () => {
      const prompt = suggestPricing("Steak");

      expect(prompt).toContain("Steak");
      expect(prompt).not.toContain("category");
      expect(prompt).not.toContain("cuisine");
    });

    it("should include category context when provided", () => {
      const prompt = suggestPricing("Steak", "Main Course");

      expect(prompt).toContain('"Main Course" category');
    });

    it("should include cuisine context when provided", () => {
      const prompt = suggestPricing("Sushi", undefined, "Japanese");

      expect(prompt).toContain("Japanese cuisine");
    });

    it("should include all context when all params are provided", () => {
      const prompt = suggestPricing("Tacos", "Appetizer", "Mexican");

      expect(prompt).toContain("Tacos");
      expect(prompt).toContain("Appetizer");
      expect(prompt).toContain("Mexican");
    });
  });

  // ── generateMenuScore edge cases ────────────────────────────

  describe("generateMenuScore - edge cases", () => {
    it("should show 'Yes' for true booleans and 'No' for false", () => {
      const prompt = generateMenuScore({
        totalDishes: 0,
        hasDescriptions: true,
        hasImages: false,
        hasAllergens: true,
        hasNutrition: false,
        languageCount: 1,
        categoryCount: 0,
      });

      // Two Yes (descriptions, allergens) and two No (images, nutrition)
      const yesCount = (prompt.match(/Yes/g) ?? []).length;
      const noCount = (prompt.match(/No/g) ?? []).length;

      expect(yesCount).toBe(2);
      expect(noCount).toBe(2);
    });

    it("should include total dishes count in the prompt", () => {
      const prompt = generateMenuScore({
        totalDishes: 42,
        hasDescriptions: false,
        hasImages: false,
        hasAllergens: false,
        hasNutrition: false,
        languageCount: 1,
        categoryCount: 1,
      });

      expect(prompt).toContain("42");
    });

    it("should handle zero values for all counts", () => {
      const prompt = generateMenuScore({
        totalDishes: 0,
        hasDescriptions: false,
        hasImages: false,
        hasAllergens: false,
        hasNutrition: false,
        languageCount: 0,
        categoryCount: 0,
      });

      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  // ── batchGenerateDescriptions edge cases ────────────────────

  describe("batchGenerateDescriptions - edge cases", () => {
    it("should handle an empty dishes array", () => {
      const prompt = batchGenerateDescriptions([]);

      expect(typeof prompt).toBe("string");
      expect(prompt).toContain("Dishes:");
    });

    it("should number dishes starting from 1", () => {
      const dishes = [{ name: "A" }, { name: "B" }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toContain("1. A");
      expect(prompt).toContain("2. B");
    });

    it("should include category in parentheses when provided", () => {
      const dishes = [{ name: "Ice Cream", category: "Desserts" }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toContain("(category: Desserts)");
    });

    it("should not include category parentheses when omitted", () => {
      const dishes = [{ name: "Bread" }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).not.toContain("(category:");
    });

    it("should include language instruction when provided", () => {
      const dishes = [{ name: "Croissant" }];
      const prompt = batchGenerateDescriptions(dishes, "French");

      expect(prompt).toContain("French");
    });

    it("should not include language instruction when omitted", () => {
      const dishes = [{ name: "Croissant" }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).not.toContain("Write all descriptions in");
    });

    it("should handle dishes with special characters", () => {
      const dishes = [{ name: 'Mac & Cheese "Deluxe"' }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toContain('Mac & Cheese "Deluxe"');
    });
  });
});
