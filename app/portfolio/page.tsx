"use client";

import { useTheme } from "../_components/ThemeProvider";
import { PsxBox } from "../_components/PsxBox";
import { Tag } from "../_components/Tag";
import { DitherDivider } from "../_components/DitherDivider";
import { BackLink } from "../_components/BackLink";
import { PageShell } from "../_components/PageShell";

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

export default function PortfolioPage() {
  const { t } = useTheme();

  return (
    <PageShell>
      <BackLink />
      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 4,
          color: t.text,
          textTransform: "uppercase",
          marginBottom: 32,
        }}
      >
        Portfolio
      </h1>

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
    </PageShell>
  );
}
