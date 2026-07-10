interface PostMetaProps {
  /** posts.created_at은 DB상 nullable — null이면 날짜를 렌더링하지 않는다 */
  date: string | null;
  readingTime: string;
  className?: string;
}

export function PostMeta({ date, readingTime, className }: PostMetaProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm text-muted-foreground mt-2 ${className ?? ""}`}
    >
      {date === null ? null : (
        <>
          <time dateTime={date}>
            {new Date(date).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>·</span>
        </>
      )}
      <span>{readingTime}</span>
    </div>
  );
}
