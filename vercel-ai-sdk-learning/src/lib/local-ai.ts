import { createOpenAI } from "@ai-sdk/openai";

// LM Studio exposes an OpenAI-compatible API at localhost:1234
export const localAI = createOpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "not-needed", // LM Studio doesn't require an API key
});

//* ==> need to know in detail and clearly
// localAI("model")      → uses the new /v1/responses endpoint (OpenAI only, NOT supported by LM Studio)
// localAI.chat("model") → uses /v1/chat/completions (OpenAI-compatible, works with LM Studio)
// Use this helper in your routes so you don't forget:
export const localChat = (modelId: string) => localAI.chat(modelId);

// Usage: localAI("model-name")
// The model name must match exactly what LM Studio shows
// e.g. localAI("lmstudio-community/Qwen2.5-7B-Instruct-GGUF")
