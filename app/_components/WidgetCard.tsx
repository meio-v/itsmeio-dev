"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

const HEADER_LABEL: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 2,
  textTransform: "uppercase",
  textShadow: "0 0 8px rgba(100,200,100,0.3)",
};

export function WidgetCard({
  title,
  titleColor,
  right,
  children,
  containerStyle,
}: {
  title: string;
  titleColor?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  containerStyle?: React.CSSProperties;
}) {
  const { t } = useTheme();
  const [active, setActive] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const animKey = useRef(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const trigger = () => {
    animKey.current += 1;
    setKey(animKey.current);
    setActive(true);
  };

  return (
    <div
      style={{
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: t.border,
        overflow: "hidden",
        ...containerStyle,
      }}
    >
      {/* MGS header bar */}
      <div
        onMouseEnter={canHover ? trigger : undefined}
        onMouseLeave={canHover ? () => setActive(false) : undefined}
        onPointerDown={!canHover ? trigger : undefined}
        onPointerUp={!canHover ? () => setActive(false) : undefined}
        style={{
          background: t.mgsBg,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${t.mgsBorderAccent}`,
          position: "relative",
          overflow: "hidden",
          cursor: "default",
        }}
      >
        <span style={{ ...HEADER_LABEL, color: titleColor ?? t.mgsTextBright, position: "relative", zIndex: 1 }}>
          {"\u25B8"} {title}
        </span>
        {right && <span style={{ position: "relative", zIndex: 1 }}>{right}</span>}

        {/* Dither fade-in overlay */}
        <span
          key={`dither-${key}`}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${encodeURIComponent(t.mgsBg)}'/%3E%3Crect x='2' y='2' width='2' height='2' fill='${encodeURIComponent(t.mgsBg)}'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            animation: active ? "ditherFade 0.3s steps(4) forwards" : "none",
            opacity: active ? undefined : 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
        {/* Scanline flash */}
        <span
          key={`scan-${key}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(180deg, transparent, rgba(120,220,120,0.8), transparent)",
            animation: active ? "scanFlash 0.4s ease-out forwards" : "none",
            opacity: active ? undefined : 0,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      </div>

      {children}
    </div>
  );
}
