"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { MGSHeader } from "./MGSHeader";
import { PsxBox } from "./PsxBox";
import { Tag } from "./Tag";
import { DitherDivider } from "./DitherDivider";
import { PostCard } from "./PostCard";
import { CurrentlyPlaying } from "./CurrentlyPlaying";
import { SquishCat } from "./SquishCat";
import { PageShell } from "./PageShell";
import type { PostMeta } from "@/lib/posts";

const TABS = ["DEVLOG", "ABOUT", "PORTFOLIO"] as const;

interface Project {
  title: string;
  description: string;
  tags: string[];
}

const PROJECTS: Project[] = [
  {
    title: "AI Business Intelligence Platform",
    description:
      "Led architecture and development of AI-driven integrations, knowledge graph modeling, and meeting ingestion pipelines for an executive-facing startup.",
    tags: ["Python", "Neo4j", "OpenAI", "Auth0", "AWS", "Prompt Engineering"],
  },
  {
    title: "Same-Day Delivery Platform",
    description:
      "Core backend developer on a parcel delivery PaaS operating across two countries. Owned architecture for multiple business-critical services.",
    tags: [
      "TypeScript",
      "Express",
      ".NET",
      "AWS Lambda",
      "DynamoDB",
      "SQS/SNS",
      "Terraform",
      "Serverless",
      "React",
    ],
  },
  {
    title: "Agency Work — Logistics, Education, B2B SaaS",
    description:
      "Full stack delivery across multiple client engagements spanning backend systems, client-facing dashboards, and cloud deployments.",
    tags: ["Node.js", "TypeScript", "Django", "Laravel", ".NET", "C#"],
  },
  {
    title: "Indie Game Development Journey",
    description: "Currently exploring. More details soon.",
    tags: ["Godot", "Blender", "GDScript"],
  },
];

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
            <strong style={{ color: t.text }}>Meio</strong> — Developer,
            husband, cat dad of 5.
          </p>
          <br />
          <p>~10 years building software as a service, as a service ;)</p>
          <br />
          <p>
            Currently exploring Godot and Blender. Also into weightlifting,
            mechanical keyboards, and actually figuring out how to make AI tools
            useful. This blog explores both the technical and emotional side of
            working in tech.😉
          </p>
        </div>
      </div>
    </PsxBox>
  );
}

function Links() {
  const { t } = useTheme();
  return (
    <PsxBox title="LINKS">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 14,
        }}
      >
        <a
          href="https://github.com/meio-v"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: t.text,
            textDecoration: "none",
            borderBottom: `1px dotted ${t.muted}`,
            paddingBottom: 2,
            display: "inline-block",
            width: "fit-content",
          }}
        >
          {">"} github.com/meio-v
        </a>
        <a
          href="https://www.linkedin.com/in/meio/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: t.text,
            textDecoration: "none",
            borderBottom: `1px dotted ${t.muted}`,
            paddingBottom: 2,
            display: "inline-block",
            width: "fit-content",
          }}
        >
          {">"} linkedin.com/in/meio
        </a>
      </div>
    </PsxBox>
  );
}

function Portfolio() {
  const { t } = useTheme();
  return (
    <>
      {PROJECTS.map((project, i) => (
        <div key={project.title}>
          <PsxBox title={`0${i + 1}`}>
            <h2
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 16,
                fontWeight: 600,
                color: t.text,
                marginBottom: 12,
              }}
            >
              {project.title}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: t.muted,
                fontFamily: "'IBM Plex Mono', monospace",
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              {project.description}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {project.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </PsxBox>
          {i < PROJECTS.length - 1 && <DitherDivider />}
        </div>
      ))}
      <DitherDivider />
      <Links />
    </>
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
        <MGSHeader bgImage="/goggles.png" tall>
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
          <CurrentlyPlaying />
          <SquishCat />
        </>
      )}
      {tab === "ABOUT" && <About />}
      {tab === "PORTFOLIO" && <Portfolio />}

    </PageShell>
  );
}
