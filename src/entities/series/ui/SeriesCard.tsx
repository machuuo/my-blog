import Link from "next/link";
import type { SeriesWithCount } from "../model/types";

interface SeriesCardProps {
  series: SeriesWithCount;
  index?: number;
  className?: string;
}

const TAPES = ["pink", "sage", "sky", "butter"] as const;

export function SeriesCard({ series, index = 0, className }: SeriesCardProps) {
  const tape = TAPES[index % TAPES.length];
  const rotateClass = index % 2 === 0 ? "-rotate-[0.5deg]" : "rotate-[0.4deg]";

  return (
    <Link
      href={`/series/${series.slug}`}
      className={`block group ${className ?? ""}`}
    >
      <article
        className={`relative nb-paper-card px-6 py-5 transition-transform group-hover:rotate-0 ${rotateClass}`}
      >
        <div
          className="nb-washi rounded-sm absolute -top-3 left-6"
          style={{
            width: 100,
            height: 24,
            transform: "rotate(-5deg)",
            backgroundColor: `hsl(var(--nb-${tape}))`,
          }}
          aria-hidden
        />
        <div className="font-hand2 text-sm text-nb-ink-soft">
          시리즈 · {series.post_count}편
        </div>
        <h3 className="font-hand text-3xl leading-tight m-0 my-2 text-nb-ink group-hover:text-nb-pink transition-colors">
          {series.title}
        </h3>
        {series.description && (
          <p className="font-serif text-sm leading-relaxed text-nb-ink-soft m-0">
            {series.description}
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <span className="font-hand text-lg text-nb-pink">펼쳐보기 →</span>
        </div>
      </article>
    </Link>
  );
}
