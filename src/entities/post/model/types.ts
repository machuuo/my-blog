export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
}

export interface Post extends PostFrontmatter {
  post_id: string;
  slug: string;
  content: string;
  readingTime: string;
  updated_at: string;
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
