"use client";

import { useTheme } from "./ThemeProvider";

export function DitherDivider() {
  const { t } = useTheme();
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
