"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { t, mode, toggleMode } = useTheme();
  return (
    <button
      onClick={toggleMode}
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
      {mode === "light" ? "\u25D7" : "\u25D6"}
    </button>
  );
}
