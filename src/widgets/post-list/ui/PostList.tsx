import { PostCard } from "@/entities/post";
import type { Post } from "@/entities/post";

interface PostListProps {
  posts: Post[];
  className?: string;
}

export function PostList({ posts, className }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className={`text-center py-20 text-muted-foreground ${className ?? ""}`}>
        <p className="text-lg">아직 포스트가 없습니다.</p>
        <p className="text-sm mt-2">
          content/posts/ 디렉토리에 .mdx 파일을 추가해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
