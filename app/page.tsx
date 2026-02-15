"use client";

import { useState } from "react";

const THEMES = {
  light: {
    bg: "#fff",
    text: "#000",
    muted: "#555",
    faint: "#aaa",
    border: "#000",
    borderSoft: "#ddd",
    innerBorder: "rgba(0,0,0,0.05)",
    boxGrad: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.005) 100%)",
    dividerDot: "black",
    dividerOpacity: 0.12,
    shadowBorder: "rgba(0,0,0,0.1)",
    shadowDot: "rgba(0,0,0,0.08)",
    ditherBgDot: "black",
    ditherBgOpacity: 0.025,
    avatarA: "#ddd",
    avatarB: "#eee",
    navActive: "#000",
    navActiveText: "#fff",
    selectionBg: "#000",
    selectionText: "#fff",
    labelBg: "#fff",
    labelColor: "#999",
    mgsBg: "#050e08",
    mgsText: "#88cc88",
    mgsTextBright: "#aaeaaa",
    mgsDate: "rgba(136,204,136,0.5)",
    mgsBorderAccent: "#2a5a3a",
    tags: {
      GODOT: { bg: "#d4edda", color: "#1e5a2d" },
      GAMEDEV: { bg: "#f0d4e8", color: "#5a1e4a" },
      PSX: { bg: "#d4e4f0", color: "#1e3a5a" },
      BLENDER: { bg: "#f0e0d0", color: "#5a3a1e" },
      "3D": { bg: "#e4d4f0", color: "#4a1e5a" },
      TECH: { bg: "#d0f0f0", color: "#1e5a5a" },
      AI: { bg: "#f0f0d0", color: "#4a4a1e" },
      DX: { bg: "#d0f0e0", color: "#1e5a3a" },
      GDScript: { bg: "#d8ecd0", color: "#2d4a1e" },
      MUSIC: { bg: "#f0d0d8", color: "#5a1e2a" },
    },
  },
  dark: {
    bg: "#000",
    text: "#fff",
    muted: "#999",
    faint: "#555",
    border: "#fff",
    borderSoft: "#333",
    innerBorder: "rgba(255,255,255,0.06)",
    boxGrad: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
    dividerDot: "white",
    dividerOpacity: 0.25,
    shadowBorder: "rgba(255,255,255,0.15)",
    shadowDot: "rgba(255,255,255,0.1)",
    ditherBgDot: "white",
    ditherBgOpacity: 0.03,
    avatarA: "#333",
    avatarB: "#111",
    navActive: "#fff",
    navActiveText: "#000",
    selectionBg: "#fff",
    selectionText: "#000",
    labelBg: "#000",
    labelColor: "#666",
    mgsBg: "#060f0a",
    mgsText: "#88cc88",
    mgsTextBright: "#bbffbb",
    mgsDate: "rgba(136,204,136,0.45)",
    mgsBorderAccent: "#3a7a4a",
    tags: {
      GODOT: { bg: "#2d5a1e", color: "#7ec850" },
      GAMEDEV: { bg: "#5a1e4a", color: "#d06eb0" },
      PSX: { bg: "#1e3a5a", color: "#50a0e8" },
      BLENDER: { bg: "#5a3a1e", color: "#e8a050" },
      "3D": { bg: "#4a1e5a", color: "#b050e8" },
      TECH: { bg: "#1e5a5a", color: "#50d8d8" },
      AI: { bg: "#5a5a1e", color: "#d8d850" },
      DX: { bg: "#1e5a3a", color: "#50e8a0" },
      GDScript: { bg: "#2d4a1e", color: "#88c840" },
      MUSIC: { bg: "#5a1e2a", color: "#e85070" },
    },
  },
};

type Theme = typeof THEMES.light;

const POSTS = [
  {
    date: "2026.02.10",
    title: "Blender Low-Poly Workflow Notes",
    body: "Documenting my process for creating low-poly character models. Keeping things under 300 polys per character with 64x64 textures. The constraint is the creativity.",
    tags: ["BLENDER", "3D"],
  },
  {
    date: "2026.02.05",
    title: "Agentic Coding with Cursor: My Workflow",
    body: "I've been refining how I use AI-assisted coding for frontend work. The key insight: treat it as architectural review, not code generation. Here's the process I've landed on.",
    tags: ["TECH", "AI", "DX"],
  },
];

const TABS = ["DEVLOG", "ABOUT", "PORTFOLIO"] as const;

function makeDither(opacity: number) {
  return `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='rgba(100,190,100,${opacity})'/%3E%3Crect x='2' y='2' width='2' height='2' fill='rgba(100,190,100,${opacity})'/%3E%3C/svg%3E")`;
}

const BANDS = [
  { density: 0.22, pct: 11 },
  { density: 0.18, pct: 5 },
  { density: 0.15, pct: 11 },
  { density: 0.12, pct: 5 },
  { density: 0.09, pct: 11 },
  { density: 0.06, pct: 5 },
  { density: 0.04, pct: 11 },
  { density: 0.02, pct: 5 },
  { density: 0, pct: 36 },
];

function DitherDivider({ t }: { t: Theme }) {
  return (
    <div
      style={{
        height: 8,
        margin: "32px 0",
        opacity: t.dividerOpacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${t.dividerDot}'/%3E%3Crect x='4' y='4' width='2' height='2' fill='${t.dividerDot}'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}

function MGSHeader({ children, t, tall }: { children: React.ReactNode; t: Theme; tall?: boolean }) {
  const h = tall ? 120 : "auto";
  let topOffset = 0;

  return (
    <div style={{ position: "relative", height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: t.mgsBg }} />

      {BANDS.map((band, i) => {
        const top = topOffset;
        topOffset += band.pct;
        if (band.density === 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${top}%`,
              left: 0,
              right: 0,
              height: `${band.pct}%`,
              backgroundImage: makeDither(band.density),
              backgroundRepeat: "repeat",
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 1,
          background: `${t.mgsBorderAccent}88`,
          zIndex: 2,
        }}
      />

      <div style={{ position: "relative", zIndex: 3, height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

function PsxBox({ title, t, children }: { title?: string; t: Theme; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `2px solid ${t.border}`,
        background: t.boxGrad,
        padding: 24,
        marginBottom: 24,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4, left: 4, right: 4, bottom: 4,
          border: `1px solid ${t.innerBorder}`,
          pointerEvents: "none",
        }}
      />
      {title && (
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: t.labelColor,
            position: "absolute",
            top: -7,
            left: 16,
            background: t.labelBg,
            padding: "0 8px",
          }}
        >
          {title}
        </span>
      )}
      <div style={{ paddingTop: title ? 8 : 0 }}>{children}</div>
    </div>
  );
}

function Tag({ children, t }: { children: string; t: Theme }) {
  const colors = t.tags[children as keyof typeof t.tags] || { bg: "#eee", color: "#555" };
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        fontWeight: 600,
        color: colors.color,
        background: colors.bg,
        padding: "3px 8px",
        letterSpacing: 1,
        display: "inline-block",
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}

function PostCard({ post, t }: { post: typeof POSTS[number]; t: Theme }) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${t.border}`,
        marginBottom: 24,
        position: "relative",
        background: t.bg,
        transform: hovered ? "translate(-2px, -2px)" : "none",
        transition: "transform 0.1s ease",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4, left: 4, right: -4, bottom: -4,
          border: `2px solid ${t.shadowBorder}`,
          zIndex: -1,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${encodeURIComponent(t.shadowDot)}'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
      <MGSHeader t={t}>
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid ${t.mgsBorderAccent}`,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: t.mgsDate,
              letterSpacing: 1,
              marginBottom: 8,
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
            }}
          >
            {post.title}
          </h2>
        </div>
      </MGSHeader>
      <div style={{ padding: "16px 20px" }}>
        <p style={{ color: t.muted, fontSize: 14, lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
          {post.body}
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
            <Tag key={tag} t={t}>{tag}</Tag>
          ))}
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, color: t.text, letterSpacing: 1 }}>
          READ →
        </span>
      </div>
    </article>
  );
}

function Devlog({ t }: { t: Theme }) {
  return (
    <PsxBox title="LATEST POSTS" t={t}>
      {POSTS.map((p, i) => (
        <PostCard key={i} post={p} t={t} />
      ))}
    </PsxBox>
  );
}

function About({ t }: { t: Theme }) {
  return (
    <PsxBox title="ABOUT" t={t}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
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
        <div style={{ color: t.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, lineHeight: 1.7, flex: 1, minWidth: 200 }}>
          <p><strong style={{ color: t.text }}>Meio</strong> — developer, creative, maker of things.</p>
          <br />
          <p>~10 years building for the web. Currently exploring PSX aesthetics, creative tooling, and gamedev with Godot + Blender.</p>
          <br />
          <p>
            Also into music production, mechanical keyboards, and figuring out how to make AI tools actually useful
            <span style={{ animation: "blink 1s step-end infinite", marginLeft: 2 }}>█</span>
          </p>
        </div>
      </div>
    </PsxBox>
  );
}

function Portfolio({ t }: { t: Theme }) {
  return (
    <PsxBox title="PORTFOLIO" t={t}>
      <p style={{ fontSize: 14, color: t.muted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7, marginBottom: 12 }}>
        Currently working on something. More details soon.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Tag t={t}>GODOT</Tag>
        <Tag t={t}>BLENDER</Tag>
        <Tag t={t}>GDScript</Tag>
      </div>
    </PsxBox>
  );
}

function ThemeToggle({ mode, onToggle, t }: { mode: string; onToggle: () => void; t: Theme }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 100,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 18,
        background: t.border,
        color: t.bg,
        border: "none",
        width: 40,
        height: 40,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}
      title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {mode === "light" ? "◗" : "◖"}
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState<typeof TABS[number]>("DEVLOG");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const t = THEMES[mode];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        ::selection { background: ${t.selectionBg}; color: ${t.selectionText}; }
      `}</style>

      <ThemeToggle mode={mode} onToggle={() => setMode(mode === "light" ? "dark" : "light")} t={t} />

      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: t.ditherBgOpacity,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${t.ditherBgDot}'/%3E%3Crect x='4' y='4' width='2' height='2' fill='${t.ditherBgDot}'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 720,
          margin: "0 auto",
          padding: "24px 20px",
          fontFamily: "'IBM Plex Mono', monospace",
          color: t.text,
          background: t.bg,
          minHeight: "100vh",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        <header style={{ marginBottom: 32 }}>
          <MGSHeader t={t}>
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
                  textShadow: "0 0 12px rgba(100,200,100,0.4), 0 0 30px rgba(100,200,100,0.2)",
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
                <span style={{ animation: "blink 1s step-end infinite", marginLeft: 2 }}>█</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.mgsDate,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                gamedev · creative · tech
              </div>
            </div>
          </MGSHeader>
          <div style={{ height: 1, background: `${t.mgsBorderAccent}88` }} />
        </header>

        <nav style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0", marginBottom: 32, flexWrap: "wrap" }}>
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
              {tab === name ? "▸ " : ""}{name}
            </button>
          ))}
        </nav>

        {tab === "DEVLOG" && (
          <>
            <Devlog t={t} />
            <DitherDivider t={t} />
            <About t={t} />
            <DitherDivider t={t} />
            <Portfolio t={t} />
          </>
        )}
        {tab === "ABOUT" && <About t={t} />}
        {tab === "PORTFOLIO" && <Portfolio t={t} />}

        <footer
          style={{
            borderTop: `2px solid ${t.border}`,
            marginTop: 48,
            padding: "24px 0",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: -6, left: 0, right: 0, height: 1, background: `${t.border}22` }} />
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: t.borderSoft, letterSpacing: 2, textTransform: "uppercase" }}>
            © 2026 ITSMEIO.DEV
          </p>
        </footer>
      </div>
    </>
  );
}
