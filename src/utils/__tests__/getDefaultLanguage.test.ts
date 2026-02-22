import { describe, expect, it } from "vitest";
import { getDefaultLanguage } from "../getDefaultLanguage";

/**
 * Tests for the getDefaultLanguage utility.
 * Validates default language selection from a list of MenuLanguages.
 */

// Minimal shape matching the MenuLanguages type from Prisma (composite key: menuId + languageId)
interface MockMenuLanguage {
  menuId: string;
  languageId: string;
  isDefault: boolean;
}

function makeLang(overrides: Partial<MockMenuLanguage> = {}): MockMenuLanguage {
  return {
    menuId: "menu-1",
    languageId: "en",
    isDefault: false,
    ...overrides,
  };
}

describe("getDefaultLanguage", () => {
  it("should return the language marked as default", () => {
    const languages = [
      makeLang({ languageId: "en", isDefault: false }),
      makeLang({ languageId: "pl", isDefault: true }),
      makeLang({ languageId: "fr", isDefault: false }),
    ];

    const result = getDefaultLanguage(languages);

    expect(result.languageId).toBe("pl");
    expect(result.isDefault).toBe(true);
  });

  it("should return the first language when none is marked as default", () => {
    const languages = [
      makeLang({ languageId: "en", isDefault: false }),
      makeLang({ languageId: "pl", isDefault: false }),
    ];

    const result = getDefaultLanguage(languages);

    expect(result.languageId).toBe("en");
  });

  it("should return the first default when multiple are marked as default", () => {
    const languages = [
      makeLang({ languageId: "en", isDefault: true }),
      makeLang({ languageId: "pl", isDefault: true }),
    ];

    const result = getDefaultLanguage(languages);

    expect(result.languageId).toBe("en");
  });

  it("should throw when the languages array is empty", () => {
    expect(() => getDefaultLanguage([])).toThrow(
      "There's no default language and no languages at all!",
    );
  });

  it("should work with a single language that is default", () => {
    const languages = [
      makeLang({ languageId: "ar", isDefault: true }),
    ];

    const result = getDefaultLanguage(languages);

    expect(result.languageId).toBe("ar");
    expect(result.isDefault).toBe(true);
  });

  it("should work with a single language that is not default", () => {
    const languages = [
      makeLang({ languageId: "de", isDefault: false }),
    ];

    const result = getDefaultLanguage(languages);

    expect(result.languageId).toBe("de");
  });

  it("should return the correct full object", () => {
    const defaultLang = makeLang({
      menuId: "menu-abc",
      languageId: "ja",
      isDefault: true,
    });
    const languages = [
      makeLang({ languageId: "en", isDefault: false }),
      defaultLang,
    ];

    const result = getDefaultLanguage(languages);

    expect(result).toBe(defaultLang);
    expect(result.menuId).toBe("menu-abc");
    expect(result.languageId).toBe("ja");
  });
});
