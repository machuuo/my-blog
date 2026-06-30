import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "../env";

let client: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  client = createClient(supabaseUrl, anonKey);
  return client;
}
