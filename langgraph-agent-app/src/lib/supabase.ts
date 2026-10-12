import { createClient } from "@supabase/supabase-js";

// Fetch credentials from environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

// Warn in development if real keys have not yet been provided
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.warn(
    "⚠️ [Supabase Warning]: NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file."
  );
}

/**
 * Shared Supabase client instance.
 * Used across the app to read and write chats and messages.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
