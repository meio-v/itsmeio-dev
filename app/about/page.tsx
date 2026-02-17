"use client";

import { useTheme } from "../_components/ThemeProvider";
import { PsxBox } from "../_components/PsxBox";
import { BackLink } from "../_components/BackLink";
import { PageShell } from "../_components/PageShell";

export default function AboutPage() {
  const { t } = useTheme();

  return (
    <PageShell>
      <BackLink />
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
            <p>
              ~10 years building software as a service, as a service ;)
            </p>
            <br />
            <p>
              Currently exploring Godot and Blender. Also into weightlifting,
              mechanical keyboards, and actually figuring out how to make AI
              tools useful. This blog explores both the technical and emotional
              side of working in tech.😉
            </p>
          </div>
        </div>
      </PsxBox>

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
    </PageShell>
  );
}
