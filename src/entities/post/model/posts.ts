import readingTime from "reading-time";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type { Post } from "./types";

export async function getAllPosts(): Promise<Post[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    date: row.created_at,
    tags: row.tags ?? [],
    published: row.published,
    content: row.content ?? "",
    readingTime: readingTime(row.content ?? "").text,
    updated_at: row.updated_at,
  }));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description ?? "",
    date: data.created_at,
    tags: data.tags ?? [],
    published: data.published,
    content: data.content ?? "",
    readingTime: readingTime(data.content ?? "").text,
    updated_at: data.updated_at,
  };
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
