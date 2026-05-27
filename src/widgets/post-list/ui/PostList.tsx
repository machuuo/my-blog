import { PostCard } from "@/entities/post";
import type { Post } from "@/entities/post";

interface PostListProps {
  posts: Post[];
  className?: string;
}

export function PostList({ posts, className }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div
        className={`text-center py-16 font-hand text-2xl text-nb-ink-soft ${className ?? ""}`}
      >
        아직 페이지가 비어있어요.
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-7 ${className ?? ""}`}
    >
      {posts.map((post, idx) => (
        <PostCard key={post.slug} post={post} index={idx} />
      ))}
    </div>
  );
}
