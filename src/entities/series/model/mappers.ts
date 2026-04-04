import type { Series, SeriesWithCount } from "./types";

export function toSeries(row: Record<string, unknown>): Series {
  return {
    series_id: row.series_id as string,
    category_id: row.category_id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    thumbnail_url: (row.thumbnail_url as string) ?? null,
    slug: row.slug as string,
    display_order: row.display_order as number,
    published: row.published as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function toSeriesWithCount(row: Record<string, unknown>): SeriesWithCount {
  return {
    ...toSeries(row),
    post_count: Number(row.post_count ?? 0),
  };
}
