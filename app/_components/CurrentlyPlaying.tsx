"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { WidgetCard } from "./WidgetCard";

const GAME = {
  title: "Uncharted 4: A Thief's End",
  platform: "STEAM",
  status: "IN PROGRESS",
};

const RECENT_PREVIEW = ["God of War Ragnarok", "Control", "Borderlands 4"];

const GAME_LOG = [
  { title: "God of War Ragnarok", date: "Feb 2026" },
  { title: "Control", date: "Jan 2026" },
  { title: "Borderlands 4", date: "Jan 2026" },
  { title: "Lost Judgement", date: "Sep 2025" },
  { title: "Split Fiction", date: "Sep 2025" },
  { title: "Borderlands 3", date: "Apr 2025" },
  { title: "Metaphor Refantazio", date: "Apr 2025" },
  { title: "Spiderman 2", date: "Mar 2025" },
  { title: "AC Odyssey", date: "Feb 2025" },
  { title: "Ghost of Tsushima", date: "Aug 2024" },
  { title: "Cyberpunk 2077 Phantom Liberty", date: "Jul 2024" },
  { title: "RGG Infinite Wealth", date: "Jun 2024" },
  { title: "Persona 3 Reload", date: "2024" },
  { title: "Resi 4 Remake", date: "Jan 2024" },
];

export function CurrentlyPlaying() {
  const { t, mode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoverLabel, setHoverLabel] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <WidgetCard title="NOW PLAYING">
      {/* Body */}
      <div style={{ padding: "16px 16px 20px" }}>
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 15,
              fontWeight: 600,
              color: t.text,
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {GAME.title}
          </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: t.muted,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  background: mode === "dark" ? "#333" : "#e0e0e0",
                  color: mode === "dark" ? "#bbb" : "#555",
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  borderRadius: 2,
                }}
              >
                {GAME.platform}
              </span>
              <span
                style={{
                  background: t.mgsBg,
                  color: t.mgsText,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  borderRadius: 2,
                }}
              >
                {GAME.status}
              </span>
            </div>
        </div>

        {/* Recently played */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: `1px solid ${t.borderSoft}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
              <button
                onClick={() => setExpanded(!expanded)}
                onMouseEnter={canHover ? () => { setHoverLabel(true); setShowTooltip(true); } : undefined}
                onMouseLeave={canHover ? () => { setHoverLabel(false); setShowTooltip(false); } : undefined}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  color: hoverLabel ? t.mgsText : t.faint,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.15s ease",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.15s ease",
                    transform: expanded ? "rotate(90deg) translateX(2px)" : "rotate(0deg) translateY(-2px)",
                    fontSize: 8,
                    lineHeight: 1,
                  }}
                >
                  {"\u25B6"}
                </span>
                <span style={{ borderBottom: `1px dotted ${hoverLabel ? t.mgsText : t.faint}`, paddingBottom: 1, transition: "border-color 0.15s ease" }}>
                  RECENTLY COMPLETED
                </span>
                {":"}
              </button>
              {canHover && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: 0,
                    background: t.mgsBg,
                    color: t.mgsText,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    padding: "4px 10px",
                    whiteSpace: "nowrap",
                    border: `1px solid ${t.mgsBorderAccent}`,
                    pointerEvents: "none",
                    textShadow: "0 0 6px rgba(100,200,100,0.2)",
                    opacity: showTooltip ? 1 : 0,
                    overflow: "hidden",
                    transition: "opacity 0.05s ease",
                    animation: showTooltip
                      ? "menuSnap 0.15s cubic-bezier(0.2, 0, 0.2, 1) forwards"
                      : "none",
                    transformOrigin: "bottom left",
                  }}
                >
                  {"i've seen the credits roll"}
                  {/* Dither fade-in overlay */}
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${encodeURIComponent(t.mgsBg)}'/%3E%3Crect x='2' y='2' width='2' height='2' fill='${encodeURIComponent(t.mgsBg)}'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "repeat",
                      animation: showTooltip
                        ? "ditherFade 0.3s steps(4) forwards"
                        : "none",
                      opacity: showTooltip ? undefined : 1,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Scanline flash */}
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background:
                        "linear-gradient(180deg, transparent, rgba(120,220,120,0.8), transparent)",
                      animation: showTooltip
                        ? "scanFlash 0.4s ease-out forwards"
                        : "none",
                      pointerEvents: "none",
                    }}
                  />
                </span>
              )}
            </span>
            {!expanded && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: t.muted,
                }}
              >
                {RECENT_PREVIEW.join(" · ")}
              </span>
            )}
          </div>

          {expanded && (
            <div style={{ marginTop: 10 }}>
              {GAME_LOG.map((g) => (
                <div
                  key={g.title}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${t.innerBorder}`,
                  }}
                >
                  <span style={{ color: t.text }}>{g.title}</span>
                  <span
                    style={{
                      color: t.faint,
                      fontSize: 10,
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {g.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
