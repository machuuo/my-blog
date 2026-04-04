import readingTime from "reading-time";
import type { Post, PostWithSeries } from "./types";

export function toPost(row: Record<string, unknown>): Post {
  const content = (row.content as string) ?? "";

  return {
    post_id: row.post_id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    date: row.created_at as string,
    tags: (row.tags as string[]) ?? [],
    published: row.published as boolean,
    content,
    readingTime: readingTime(content).text,
    updated_at: row.updated_at as string,
    series_id: (row.series_id as string) ?? null,
    display_order: (row.display_order as number) ?? null,
  };
}

export function toPostWithSeries(row: Record<string, unknown>): PostWithSeries {
  const series = row.series as Record<string, unknown> | null;
  const category = series?.categories as Record<string, unknown> | null;

  return {
    ...toPost(row),
    series_title: (series?.title as string) ?? null,
    series_slug: (series?.slug as string) ?? null,
    category_name: (category?.name as string) ?? null,
    category_slug: (category?.slug as string) ?? null,
  };
}
