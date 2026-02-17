"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { MGSHeader } from "./MGSHeader";
import { PsxBox } from "./PsxBox";
import { DitherDivider } from "./DitherDivider";
import { PostCard } from "./PostCard";
import { CurrentlyPlaying } from "./CurrentlyPlaying";
import { PageShell } from "./PageShell";
import type { PostMeta } from "@/lib/posts";

const NAV_LINKS = [
  { label: "DEVLOG", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "PORTFOLIO", href: "/portfolio" },
] as const;

export function HomeClient({ posts }: { posts: PostMeta[] }) {
  const { t } = useTheme();

  return (
    <PageShell>
      <header
        style={{
          marginBottom: 32,
          padding: 3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${encodeURIComponent(t.bannerDither)}'/%3E%3Crect x='2' y='2' width='2' height='2' fill='${encodeURIComponent(t.bannerDither)}'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      >
        <MGSHeader bgImage="/goggles.png">
          <div style={{ padding: "48px 20px 36px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: 8,
                color: t.mgsTextBright,
                textTransform: "uppercase",
                marginBottom: 8,
                textShadow:
                  "0 0 12px rgba(100,200,100,0.4), 0 0 30px rgba(100,200,100,0.2)",
              }}
            >
              ITSMEIO.DEV
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                color: t.mgsText,
                letterSpacing: 2,
                marginBottom: 12,
                opacity: 0.8,
                textShadow: "0 0 8px rgba(100,200,100,0.3)",
              }}
            >
              it&apos;s meio the dev
              <span
                style={{
                  animation: "blink 1s step-end infinite",
                  marginLeft: 2,
                }}
              >
                {"\u2588"}
              </span>
            </div>
          </div>
        </MGSHeader>
      </header>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "16px 0",
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        {NAV_LINKS.map((link) => {
          const isActive = link.href === "/";
          return (
            <Link
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 2,
                color: isActive ? t.navActiveText : t.faint,
                background: isActive ? t.navActive : "transparent",
                border: `1px solid ${isActive ? t.border : t.borderSoft}`,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              {isActive ? "\u25B8 " : ""}
              {link.label}
            </Link>
          );
        })}
      </nav>

      <PsxBox title="LATEST POSTS">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </PsxBox>
      <DitherDivider />
      <CurrentlyPlaying />
    </PageShell>
  );
}
