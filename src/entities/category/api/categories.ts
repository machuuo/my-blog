import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

import { toCategory } from "../model/mappers";
import type { Category } from "../model/types";

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  return data.map(toCategory);
}
