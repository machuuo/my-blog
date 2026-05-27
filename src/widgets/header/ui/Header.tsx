import Link from "next/link";
import { BLOG_NAME, NAV_LINKS } from "@/shared/lib/constants";

interface HeaderProps {
  className?: string;
}

const NAV_ITEMS = [
  { label: "Home", kr: "집", href: "/" },
  { label: "Series", kr: "시리즈", href: "/series" },
];

function Squiggle({ width = 64 }: { width?: number }) {
  return (
    <svg
      width={width}
      height="10"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="block"
      aria-hidden
    >
      <path
        d="M2 8 Q 20 2, 40 8 T 80 8 T 120 8 T 160 8 T 198 8"
        stroke="hsl(var(--nb-pink))"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-10 bg-nb-paper/95 backdrop-blur-sm border-b-2 border-dashed border-nb-rule ${className ?? ""}`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* Masthead with washi tape */}
        <div className="relative">
          <div
            className="nb-washi absolute -top-3 -left-2 h-7 rounded-sm"
            style={{
              width: 70,
              transform: "rotate(-14deg)",
              backgroundColor: "hsl(var(--nb-pink))",
            }}
            aria-hidden
          />
          <Link href="/" className="block">
            <h1 className="font-hand text-5xl leading-none m-0 text-nb-ink">
              {BLOG_NAME || "산책 노트"}
            </h1>
            <div className="font-hand2 text-base text-nb-ink-soft mt-1">
              a walking notebook · since 2026
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-5 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative font-hand text-2xl leading-none text-nb-ink hover:text-nb-pink transition-colors px-1 group"
            >
              {item.label}
              <span className="font-hand2 text-xs text-nb-ink-soft ml-1">
                {item.kr}
              </span>
              <span className="absolute left-0 right-0 -bottom-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Squiggle width={50} />
              </span>
            </Link>
          ))}

          {NAV_LINKS.length > 0 && (
            <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-dashed border-nb-rule">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-hand2 text-base text-nb-ink-soft hover:text-nb-pink transition-colors"
                  {...(link.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
