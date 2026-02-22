import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIModel, AIRequestOptions, AIResponse } from "../types";

export class GoogleProvider implements AIProvider {
  name = "google" as const;
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt: string, model: string, options?: AIRequestOptions): Promise<AIResponse> {
    const genModel = this.client.getGenerativeModel({
      model,
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
      },
    });

    const result = await genModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

    return { text, tokensUsed };
  }

  getModels(): AIModel[] {
    return [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: this.name },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", provider: this.name },
    ];
  }
}
