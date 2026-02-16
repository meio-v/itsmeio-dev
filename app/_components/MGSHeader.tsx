"use client";

import { useTheme } from "./ThemeProvider";
import { makeDither, BANDS } from "@/lib/theme";

export function MGSHeader({
  children,
  tall,
  bgImage,
}: {
  children: React.ReactNode;
  tall?: boolean;
  bgImage?: string;
}) {
  const { t } = useTheme();
  const h = tall ? 120 : "auto";
  let topOffset = 0;

  return (
    <div style={{ position: "relative", height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: t.mgsBg }} />

      {bgImage && (
        <img
          src={bgImage}
          alt=""
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 220,
            height: "auto",
            imageRendering: "pixelated",
            zIndex: 1,
          }}
        />
      )}

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
              height: `calc(${band.pct}% + 0.5px)`,
              backgroundColor: `${t.mgsBg}99`,
              backgroundImage: makeDither(band.density),
              backgroundRepeat: "repeat",
              zIndex: 2,
            }}
          />
        );
      })}

      <div style={{ position: "relative", zIndex: 3, height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
