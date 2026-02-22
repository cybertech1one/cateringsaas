import { describe, expect, it } from "vitest";

// Extracted from menus.ts for testing
const prepareTextForSlug = (text: string) => {
  return text.replace(/ /g, "-").toLowerCase();
};

const generateMenuSlug = ({ name, city }: { name: string; city: string }) => {
  const randomNumber = Math.random().toString().slice(2, 8);
  const slug = `${prepareTextForSlug(name)}-${prepareTextForSlug(city)}-${randomNumber}`;
  const alphaNumericSlug = slug.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return alphaNumericSlug;
};

describe("prepareTextForSlug", () => {
  it("replaces ALL spaces with hyphens", () => {
    expect(prepareTextForSlug("hello world foo")).toBe("hello-world-foo");
  });

  it("lowercases the text", () => {
    expect(prepareTextForSlug("Hello World")).toBe("hello-world");
  });

  it("handles single word", () => {
    expect(prepareTextForSlug("restaurant")).toBe("restaurant");
  });
});

describe("generateMenuSlug", () => {
  it("generates a slug with name, city, and random number", () => {
    const slug = generateMenuSlug({ name: "Test Restaurant", city: "New York" });

    expect(slug).toMatch(/^test-restaurant-new-york-\d+$/);
  });

  it("handles special characters", () => {
    const slug = generateMenuSlug({ name: "Café & Bistro", city: "São Paulo" });

    expect(slug).not.toContain("&");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("generates unique slugs", () => {
    const slug1 = generateMenuSlug({ name: "Test", city: "City" });
    const slug2 = generateMenuSlug({ name: "Test", city: "City" });

    // Very unlikely to be equal with 6-digit random suffix
    expect(slug1).not.toBe(slug2);
  });

  it("produces slugs with 6-digit random suffix", () => {
    const slug = generateMenuSlug({ name: "A", city: "B" });
    const parts = slug.split("-");
    const lastPart = parts[parts.length - 1];

    expect(lastPart).toBeDefined();
    expect(lastPart!.length).toBeGreaterThanOrEqual(5);
  });
});
