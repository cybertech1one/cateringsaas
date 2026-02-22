import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIModel, AIRequestOptions, AIResponse } from "../types";

export class AnthropicProvider implements AIProvider {
  name = "anthropic" as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(prompt: string, model: string, options?: AIRequestOptions): Promise<AIResponse> {
    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    const tokensUsed = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

    return { text, tokensUsed };
  }

  getModels(): AIModel[] {
    return [
      { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: this.name },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: this.name },
    ];
  }
}
