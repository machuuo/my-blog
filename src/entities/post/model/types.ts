export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
}

export interface Post extends PostFrontmatter {
  id: string;
  slug: string;
  content: string;
  readingTime: string;
  updated_at: string;
}
