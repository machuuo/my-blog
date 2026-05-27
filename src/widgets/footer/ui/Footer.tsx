import { BLOG_AUTHOR } from "@/shared/lib/constants";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`relative mt-16 border-t-2 border-dashed border-nb-rule ${className ?? ""}`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="font-hand text-2xl text-nb-ink">-</div>
        <div className="font-hand2 text-sm text-nb-ink-soft">
          © {currentYear} {BLOG_AUTHOR} · made on rainy weekends
        </div>
      </div>

      {/* washi tape decoration */}
      <div
        className="nb-washi absolute -bottom-2 right-16 h-7 rounded-sm"
        style={{
          width: 100,
          transform: "rotate(6deg)",
          backgroundColor: "hsl(var(--nb-sky))",
        }}
        aria-hidden
      />
    </footer>
  );
}
