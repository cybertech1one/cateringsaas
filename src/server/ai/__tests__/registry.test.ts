import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the AI provider registry.
 * Uses vi.stubGlobal to control environment variables and vi.mock to
 * replace the actual provider implementations with lightweight stubs.
 */

// Mock the provider modules so we don't need actual SDK dependencies
vi.mock("../providers/openai", () => ({
  OpenAIProvider: class {
    name = "openai";
    constructor(public apiKey: string) {}
    getModels() {
      return [
        { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
      ];
    }
    async generateText() {
      return { text: "mock", tokensUsed: 0 };
    }
  },
}));

vi.mock("../providers/anthropic", () => ({
  AnthropicProvider: class {
    name = "anthropic";
    constructor(public apiKey: string) {}
    getModels() {
      return [
        { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic" },
        { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic" },
      ];
    }
    async generateText() {
      return { text: "mock", tokensUsed: 0 };
    }
  },
}));

vi.mock("../providers/google", () => ({
  GoogleProvider: class {
    name = "google";
    constructor(public apiKey: string) {}
    getModels() {
      return [
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google" },
        { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", provider: "google" },
      ];
    }
    async generateText() {
      return { text: "mock", tokensUsed: 0 };
    }
  },
}));

// We need to dynamically import the registry after mocking
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type RegistryModule = typeof import("../registry");
let getProvider: RegistryModule["getProvider"];
let getAvailableProviders: RegistryModule["getAvailableProviders"];
let getAllModels: RegistryModule["getAllModels"];
let isValidProviderModel: RegistryModule["isValidProviderModel"];

describe("AI provider registry", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    // Clear provider cache by re-importing with fresh module
    vi.resetModules();

    // Clear all API keys
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;

    // Re-import after resetting modules
    const registry = await import("../registry");

    getProvider = registry.getProvider;
    getAvailableProviders = registry.getAvailableProviders;
    getAllModels = registry.getAllModels;
    isValidProviderModel = registry.isValidProviderModel;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getProvider", () => {
    it("should return null when no API key is set for the provider", () => {
      const result = getProvider("openai");

      expect(result).toBeNull();
    });

    it("should return a provider when the API key is set", () => {
      process.env.OPENAI_API_KEY = "test-key-123";

      const result = getProvider("openai");

      expect(result).not.toBeNull();
      expect(result!.name).toBe("openai");
    });

    it("should return null for unknown provider names", () => {
      const result = getProvider("unknown-provider");

      expect(result).toBeNull();
    });

    it("should return Anthropic provider when API key is set", () => {
      process.env.ANTHROPIC_API_KEY = "sk-test-anthropic";

      const result = getProvider("anthropic");

      expect(result).not.toBeNull();
      expect(result!.name).toBe("anthropic");
    });

    it("should return Google provider when API key is set", () => {
      process.env.GOOGLE_AI_API_KEY = "test-google-key";

      const result = getProvider("google");

      expect(result).not.toBeNull();
      expect(result!.name).toBe("google");
    });

    it("should cache providers and return the same instance", () => {
      process.env.OPENAI_API_KEY = "test-key";

      const first = getProvider("openai");
      const second = getProvider("openai");

      expect(first).toBe(second);
    });

    it("should treat empty string API key as not set", () => {
      process.env.OPENAI_API_KEY = "";

      const result = getProvider("openai");

      expect(result).toBeNull();
    });
  });

  describe("getAvailableProviders", () => {
    it("should return empty array when no API keys are set", () => {
      const result = getAvailableProviders();

      expect(result).toEqual([]);
    });

    it("should return only providers with API keys set", () => {
      process.env.OPENAI_API_KEY = "test-openai";

      const result = getAvailableProviders();

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("openai");
    });

    it("should return all providers when all keys are set", () => {
      process.env.OPENAI_API_KEY = "test-openai";
      process.env.ANTHROPIC_API_KEY = "test-anthropic";
      process.env.GOOGLE_AI_API_KEY = "test-google";

      const result = getAvailableProviders();

      expect(result).toHaveLength(3);
      const names = result.map((p) => p.name);

      expect(names).toContain("openai");
      expect(names).toContain("anthropic");
      expect(names).toContain("google");
    });

    it("should include models for each available provider", () => {
      process.env.OPENAI_API_KEY = "test-openai";

      const result = getAvailableProviders();

      expect(result[0]!.models).toBeDefined();
      expect(result[0]!.models.length).toBeGreaterThan(0);
    });

    it("should return providers in order: openai, anthropic, google", () => {
      process.env.OPENAI_API_KEY = "k1";
      process.env.ANTHROPIC_API_KEY = "k2";
      process.env.GOOGLE_AI_API_KEY = "k3";

      const result = getAvailableProviders();
      const names = result.map((p) => p.name);

      expect(names).toEqual(["openai", "anthropic", "google"]);
    });
  });

  describe("getAllModels", () => {
    it("should return empty array when no providers are available", () => {
      const result = getAllModels();

      expect(result).toEqual([]);
    });

    it("should return models from all available providers", () => {
      process.env.OPENAI_API_KEY = "k1";
      process.env.ANTHROPIC_API_KEY = "k2";

      const result = getAllModels();

      // OpenAI has 2 models, Anthropic has 2 models
      expect(result).toHaveLength(4);
      const ids = result.map((m) => m.id);

      expect(ids).toContain("gpt-4o");
      expect(ids).toContain("gpt-4o-mini");
      expect(ids).toContain("claude-sonnet-4-5-20250929");
      expect(ids).toContain("claude-haiku-4-5-20251001");
    });

    it("should return only models from providers with API keys", () => {
      process.env.GOOGLE_AI_API_KEY = "test-google";

      const result = getAllModels();

      expect(result).toHaveLength(2);
      const providers = result.map((m) => m.provider);

      expect(new Set(providers)).toEqual(new Set(["google"]));
    });

    it("should include provider field on each model", () => {
      process.env.OPENAI_API_KEY = "k1";

      const result = getAllModels();

      for (const model of result) {
        expect(model.provider).toBeDefined();
        expect(typeof model.provider).toBe("string");
      }
    });
  });

  describe("isValidProviderModel", () => {
    it("should return false when provider has no API key", () => {
      const result = isValidProviderModel("openai", "gpt-4o");

      expect(result).toBe(false);
    });

    it("should return true for a valid provider and model combination", () => {
      process.env.OPENAI_API_KEY = "test-key";

      const result = isValidProviderModel("openai", "gpt-4o");

      expect(result).toBe(true);
    });

    it("should return false for a valid provider but invalid model", () => {
      process.env.OPENAI_API_KEY = "test-key";

      const result = isValidProviderModel("openai", "nonexistent-model");

      expect(result).toBe(false);
    });

    it("should return false for unknown provider name", () => {
      const result = isValidProviderModel("unknown", "some-model");

      expect(result).toBe(false);
    });

    it("should validate anthropic models correctly", () => {
      process.env.ANTHROPIC_API_KEY = "test-key";

      expect(isValidProviderModel("anthropic", "claude-sonnet-4-5-20250929")).toBe(true);
      expect(isValidProviderModel("anthropic", "claude-haiku-4-5-20251001")).toBe(true);
      expect(isValidProviderModel("anthropic", "gpt-4o")).toBe(false);
    });

    it("should validate google models correctly", () => {
      process.env.GOOGLE_AI_API_KEY = "test-key";

      expect(isValidProviderModel("google", "gemini-2.0-flash")).toBe(true);
      expect(isValidProviderModel("google", "gemini-2.0-flash-lite")).toBe(true);
      expect(isValidProviderModel("google", "gpt-4o")).toBe(false);
    });
  });
});
