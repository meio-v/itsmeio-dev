"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export function BackLink() {
  const { t } = useTheme();
  return (
    <Link
      href="/"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 2,
        color: t.mgsText,
        textDecoration: "none",
        display: "inline-block",
        marginBottom: 24,
        transition: "color 0.15s",
      }}
    >
      &larr; BACK TO DEVLOG
    </Link>
  );
}
