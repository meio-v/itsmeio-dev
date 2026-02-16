"use client";

import { useTheme } from "./ThemeProvider";

export function Tag({ children }: { children: string }) {
  const { t } = useTheme();
  const colors = t.tags[children as keyof typeof t.tags] || {
    bg: "#eee",
    color: "#555",
  };
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
