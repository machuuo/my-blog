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
