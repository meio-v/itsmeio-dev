"use client";

import { useTheme } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

export function PageShell({ children }: { children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes menuSnap {
          0% { transform: translateY(6px) scaleY(0.3); }
          60% { transform: translateY(-2px) scaleY(1.05); }
          100% { transform: translateY(0) scaleY(1); }
        }
        @keyframes staticNoise {
          0% { opacity: 0.6; background-position: 0 0; }
          25% { opacity: 0.4; background-position: -20% -20%; }
          50% { opacity: 0.7; background-position: 40% -40%; }
          75% { opacity: 0.3; background-position: -60% 60%; }
          100% { opacity: 0; background-position: 20% 20%; }
        }
        @keyframes textFlicker {
          0% { opacity: 0.2; }
          10% { opacity: 1; }
          20% { opacity: 0.6; }
          30% { opacity: 1; }
          50% { opacity: 0.8; }
          60% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes ditherFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes scanFlash {
          0% { transform: translateY(-400%); }
          100% { transform: translateY(2500%); }
        }
        ::selection { background: ${t.selectionBg}; color: ${t.selectionText}; }
        body { background: ${t.bg}; transition: background 0.3s ease; }
      `}</style>

      <ThemeToggle />

      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: t.ditherBgOpacity,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='${t.ditherBgDot}'/%3E%3Crect x='4' y='4' width='2' height='2' fill='${t.ditherBgDot}'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 720,
          margin: "0 auto",
          padding: "24px 20px",
          fontFamily: "'IBM Plex Mono', monospace",
          color: t.text,
          background: t.bg,
          minHeight: "100vh",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        {children}

        <footer
          style={{
            borderTop: `2px solid ${t.border}`,
            marginTop: 48,
            padding: "24px 0",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -6,
              left: 0,
              right: 0,
              height: 1,
              background: `${t.border}22`,
            }}
          />
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: t.borderSoft,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            &copy; 2026 ITSMEIO.DEV
          </p>
        </footer>
      </div>
    </>
  );
}
