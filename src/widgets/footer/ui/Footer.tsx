import { BLOG_AUTHOR } from "@/shared/lib";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-border ${className ?? ""}`}
    >
      <div className="max-w-3xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {currentYear} {BLOG_AUTHOR}. All rights reserved.
        </p>
        <p className="mt-1">
          Built with Next.js &amp; GitHub Pages
        </p>
      </div>
    </footer>
  );
}
