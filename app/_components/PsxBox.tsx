"use client";

import { useTheme } from "./ThemeProvider";

export function PsxBox({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { t } = useTheme();
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
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
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
