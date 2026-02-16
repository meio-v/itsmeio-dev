"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { MGSHeader } from "./MGSHeader";
import { PsxBox } from "./PsxBox";
import { Tag } from "./Tag";
import { DitherDivider } from "./DitherDivider";
import { PostCard } from "./PostCard";
import { CurrentlyPlaying } from "./CurrentlyPlaying";
import { PageShell } from "./PageShell";
import type { PostMeta } from "@/lib/posts";

const TABS = ["DEVLOG", "ABOUT", "PORTFOLIO"] as const;

function About() {
  const { t } = useTheme();
  return (
    <PsxBox title="ABOUT">
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <img
          src="/me.png"
          alt="Meio"
          style={{
            width: 80,
            height: 80,
            border: `2px solid ${t.border}`,
            objectFit: "cover",
            flexShrink: 0,
            imageRendering: "pixelated",
          }}
        />
        <div
          style={{
            color: t.muted,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 14,
            lineHeight: 1.7,
            flex: 1,
            minWidth: 200,
          }}
        >
          <p>
            <strong style={{ color: t.text }}>Meio</strong> — developer,
            creative, maker of things.
          </p>
          <br />
          <p>
            ~10 years building for the web. Currently exploring PSX aesthetics,
            creative tooling, and gamedev with Godot + Blender.
          </p>
          <br />
          <p>
            Also into music production, mechanical keyboards, and figuring out
            how to make AI tools actually useful
          </p>
        </div>
      </div>
    </PsxBox>
  );
}

function Portfolio() {
  return (
    <PsxBox title="PORTFOLIO">
      <p
        style={{
          fontSize: 14,
          color: "var(--psx-muted)",
          fontFamily: "'IBM Plex Mono', monospace",
          lineHeight: 1.7,
          marginBottom: 12,
        }}
      >
        Currently working on something. More details soon.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Tag>GODOT</Tag>
        <Tag>BLENDER</Tag>
        <Tag>GDScript</Tag>
      </div>
    </PsxBox>
  );
}

export function HomeClient({ posts }: { posts: PostMeta[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("DEVLOG");
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
        {TABS.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              color: tab === name ? t.navActiveText : t.faint,
              background: tab === name ? t.navActive : "transparent",
              border: `1px solid ${tab === name ? t.border : t.borderSoft}`,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              textTransform: "uppercase",
            }}
          >
            {tab === name ? "\u25B8 " : ""}
            {name}
          </button>
        ))}
      </nav>

      {tab === "DEVLOG" && (
        <>
          <PsxBox title="LATEST POSTS">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </PsxBox>
          <DitherDivider />
          <About />
          <DitherDivider />
          <CurrentlyPlaying />
          <DitherDivider />
          <Portfolio />
        </>
      )}
      {tab === "ABOUT" && <About />}
      {tab === "PORTFOLIO" && <Portfolio />}
    </PageShell>
  );
}
