import type { Series, SeriesRow, SeriesWithCount, SeriesWithCountRow } from "./types";

export function toSeries(row: SeriesRow): Series {
  return {
    series_id: row.series_id,
    category_id: row.category_id,
    title: row.title,
    description: row.description ?? "",
    thumbnail_url: row.thumbnail_url,
    slug: row.slug,
    display_order: row.display_order,
    published: row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toSeriesWithCount(row: SeriesWithCountRow): SeriesWithCount {
  return {
    ...toSeries(row),
    // Number(): Postgres count()는 bigint라 드라이버가 문자열로 줄 수 있어 강제 변환을 유지한다.
    post_count: Number(row.post_count),
  };
}
