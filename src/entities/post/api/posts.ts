import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

import { toPost, toPostWithSeries } from "../model/mappers";
import type { Post, PostWithSeries } from "../model/types";

/** breadcrumb용 series/category 조인. model의 PostWithSeriesRow와 짝을 이룬다. */
const POST_WITH_SERIES_SELECT = "*, series(title, slug, categories(name, slug))";

export async function getAllPosts(): Promise<Post[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("display_order", { ascending: false });

  if (error || !data) return [];

  return data.map(toPost);
}

export async function getPostBySlug(slug: string): Promise<PostWithSeries | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_SERIES_SELECT)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return toPostWithSeries(data);
}

export async function getPublishedPostBySlug(slug: string): Promise<PostWithSeries | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_SERIES_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;

  return toPostWithSeries(data);
}

export async function getPostsBySeries(seriesId: string): Promise<Post[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("series_id", seriesId)
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  return data.map(toPost);
}

export async function getUncategorizedPosts(): Promise<Post[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .is("series_id", null)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(toPost);
}

export async function getAllSlugs(): Promise<string[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("published", true);

  if (error || !data) return [];

  return data.map((row) => row.slug);
}
