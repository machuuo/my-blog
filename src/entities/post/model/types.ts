import type { Tables } from "@/shared/lib/supabase/database.types";

/**
 * 매퍼 입력 = DB 로우. 생성 타입에서 파생되므로 컬럼 변경 시 tsc가 잡는다.
 * 조인 부분은 POST_WITH_SERIES_SELECT가 고르는 컬럼만 Pick으로 좁힌다.
 */
export type PostRow = Tables<"posts">;

type SeriesJoin = Pick<Tables<"series">, "title" | "slug"> & {
  categories: Pick<Tables<"categories">, "name" | "slug"> | null;
};

export type PostWithSeriesRow = PostRow & { series: SeriesJoin | null };

export interface PostFrontmatter {
  title: string;
  description: string;
  /** posts.created_at은 DB상 nullable */
  date: string | null;
  tags: string[];
  /** posts.published는 DB상 nullable */
  published: boolean | null;
}

export interface Post extends PostFrontmatter {
  post_id: string;
  slug: string;
  content: string;
  readingTime: string;
  /** posts.updated_at은 DB상 nullable */
  updated_at: string | null;
  series_id: string | null;
  display_order: number | null;
}

/** Post with joined series/category info for breadcrumb */
export interface PostWithSeries extends Post {
  series_title: string | null;
  series_slug: string | null;
  category_name: string | null;
  category_slug: string | null;
}
