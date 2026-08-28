"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { WidgetCard } from "./WidgetCard";
import { makeDither } from "@/lib/theme";
import {
  formatCompletionDate,
  formatCurrentStatus,
  getRecentPreview,
  type CurrentlyPlayingContent,
} from "@/lib/currently-playing";

export function CurrentlyPlaying({
  content,
}: {
  content: CurrentlyPlayingContent;
}) {
  const { t, mode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoverLabel, setHoverLabel] = useState(false);
  const recentPreview = getRecentPreview(content);

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
            {content.current?.title ?? content.emptyMessage}
          </div>
          {content.current && (
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
                {content.current.platform}
              </span>
              <span
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  borderRadius: 2,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      height: "200%",
                      animation: "pillScroll 2s steps(12) infinite",
                    }}
                  >
                    {[0, 1].map((copy) =>
                      ["#bb55ee","#4490dd","#22cc80","#eedd33","#ee7f3a","#dd4480"].map((c, i, a) => (
                        <span
                          key={`${copy}-${i}`}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `${((copy * a.length + i) / (a.length * 2)) * 100}%`,
                            height: `${100 / (a.length * 2)}%`,
                            backgroundColor: c,
                            backgroundImage: makeDither(0.15),
                            backgroundRepeat: "repeat",
                            imageRendering: "pixelated",
                          }}
                        />
                      ))
                    )}
                  </span>
                </span>
                <span style={{ position: "relative" }}>
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "25%",
                      bottom: "25%",
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                    }}
                  />
                  <span style={{ position: "relative", color: "#fff" }}>
                    {formatCurrentStatus(content.current.status).toUpperCase()}
                  </span>
                </span>
              </span>
            </div>
          )}
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
                aria-expanded={expanded}
                aria-controls="recently-completed-games"
                onMouseEnter={() => { setHoverLabel(true); setShowTooltip(true); }}
                onMouseLeave={() => { setHoverLabel(false); setShowTooltip(false); }}
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
            </span>
            {!expanded && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: t.muted,
                }}
              >
                {recentPreview.map((game) => game.title).join(" · ")}
              </span>
            )}
          </div>

          {expanded && (
            <div id="recently-completed-games" style={{ marginTop: 10 }}>
              {content.recentlyCompleted.map((game) => (
                <div
                  key={`${game.title}-${game.completed}`}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${t.innerBorder}`,
                  }}
                >
                  <span style={{ color: t.text }}>{game.title}</span>
                  <span
                    style={{
                      color: t.faint,
                      fontSize: 10,
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {formatCompletionDate(game.completed)}
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
