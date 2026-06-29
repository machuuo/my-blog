import Link from "next/link";

import { BookOpen } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";

import type { SeriesWithCount } from "../model/types";

interface SeriesCardProps {
  series: SeriesWithCount;
  className?: string;
}

export function SeriesCard({ series, className }: SeriesCardProps) {
  return (
    <Link href={`/series/${series.slug}`}>
      <Card
        className={`transition-colors hover:border-foreground/20 ${className ?? ""}`}
      >
        <CardHeader>
          <CardTitle className="text-lg">{series.title}</CardTitle>
          {series.description ? <CardDescription className="mt-1">
              {series.description}
            </CardDescription> : null}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{series.post_count}개의 포스트</span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
