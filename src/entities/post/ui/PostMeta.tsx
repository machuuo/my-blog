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
      className={`flex items-center gap-2 text-sm text-muted-foreground mt-2 ${className ?? ""}`}
    >
      <time dateTime={date}>{formattedDate}</time>
      <span>·</span>
      <span>{readingTime}</span>
    </div>
  );
}
