import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { PostMeta } from "@/entities/post";
import type { Post } from "@/entities/post";

interface PostDetailPageProps {
  post: Post;
}

export function PostDetailPage({ post }: PostDetailPageProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; 목록으로
      </Link>

      <article className="mt-6">
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground mt-2">{post.description}</p>
          <PostMeta date={post.date} readingTime={post.readingTime} />
        </header>

        <Separator className="mb-8" />

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  );
}
