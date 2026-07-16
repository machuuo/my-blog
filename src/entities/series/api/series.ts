import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

import { toSeries, toSeriesWithCount } from "../model/mappers";
import type { Series, SeriesWithCount } from "../model/types";

export async function getAllPublishedSeries(): Promise<SeriesWithCount[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .rpc("get_published_series_with_count");

  if (error) return [];

  return data.map(toSeriesWithCount);
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("series")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;

  return toSeries(data);
}

export async function getSeriesByCategory(categoryId: string): Promise<SeriesWithCount[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .rpc("get_published_series_with_count")
    .eq("category_id", categoryId);

  if (error) return [];

  return data.map(toSeriesWithCount);
}
