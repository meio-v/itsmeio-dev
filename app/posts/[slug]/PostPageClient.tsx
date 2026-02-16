"use client";

import { useTheme } from "@/app/_components/ThemeProvider";
import { PageShell } from "@/app/_components/PageShell";
import { MGSHeader } from "@/app/_components/MGSHeader";
import { Tag } from "@/app/_components/Tag";
import { BackLink } from "@/app/_components/BackLink";
import type { PostMeta } from "@/lib/posts";

export function PostPageClient({
  meta,
  children,
}: {
  meta: PostMeta;
  children: React.ReactNode;
}) {
  const { t } = useTheme();

  return (
    <PageShell>
      <BackLink />

      <div
        style={{
          padding: 3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='rgba(100,190,100,0.15)'/%3E%3Crect x='2' y='2' width='2' height='2' fill='rgba(100,190,100,0.15)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          marginBottom: 32,
        }}
      >
        <MGSHeader>
          <div
            style={{
              padding: "32px 24px 24px",
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: t.mgsDate,
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              {meta.date} &middot; {meta.readingTime}
            </div>
            <h1
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 24,
                fontWeight: 600,
                lineHeight: 1.4,
                color: t.mgsTextBright,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {meta.title}
            </h1>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {meta.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        </MGSHeader>
      </div>

      <article>{children}</article>
    </PageShell>
  );
}
