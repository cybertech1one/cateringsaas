export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  tokensUsed: number;
}

export interface AIProvider {
  name: string;
  generateText(prompt: string, model: string, options?: AIRequestOptions): Promise<AIResponse>;
  getModels(): AIModel[];
}
