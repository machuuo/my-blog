import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { NbFrame } from "@/widgets/nb-frame";
import { BLOG_NAME, BLOG_DESCRIPTION } from "@/shared/lib/constants";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: BLOG_NAME,
    template: `%s | ${BLOG_NAME}`,
  },
  description: BLOG_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Lora:ital,wght@0,400;0,500;1,400&family=Gowun+Dodum&family=Gowun+Batang:wght@400;700&family=Gaegu:wght@400;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ background: "var(--nb-paper)" }}
      >
        <NbFrame>{children}</NbFrame>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--nb-paper)",
              color: "var(--nb-ink)",
              border: "1.5px solid var(--nb-rule)",
              fontFamily: "var(--nb-font-hand2)",
              fontSize: 16,
              boxShadow: "var(--nb-shadow-md)",
            },
          }}
        />
      </body>
    </html>
  );
}
