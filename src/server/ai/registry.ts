import type { AIProvider, AIModel } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GoogleProvider } from "./providers/google";

const providerCache = new Map<string, AIProvider>();

function getApiKey(provider: string): string | undefined {
  switch (provider) {
    case "openai":

      return process.env.OPENAI_API_KEY || undefined;
    case "anthropic":

      return process.env.ANTHROPIC_API_KEY || undefined;
    case "google":

      return process.env.GOOGLE_AI_API_KEY || undefined;
    default:

      return undefined;
  }
}

function createProvider(name: string, apiKey: string): AIProvider {
  switch (name) {
    case "openai":

      return new OpenAIProvider(apiKey);
    case "anthropic":

      return new AnthropicProvider(apiKey);
    case "google":

      return new GoogleProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}

export function getProvider(providerName: string): AIProvider | null {
  const cached = providerCache.get(providerName);

  if (cached) return cached;

  const apiKey = getApiKey(providerName);

  if (!apiKey) return null;

  const provider = createProvider(providerName, apiKey);

  providerCache.set(providerName, provider);

  return provider;
}

export function getAvailableProviders(): { name: string; models: AIModel[] }[] {
  const providerNames = ["openai", "anthropic", "google"] as const;
  const available: { name: string; models: AIModel[] }[] = [];

  for (const name of providerNames) {
    const apiKey = getApiKey(name);

    if (apiKey) {
      const provider = getProvider(name);

      if (provider) {
        available.push({ name, models: provider.getModels() });
      }
    }
  }

  return available;
}

export function getAllModels(): AIModel[] {

  return getAvailableProviders().flatMap((p) => p.models);
}

export function isValidProviderModel(provider: string, model: string): boolean {
  const p = getProvider(provider);

  if (!p) return false;

  return p.getModels().some((m) => m.id === model);
}
