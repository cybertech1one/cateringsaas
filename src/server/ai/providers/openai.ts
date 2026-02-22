import OpenAI from "openai";
import type { AIProvider, AIModel, AIRequestOptions, AIResponse } from "../types";

export class OpenAIProvider implements AIProvider {
  name = "openai" as const;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(prompt: string, model: string, options?: AIRequestOptions): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const tokensUsed = response.usage?.total_tokens ?? 0;

    return { text, tokensUsed };
  }

  getModels(): AIModel[] {
    return [
      { id: "gpt-4o", name: "GPT-4o", provider: this.name },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: this.name },
    ];
  }
}
