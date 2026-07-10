import type { Database, Tables } from "@/shared/lib/supabase/database.types";

/** 매퍼 입력 = DB 로우 / RPC 반환 로우. 둘 다 생성 타입에서 파생된다. */
export type SeriesRow = Tables<"series">;

export type SeriesWithCountRow =
  Database["public"]["Functions"]["get_published_series_with_count"]["Returns"][number];

export interface Series {
  series_id: string;
  category_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  slug: string;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeriesWithCount extends Series {
  post_count: number;
}

export interface CategoryWithSeries {
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
  series_list: SeriesWithCount[];
}
