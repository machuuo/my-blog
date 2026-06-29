import Link from "next/link";

import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";

import type { Post } from "../model/types";

import { PostMeta } from "./PostMeta";

interface PostCardProps {
  post: Post;
  className?: string;
}

export function PostCard({ post, className }: PostCardProps) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <Card
        className={`transition-colors hover:border-foreground/20 ${className ?? ""}`}
      >
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <CardTitle className="text-xl">{post.title}</CardTitle>
          <CardDescription className="mt-1">
            {post.description}
          </CardDescription>
          <PostMeta date={post.date} readingTime={post.readingTime} />
        </CardHeader>
      </Card>
    </Link>
  );
}
