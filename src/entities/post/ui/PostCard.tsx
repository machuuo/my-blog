import Link from "next/link";
import type { Post } from "../model/types";

interface PostCardProps {
  post: Post;
  index?: number;
  className?: string;
}

const TAPES = ["pink", "sage", "sky", "butter"] as const;

export function PostCard({ post, index = 0, className }: PostCardProps) {
  const tape = TAPES[index % TAPES.length];
  const rotateClass = index % 2 === 0 ? "-rotate-[0.4deg]" : "rotate-[0.4deg]";

  return (
    <Link href={`/posts/${post.slug}`} className={`block group ${className ?? ""}`}>
      <article
        className={`relative nb-index-card pr-6 py-5 pl-12 transition-transform group-hover:rotate-0 ${rotateClass}`}
      >
        <div
          className="nb-washi rounded-sm absolute -top-3 left-8"
          style={{
            width: 90,
            height: 24,
            transform: "rotate(-5deg)",
            backgroundColor: `hsl(var(--nb-${tape}))`,
          }}
          aria-hidden
        />
        <div className="flex justify-between font-hand2 text-sm text-nb-ink-soft mb-1">
          <span>· {post.tags.slice(0, 2).join(" · ") || "note"}</span>
          <span>· {post.readingTime} ·</span>
        </div>
        <h3 className="font-hand text-2xl leading-tight m-0 my-2 text-nb-ink group-hover:text-nb-pink transition-colors">
          {post.title}
        </h3>
        <p className="font-serif text-sm leading-relaxed text-nb-ink m-0 mb-3">
          {post.description}
        </p>
        <div className="flex gap-2 flex-wrap font-hand2 text-sm text-nb-ink-soft items-center">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
          <span className="ml-auto font-hand text-lg text-nb-pink">
            읽어보기 →
          </span>
        </div>
      </article>
    </Link>
  );
}
