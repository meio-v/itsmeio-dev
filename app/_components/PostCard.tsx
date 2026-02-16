"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { MGSHeader } from "./MGSHeader";
import { Tag } from "./Tag";
import type { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/posts/${post.slug}`} style={{ textDecoration: "none" }}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `2px solid ${t.border}`,
          marginBottom: 24,
          position: "relative",
          background: t.bg,
          transform: hovered ? "scale(1.01)" : "none",
          transition: "transform 0.1s ease",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            right: -4,
            bottom: -4,
            border: `2px solid ${t.shadowBorder}`,
            zIndex: -1,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${encodeURIComponent(t.shadowDot)}'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
        {/* Static noise burst on hover */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='1' fill='${encodeURIComponent(t.fg)}' opacity='0.4'/%3E%3Crect x='3' y='2' width='1' height='1' fill='${encodeURIComponent(t.fg)}' opacity='0.3'/%3E%3Crect x='1' y='4' width='1' height='1' fill='${encodeURIComponent(t.fg)}' opacity='0.5'/%3E%3Crect x='5' y='1' width='1' height='1' fill='${encodeURIComponent(t.fg)}' opacity='0.3'/%3E%3Crect x='4' y='5' width='1' height='1' fill='${encodeURIComponent(t.fg)}' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            animation: hovered
              ? "staticNoise 0.25s steps(5) forwards"
              : "none",
            opacity: hovered ? undefined : 0,
          }}
        />
        <MGSHeader>
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: `1px solid ${t.mgsBorderAccent}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Scanline flash on hover */}
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background:
                  "linear-gradient(180deg, transparent, rgba(120,220,120,0.8), transparent)",
                opacity: hovered ? 1 : 0,
                animation: hovered
                  ? "scanFlash 0.25s ease-out forwards"
                  : "none",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: t.mgsDate,
                letterSpacing: 1,
                marginBottom: 8,
                animation: hovered
                  ? "textFlicker 0.3s ease-out forwards"
                  : "none",
              }}
            >
              {post.date}
            </div>
            <h2
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.4,
                color: t.mgsTextBright,
                animation: hovered
                  ? "textFlicker 0.3s ease-out forwards"
                  : "none",
              }}
            >
              {post.title}
            </h2>
          </div>
        </MGSHeader>
        <div style={{ padding: "16px 20px" }}>
          <p
            style={{
              color: t.muted,
              fontSize: 14,
              lineHeight: 1.7,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {post.excerpt}
          </p>
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${t.borderSoft}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {post.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          {post.readingTime && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: t.faint,
                letterSpacing: 1,
              }}
            >
              {post.readingTime}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
