import readingTime from "reading-time";

import type { Post, PostRow, PostWithSeries, PostWithSeriesRow } from "./types";

export function toPost(row: PostRow): Post {
  const content = row.content ?? "";

  return {
    post_id: row.post_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    date: row.created_at,
    tags: row.tags ?? [],
    published: row.published,
    content,
    readingTime: readingTime(content).text,
    updated_at: row.updated_at,
    series_id: row.series_id,
    display_order: row.display_order,
  };
}

export function toPostWithSeries(row: PostWithSeriesRow): PostWithSeries {
  const { series } = row;
  const category = series?.categories ?? null;

  return {
    ...toPost(row),
    series_title: series?.title ?? null,
    series_slug: series?.slug ?? null,
    category_name: category?.name ?? null,
    category_slug: category?.slug ?? null,
  };
}
