"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { THEMES, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  t: Theme;
  mode: "light" | "dark";
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const t = THEMES[mode];
  const toggleMode = useCallback(
    () => setMode((m) => (m === "light" ? "dark" : "light")),
    []
  );

  return (
    <ThemeContext.Provider value={{ t, mode, toggleMode }}>
      <div
        style={
          {
            "--psx-bg": t.bg,
            "--psx-text": t.text,
            "--psx-muted": t.muted,
            "--psx-faint": t.faint,
            "--psx-border": t.border,
            "--psx-border-soft": t.borderSoft,
            "--psx-inner-border": t.innerBorder,
            "--psx-box-grad": t.boxGrad,
            "--psx-divider-dot": t.dividerDot,
            "--psx-shadow-border": t.shadowBorder,
            "--psx-shadow-dot": t.shadowDot,
            "--psx-dither-bg-dot": t.ditherBgDot,
            "--psx-label-bg": t.labelBg,
            "--psx-label-color": t.labelColor,
            "--psx-mgs-bg": t.mgsBg,
            "--psx-mgs-text": t.mgsText,
            "--psx-mgs-text-bright": t.mgsTextBright,
            "--psx-mgs-date": t.mgsDate,
            "--psx-mgs-border-accent": t.mgsBorderAccent,
            "--psx-selection-bg": t.selectionBg,
            "--psx-selection-text": t.selectionText,
            "--psx-nav-active": t.navActive,
            "--psx-nav-active-text": t.navActiveText,
            "--psx-banner-dither": t.bannerDither,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
