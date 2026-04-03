import { PostList } from "@/widgets/post-list";
import { BLOG_DESCRIPTION } from "@/shared/lib/constants";
import type { Post } from "@/entities/post";

interface HomePageProps {
  posts: Post[];
}

export function HomePage({ posts }: HomePageProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <section className="mb-10">
        <p className="text-muted-foreground">{BLOG_DESCRIPTION}</p>
      </section>
      <PostList posts={posts} />
    </main>
  );
}
