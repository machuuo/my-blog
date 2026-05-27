interface PostMetaProps {
  date: string;
  readingTime: string;
  className?: string;
}

export function PostMeta({ date, readingTime, className }: PostMetaProps) {
  const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`flex items-center gap-2 font-hand2 text-sm text-nb-ink-soft ${className ?? ""}`}
    >
      <time dateTime={date}>{formattedDate}</time>
      <span className="text-nb-pink">·</span>
      <span>{readingTime}</span>
    </div>
  );
}
