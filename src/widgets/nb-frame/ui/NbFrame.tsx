"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NB_BODY, NB_HAND, NB_HAND2 } from "@/shared/lib/design-data";
import { WashiTape } from "@/shared/ui/notebook/WashiTape";
import { Squiggle } from "@/shared/ui/notebook/Squiggle";

const navItems = [
  { id: "home", label: "Home", kr: "집", href: "/" },
  { id: "tech", label: "Tech", kr: "공부", href: "/tech" },
  { id: "hobby", label: "Hobby", kr: "취미", href: "/hobby" },
  { id: "tags", label: "Tags", kr: "태그", href: "/tags" },
  { id: "about", label: "About", kr: "소개", href: "/about" },
];

function activeIdFromPath(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/tech")) return "tech";
  if (path.startsWith("/hobby")) return "hobby";
  if (path.startsWith("/tags")) return "tags";
  if (path.startsWith("/about")) return "about";
  return "";
}

const iconBtnStyle: React.CSSProperties = {
  fontFamily: NB_HAND,
  fontSize: 22,
  background: "transparent",
  border: "1.5px dashed var(--nb-rule)",
  color: "var(--nb-ink)",
  width: 34,
  height: 34,
  cursor: "pointer",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export function NbFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = activeIdFromPath(pathname || "/");
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("nb-theme") : null;
    if (stored === "dark") setDark(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.nbTheme = dark ? "dark" : "light";
    localStorage.setItem("nb-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div
      style={{
        fontFamily: NB_BODY,
        color: "var(--nb-ink)",
        background: "var(--nb-paper)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          padding: "24px 48px 18px",
          borderBottom: "2px dashed var(--nb-rule)",
          background: "var(--nb-paper)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ position: "relative" }}>
              <WashiTape
                color="var(--nb-memo)"
                width={70}
                rotate={-14}
                style={{ position: "absolute", top: -16, left: -6 }}
              />
              <h1
                style={{
                  fontFamily: NB_HAND,
                  fontSize: 56,
                  margin: 0,
                  lineHeight: 0.9,
                  color: "var(--nb-ink)",
                }}
              >
                산책 노트
              </h1>
              <div
                style={{
                  fontFamily: NB_HAND2,
                  fontSize: 18,
                  color: "var(--nb-ink-soft)",
                  marginTop: 2,
                }}
              >
                a walking notebook · since 2026
              </div>
            </div>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            {navItems.map((it) => {
              const on = it.id === active;
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  style={{
                    position: "relative",
                    fontFamily: NB_HAND,
                    fontSize: 28,
                    lineHeight: 1,
                    color: "var(--nb-ink)",
                    textDecoration: "none",
                    padding: "4px 6px",
                  }}
                >
                  {it.label}
                  <span
                    style={{
                      fontFamily: NB_HAND2,
                      fontSize: 13,
                      color: "var(--nb-ink-soft)",
                      marginLeft: 4,
                    }}
                  >
                    {it.kr}
                  </span>
                  {on ? <div style={{ position: "absolute", left: -2, right: -2, bottom: -4 }}>
                      <Squiggle width={64} color="var(--nb-memo)" />
                    </div> : null}
                </Link>
              );
            })}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: 12,
                paddingLeft: 14,
                borderLeft: "1px dashed var(--nb-rule)",
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="찾는 글이…"
                style={{
                  fontFamily: NB_HAND,
                  fontSize: 20,
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px solid var(--nb-ink)",
                  color: "var(--nb-ink)",
                  width: 140,
                  outline: "none",
                  padding: "2px 4px",
                }}
              />
              <button
                onClick={() => setDark((d) => !d)}
                style={iconBtnStyle}
                aria-label="theme"
                type="button"
              >
                {dark ? "☼" : "☾"}
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main
        className="nb-paper-bg nb-paper-edge"
        style={{ position: "relative", minHeight: "calc(100vh - 200px)" }}
      >
        {children}
      </main>

      <footer
        style={{
          padding: "32px 48px 36px",
          borderTop: "2px dashed var(--nb-rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          position: "relative",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontFamily: NB_HAND, fontSize: 26, color: "var(--nb-ink)" }}>
          — 끝까지 와줘서 고마워요 :)
        </div>
        <div style={{ fontFamily: NB_HAND2, fontSize: 16, color: "var(--nb-ink-soft)" }}>
          page 14 of 38 · made on rainy weekends · 2026
        </div>
        <WashiTape
          color="var(--sky-1)"
          width={100}
          rotate={6}
          style={{ position: "absolute", bottom: -10, right: 60 }}
        />
      </footer>
    </div>
  );
}
