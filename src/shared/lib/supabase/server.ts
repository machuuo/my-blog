import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "../env";

import type { Database } from "./database.types";

export function createServerSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
