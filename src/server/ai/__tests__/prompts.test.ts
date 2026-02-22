import { describe, expect, it } from "vitest";
import {
  batchGenerateDescriptions,
  batchTranslateMenu,
  detectAllergens,
  enhanceDescription,
  estimateNutrition,
  generateDescriptionSuggestions,
  generateDishDescription,
  generateMenuScore,
  optimizeMenu,
  suggestCategory,
  suggestPricing,
  translateContent,
} from "../prompts";

/**
 * Tests for AI prompt generation functions.
 * Validates that all prompts return non-empty strings and include
 * expected context information.
 */

describe("AI prompts", () => {
  describe("generateDishDescription", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = generateDishDescription("Margherita Pizza");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });

    it("should include the dish name in the prompt", () => {
      const dishName = "Caesar Salad";
      const prompt = generateDishDescription(dishName);

      expect(prompt).toContain(dishName);
    });

    it("should include category when provided", () => {
      const prompt = generateDishDescription("Tiramisu", "Desserts");

      expect(prompt).toContain("Desserts");
      expect(prompt).toContain("category");
    });

    it("should include language instruction when provided", () => {
      const prompt = generateDishDescription("Pizza", "Main Course", "Spanish");

      expect(prompt).toContain("Spanish");
    });

    it("should work without optional parameters", () => {
      const prompt = generateDishDescription("Burger");

      expect(prompt).toContain("Burger");
      expect(prompt).toContain("description");
    });

    it("should specify character limit", () => {
      const prompt = generateDishDescription("Pasta");

      expect(prompt).toContain("150 characters");
    });

    it("should include cuisine type when provided", () => {
      const prompt = generateDishDescription("Tagine", "Main Course", "French", "Moroccan");

      expect(prompt).toContain("Moroccan");
      expect(prompt).toContain("cuisine");
    });

    it("should work without cuisine type", () => {
      const prompt = generateDishDescription("Burger", "Mains", "English");

      expect(prompt).toContain("Burger");
      expect(prompt).not.toContain("cuisine");
    });
  });

  describe("generateDescriptionSuggestions", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = generateDescriptionSuggestions("Couscous Royal");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });

    it("should include the dish name", () => {
      const dishName = "Lamb Tagine";
      const prompt = generateDescriptionSuggestions(dishName);

      expect(prompt).toContain(dishName);
    });

    it("should request exactly 3 descriptions", () => {
      const prompt = generateDescriptionSuggestions("Pizza");

      expect(prompt).toContain("3 different");
    });

    it("should include category when provided", () => {
      const prompt = generateDescriptionSuggestions("Hummus", "Appetizers");

      expect(prompt).toContain("Appetizers");
      expect(prompt).toContain("category");
    });

    it("should include cuisine type when provided", () => {
      const prompt = generateDescriptionSuggestions("Sushi", undefined, "Japanese");

      expect(prompt).toContain("Japanese");
      expect(prompt).toContain("cuisine");
    });

    it("should include language when provided", () => {
      const prompt = generateDescriptionSuggestions("Crepe", undefined, undefined, "French");

      expect(prompt).toContain("French");
    });

    it("should request JSON array output", () => {
      const prompt = generateDescriptionSuggestions("Dish");

      expect(prompt).toContain("JSON array");
    });

    it("should describe three different tones", () => {
      const prompt = generateDescriptionSuggestions("Dish");

      expect(prompt.toLowerCase()).toContain("classic");
      expect(prompt.toLowerCase()).toContain("modern");
      expect(prompt.toLowerCase()).toContain("concise");
    });
  });

  describe("translateContent", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = translateContent("Hello", "English", "Spanish");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include from language in prompt", () => {
      const prompt = translateContent("Text", "English", "French");

      expect(prompt).toContain("English");
    });

    it("should include to language in prompt", () => {
      const prompt = translateContent("Text", "English", "French");

      expect(prompt).toContain("French");
    });

    it("should include the text to translate", () => {
      const text = "Delicious pasta with tomato sauce";
      const prompt = translateContent(text, "English", "Italian");

      expect(prompt).toContain(text);
    });

    it("should mention restaurant menu context", () => {
      const prompt = translateContent("Text", "English", "German");

      expect(prompt).toContain("restaurant menu");
    });
  });

  describe("enhanceDescription", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = enhanceDescription("Good food");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include the text to enhance", () => {
      const text = "Simple burger";
      const prompt = enhanceDescription(text);

      expect(prompt).toContain(text);
    });

    it("should include language instruction when provided", () => {
      const prompt = enhanceDescription("Good pizza", "Italian");

      expect(prompt).toContain("Italian");
    });

    it("should mention character limit", () => {
      const prompt = enhanceDescription("Text");

      expect(prompt).toContain("150 characters");
    });

    it("should work without language parameter", () => {
      const prompt = enhanceDescription("Original text");

      expect(prompt).toContain("Original text");
      expect(prompt).toContain("enhance");
    });
  });

  describe("suggestCategory", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = suggestCategory("Pizza", []);

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include the dish name", () => {
      const dishName = "Spaghetti Carbonara";
      const prompt = suggestCategory(dishName, []);

      expect(prompt).toContain(dishName);
    });

    it("should include existing categories when provided", () => {
      const categories = ["Appetizers", "Main Course", "Desserts"];
      const prompt = suggestCategory("Salad", categories);

      expect(prompt).toContain("Appetizers");
      expect(prompt).toContain("Main Course");
      expect(prompt).toContain("Desserts");
    });

    it("should work with empty categories array", () => {
      const prompt = suggestCategory("Burger", []);

      expect(prompt).toContain("Burger");
      expect(prompt.toLowerCase()).toContain("category");
    });

    it("should ask for category name in response", () => {
      const prompt = suggestCategory("Fish", ["Seafood"]);

      expect(prompt).toContain("category name");
    });
  });

  describe("estimateNutrition", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = estimateNutrition("Pizza");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include the dish name", () => {
      const dishName = "Chicken Breast";
      const prompt = estimateNutrition(dishName);

      expect(prompt).toContain(dishName);
    });

    it("should include description when provided", () => {
      const description = "Grilled with herbs";
      const prompt = estimateNutrition("Chicken", description);

      expect(prompt).toContain(description);
    });

    it("should specify JSON output format", () => {
      const prompt = estimateNutrition("Salad");

      expect(prompt).toContain("JSON");
    });

    it("should specify required nutrition fields", () => {
      const prompt = estimateNutrition("Burger");

      expect(prompt).toContain("calories");
      expect(prompt).toContain("protein");
      expect(prompt).toContain("carbohydrates");
      expect(prompt).toContain("fats");
    });
  });

  describe("batchTranslateMenu", () => {
    it("should return a non-empty string prompt", () => {
      const items = [{ name: "Pizza" }];
      const prompt = batchTranslateMenu(items, "English", "Spanish");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include all item names", () => {
      const items = [
        { name: "Pizza Margherita" },
        { name: "Caesar Salad" },
      ];
      const prompt = batchTranslateMenu(items, "English", "Italian");

      expect(prompt).toContain("Pizza Margherita");
      expect(prompt).toContain("Caesar Salad");
    });

    it("should include descriptions when provided", () => {
      const items = [
        { name: "Pasta", description: "Fresh homemade pasta" },
      ];
      const prompt = batchTranslateMenu(items, "English", "French");

      expect(prompt).toContain("Fresh homemade pasta");
    });

    it("should specify languages", () => {
      const items = [{ name: "Item" }];
      const prompt = batchTranslateMenu(items, "German", "Polish");

      expect(prompt).toContain("German");
      expect(prompt).toContain("Polish");
    });

    it("should request JSON array output", () => {
      const items = [{ name: "Dish" }];
      const prompt = batchTranslateMenu(items, "English", "Spanish");

      expect(prompt).toContain("JSON array");
    });
  });

  describe("optimizeMenu", () => {
    it("should return a non-empty string prompt", () => {
      const menuData = { categories: [], dishes: [] };
      const prompt = optimizeMenu(menuData);

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include categories", () => {
      const menuData = {
        categories: ["Starters", "Mains"],
        dishes: [],
      };
      const prompt = optimizeMenu(menuData);

      expect(prompt).toContain("Starters");
      expect(prompt).toContain("Mains");
    });

    it("should include dish information", () => {
      const menuData = {
        categories: [],
        dishes: [
          { name: "Pizza", price: 1299, description: "Delicious" },
        ],
      };
      const prompt = optimizeMenu(menuData);

      expect(prompt).toContain("Pizza");
      expect(prompt).toContain("12.99");
      expect(prompt).toContain("Delicious");
    });

    it("should request structured JSON output", () => {
      const menuData = { categories: [], dishes: [] };
      const prompt = optimizeMenu(menuData);

      expect(prompt).toContain("JSON");
      expect(prompt).toContain("overallScore");
      expect(prompt).toContain("pricingSuggestions");
      expect(prompt).toContain("generalTips");
    });
  });

  describe("detectAllergens", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = detectAllergens("Peanut Butter Sandwich");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include the dish name", () => {
      const dishName = "Shrimp Pasta";
      const prompt = detectAllergens(dishName);

      expect(prompt).toContain(dishName);
    });

    it("should include description when provided", () => {
      const description = "Contains dairy and eggs";
      const prompt = detectAllergens("Cake", description);

      expect(prompt).toContain(description);
    });

    it("should mention common allergen categories", () => {
      const prompt = detectAllergens("Food");

      expect(prompt).toContain("gluten");
      expect(prompt).toContain("dairy");
      expect(prompt).toContain("shellfish");
      expect(prompt).toContain("peanuts");
    });

    it("should request JSON array output", () => {
      const prompt = detectAllergens("Dish");

      expect(prompt).toContain("JSON array");
    });
  });

  describe("suggestPricing", () => {
    it("should return a non-empty string prompt", () => {
      const prompt = suggestPricing("Steak");

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include the dish name", () => {
      const dishName = "Lobster Thermidor";
      const prompt = suggestPricing(dishName);

      expect(prompt).toContain(dishName);
    });

    it("should include category when provided", () => {
      const prompt = suggestPricing("Salmon", "Main Course");

      expect(prompt).toContain("Main Course");
    });

    it("should include cuisine type when provided", () => {
      const prompt = suggestPricing("Sushi", "Appetizer", "Japanese");

      expect(prompt).toContain("Japanese");
    });

    it("should specify JSON output with pricing fields", () => {
      const prompt = suggestPricing("Burger");

      expect(prompt).toContain("JSON");
      expect(prompt).toContain("lowPrice");
      expect(prompt).toContain("highPrice");
      expect(prompt).toContain("suggestedPrice");
      expect(prompt).toContain("confidence");
      expect(prompt).toContain("reasoning");
    });

    it("should mention cents as unit", () => {
      const prompt = suggestPricing("Dish");

      expect(prompt).toContain("cents");
    });
  });

  describe("generateMenuScore", () => {
    it("should return a non-empty string prompt", () => {
      const menuData = {
        totalDishes: 10,
        hasDescriptions: true,
        hasImages: true,
        hasAllergens: true,
        hasNutrition: false,
        languageCount: 2,
        categoryCount: 5,
      };
      const prompt = generateMenuScore(menuData);

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include all metrics", () => {
      const menuData = {
        totalDishes: 15,
        hasDescriptions: true,
        hasImages: false,
        hasAllergens: true,
        hasNutrition: true,
        languageCount: 3,
        categoryCount: 7,
      };
      const prompt = generateMenuScore(menuData);

      expect(prompt).toContain("15");
      expect(prompt).toContain("Yes");
      expect(prompt).toContain("No");
      expect(prompt).toContain("3");
      expect(prompt).toContain("7");
    });

    it("should request JSON output with score breakdown", () => {
      const menuData = {
        totalDishes: 5,
        hasDescriptions: false,
        hasImages: false,
        hasAllergens: false,
        hasNutrition: false,
        languageCount: 1,
        categoryCount: 2,
      };
      const prompt = generateMenuScore(menuData);

      expect(prompt).toContain("JSON");
      expect(prompt).toContain("score");
      expect(prompt).toContain("breakdown");
      expect(prompt).toContain("suggestions");
    });
  });

  describe("batchGenerateDescriptions", () => {
    it("should return a non-empty string prompt", () => {
      const dishes = [{ name: "Pizza" }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });

    it("should include all dish names", () => {
      const dishes = [
        { name: "Spaghetti" },
        { name: "Lasagna" },
      ];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toContain("Spaghetti");
      expect(prompt).toContain("Lasagna");
    });

    it("should include categories when provided", () => {
      const dishes = [
        { name: "Tiramisu", category: "Desserts" },
      ];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toContain("Desserts");
    });

    it("should include language instruction when provided", () => {
      const dishes = [{ name: "Dish" }];
      const prompt = batchGenerateDescriptions(dishes, "French");

      expect(prompt).toContain("French");
    });

    it("should request JSON array output", () => {
      const dishes = [{ name: "Dish" }];
      const prompt = batchGenerateDescriptions(dishes);

      expect(prompt).toContain("JSON array");
      expect(prompt).toContain("name");
      expect(prompt).toContain("description");
    });
  });
});
