//* config for supabase and Ollama
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";

// ollama client
export const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

// supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
