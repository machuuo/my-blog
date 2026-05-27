import Link from "next/link";

import { cn } from "@/shared/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn(
        "flex items-center gap-1 font-hand2 text-base text-nb-ink-soft",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-nb-pink">→</span>}
            {isLast || !item.href ? (
              <span className="font-hand text-lg text-nb-ink truncate max-w-[240px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-nb-pink transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
