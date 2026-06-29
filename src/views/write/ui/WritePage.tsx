"use client";

import type { Category } from "@/entities/category";
import type { Post } from "@/entities/post";
import type { SeriesWithCount } from "@/entities/series";
import { PostForm } from "@/features/write-post";

interface WritePageProps {
  post?: Post;
  categories?: Category[];
  seriesList?: SeriesWithCount[];
}

export function WritePage({ post, categories, seriesList }: WritePageProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">
        {post ? "글 수정" : "새 글 작성"}
      </h1>
      <PostForm
        initialData={post}
        categories={categories ?? []}
        seriesList={seriesList ?? []}
      />
    </main>
  );
}
