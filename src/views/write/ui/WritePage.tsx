"use client";

import { PostForm } from "@/features/write-post";
import type { Post } from "@/entities/post";

interface WritePageProps {
  post?: Post;
}

export function WritePage({ post }: WritePageProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">
        {post ? "글 수정" : "새 글 작성"}
      </h1>
      <PostForm initialData={post} />
    </main>
  );
}
