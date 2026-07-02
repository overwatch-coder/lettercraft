import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createGroq } from "@ai-sdk/groq";

export interface AIProviderConfig {
  provider?: string;
  modelName?: string;
  apiKey?: string;
}

export function getProviderModel(config: AIProviderConfig) {
  const provider = config.provider || "openai";
  const modelName = config.modelName || "gpt-4o-mini";
  
  let envKey = "";
  if (provider === "openai") envKey = process.env.OPENAI_API_KEY || "";
  else if (provider === "google") envKey = process.env.GEMINI_API_KEY || "";
  else if (provider === "anthropic") envKey = process.env.ANTHROPIC_API_KEY || "";
  else if (provider === "xai") envKey = process.env.XAI_API_KEY || "";
  else if (provider === "groq") envKey = process.env.GROQ_API_KEY || "";
  
  const apiKey = config.apiKey || envKey;
  
  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelName);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelName);
    case "anthropic":
      return createAnthropic({ apiKey })(modelName);
    case "xai":
      return createXai({ apiKey })(modelName);
    case "groq":
      return createGroq({ apiKey })(modelName);
    default:
      return createOpenAI({ apiKey })(modelName);
  }
}
