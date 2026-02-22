export function generateDishDescription(
  dishName: string,
  category?: string,
  language?: string,
  cuisineType?: string,
): string {
  const langInstruction = language ? ` Write in ${language}.` : "";
  const categoryContext = category ? ` This dish belongs to the "${category}" category.` : "";
  const cuisineContext = cuisineType ? ` This is a ${cuisineType} cuisine dish.` : "";

  return `Write a short, appetizing restaurant menu description (1-2 sentences, max 150 characters) for a dish called "${dishName}".${categoryContext}${cuisineContext}${langInstruction} Only return the description text, no quotes or extra formatting.`;
}

export function translateContent(
  text: string,
  fromLang: string,
  toLang: string,
): string {

  return `Translate the following restaurant menu text from ${fromLang} to ${toLang}. Keep the tone appetizing and natural for a menu. Only return the translated text, no quotes or extra formatting.\n\nText: ${text}`;
}

export function enhanceDescription(
  text: string,
  language?: string,
): string {
  const langInstruction = language ? ` Keep the text in ${language}.` : "";

  return `Improve this restaurant menu description to be more appetizing and appealing, keeping it concise (1-2 sentences, max 150 characters).${langInstruction} Only return the enhanced text, no quotes or extra formatting.\n\nOriginal: ${text}`;
}

export function suggestCategory(
  dishName: string,
  existingCategories: string[],
): string {
  const categoriesList = existingCategories.length > 0
    ? `\nExisting categories: ${existingCategories.join(", ")}`
    : "";

  return `Suggest the best category for a restaurant dish called "${dishName}".${categoriesList}\nIf one of the existing categories fits, return that exact name. Otherwise, suggest a new short category name. Only return the category name, nothing else.`;
}

export function estimateNutrition(
  dishName: string,
  description?: string,
): string {
  const descContext = description ? `\nDescription: ${description}` : "";

  return `Estimate the approximate nutritional values per serving for a restaurant dish called "${dishName}".${descContext}\nReturn ONLY a JSON object with these fields (all integers): {"calories": number, "protein": number, "carbohydrates": number, "fats": number}\nValues should be reasonable estimates in grams (protein, carbs, fats) and kcal (calories). Return only the JSON, no other text.`;
}

export function batchTranslateMenu(
  items: { name: string; description?: string }[],
  fromLang: string,
  toLang: string,
): string {
  const itemsList = items
    .map((item, i) => {
      const desc = item.description ? `, "description": "${item.description}"` : "";

      return `  ${i + 1}. {"name": "${item.name}"${desc}}`;
    })
    .join("\n");

  return `Translate the following restaurant menu items from ${fromLang} to ${toLang}. Keep the tone appetizing and natural for a restaurant menu.

Items to translate:
${itemsList}

Return ONLY a JSON array where each element has "name" (translated name) and optionally "description" (translated description if the original had one). Maintain the same order. Example format:
[{"name": "translated name", "description": "translated description"}, ...]
Return only the JSON array, no other text.`;
}

export function optimizeMenu(
  menuData: {
    categories: string[];
    dishes: { name: string; price: number; description?: string }[];
  },
): string {
  const categoriesList = menuData.categories.length > 0
    ? `Categories: ${menuData.categories.join(", ")}`
    : "No categories defined";

  const dishesList = menuData.dishes
    .map((d) => {
      const desc = d.description ? ` - ${d.description}` : "";

      return `  - ${d.name} ($${(d.price / 100).toFixed(2)})${desc}`;
    })
    .join("\n");

  return `Analyze this restaurant menu and provide optimization suggestions.

${categoriesList}

Dishes:
${dishesList}

Provide a structured analysis as a JSON object with these fields:
{
  "overallScore": number (0-100),
  "pricingSuggestions": [{"dish": "name", "currentPrice": number, "suggestedRange": "low-high", "reason": "why"}],
  "descriptionSuggestions": [{"dish": "name", "suggestion": "improved description or note"}],
  "missingCategories": ["category names that would improve the menu"],
  "namingSuggestions": [{"currentName": "name", "suggestedName": "better name", "reason": "why"}],
  "generalTips": ["actionable tip 1", "actionable tip 2"]
}
Return only the JSON object, no other text.`;
}

export function detectAllergens(
  dishName: string,
  description?: string,
): string {
  const descContext = description ? `\nDescription: ${description}` : "";

  return `Identify likely allergens present in a restaurant dish called "${dishName}".${descContext}

Consider these common allergen categories: gluten, dairy, eggs, fish, shellfish, tree_nuts, peanuts, soy, sesame, celery, mustard, lupin, mollusks, sulfites.

Return ONLY a JSON array of allergen type strings that are likely present in this dish based on its name and description. If no allergens can be determined, return an empty array.
Example: ["gluten", "dairy", "eggs"]
Return only the JSON array, no other text.`;
}

export function suggestPricing(
  dishName: string,
  category?: string,
  cuisineType?: string,
): string {
  const categoryContext = category ? ` in the "${category}" category` : "";
  const cuisineContext = cuisineType ? ` for ${cuisineType} cuisine` : "";

  return `Suggest an appropriate price range for a restaurant dish called "${dishName}"${categoryContext}${cuisineContext}.

Consider typical restaurant pricing for this type of dish. Return ONLY a JSON object with:
{
  "lowPrice": number (in cents, e.g., 999 for $9.99),
  "highPrice": number (in cents),
  "suggestedPrice": number (in cents, your best estimate),
  "confidence": "low" | "medium" | "high",
  "reasoning": "brief explanation"
}
Return only the JSON object, no other text.`;
}

export function generateMenuScore(
  menuData: {
    totalDishes: number;
    hasDescriptions: boolean;
    hasImages: boolean;
    hasAllergens: boolean;
    hasNutrition: boolean;
    languageCount: number;
    categoryCount: number;
  },
): string {
  return `Score this restaurant menu's completeness on a 0-100 scale based on these metrics:

- Total dishes: ${menuData.totalDishes}
- Has descriptions for dishes: ${menuData.hasDescriptions ? "Yes" : "No"}
- Has images for dishes: ${menuData.hasImages ? "Yes" : "No"}
- Has allergen information: ${menuData.hasAllergens ? "Yes" : "No"}
- Has nutrition information: ${menuData.hasNutrition ? "Yes" : "No"}
- Number of languages: ${menuData.languageCount}
- Number of categories: ${menuData.categoryCount}

Return ONLY a JSON object with:
{
  "score": number (0-100),
  "breakdown": {
    "dishCount": number (0-15, based on having a good variety),
    "descriptions": number (0-20, based on having descriptions),
    "images": number (0-15, based on having images),
    "allergens": number (0-15, based on allergen info),
    "nutrition": number (0-10, based on nutrition info),
    "languages": number (0-15, based on multilingual support),
    "categories": number (0-10, based on good categorization)
  },
  "suggestions": ["actionable improvement 1", "actionable improvement 2", ...]
}
Return only the JSON object, no other text.`;
}

export function generateDescriptionSuggestions(
  dishName: string,
  category?: string,
  cuisineType?: string,
  language?: string,
): string {
  const langInstruction = language ? ` Write in ${language}.` : "";
  const categoryContext = category ? ` This dish belongs to the "${category}" category.` : "";
  const cuisineContext = cuisineType ? ` This is a ${cuisineType} cuisine dish.` : "";

  return `Generate exactly 3 different short, appetizing restaurant menu descriptions (1-2 sentences each, max 150 characters each) for a dish called "${dishName}".${categoryContext}${cuisineContext}${langInstruction}

Each description should have a different tone:
1. Classic/traditional: Focus on heritage and traditional preparation
2. Modern/enticing: Focus on flavor and sensory appeal
3. Concise/minimal: Brief and elegant, just the essentials

Return ONLY a JSON array of 3 strings, no other text.
Example: ["Traditional description...", "Modern description...", "Concise description..."]`;
}

export function batchGenerateDescriptions(
  dishes: { name: string; category?: string }[],
  language?: string,
): string {
  const langInstruction = language ? ` Write all descriptions in ${language}.` : "";
  const dishesList = dishes
    .map((d, i) => {
      const cat = d.category ? ` (category: ${d.category})` : "";

      return `  ${i + 1}. ${d.name}${cat}`;
    })
    .join("\n");

  return `Write short, appetizing restaurant menu descriptions (1-2 sentences, max 150 characters each) for each of the following dishes.${langInstruction}

Dishes:
${dishesList}

Return ONLY a JSON array where each element has "name" (the original dish name) and "description" (the generated description). Maintain the same order.
Example: [{"name": "Margherita Pizza", "description": "Classic Italian pizza with fresh mozzarella..."}]
Return only the JSON array, no other text.`;
}
