//* supabase config

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// we export id
export const SINGLE_CHAT_ID = "00000000-0000-0000-0000-000000000001";
