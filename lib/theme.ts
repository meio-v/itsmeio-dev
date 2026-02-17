export const THEMES = {
  light: {
    bg: "#fff",
    text: "#000",
    muted: "#555",
    faint: "#aaa",
    border: "#000",
    borderSoft: "#ddd",
    innerBorder: "rgba(0,0,0,0.05)",
    boxGrad:
      "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.005) 100%)",
    dividerDot: "black",
    dividerOpacity: 0.12,
    shadowBorder: "rgba(0,0,0,0.1)",
    shadowDot: "rgba(0,0,0,0.08)",
    ditherBgDot: "black",
    ditherBgOpacity: 0.05,
    avatarA: "#ddd",
    avatarB: "#eee",
    navActive: "#000",
    navActiveText: "#fff",
    selectionBg: "#000",
    selectionText: "#fff",
    labelBg: "#fff",
    labelColor: "#999",
    mgsBg: "#050e08",
    mgsText: "#88cc88",
    mgsTextBright: "#90d890",
    mgsDate: "rgba(136,204,136,0.5)",
    mgsBorderAccent: "#2a5a3a",
    bannerDither: "#000",
    tagCategories: {
      engine: {
        color: "#3d7a3d",
        bg: "rgba(61, 122, 61, 0.06)",
        hoverBg: "rgba(61, 122, 61, 0.12)",
      },
      creative: {
        color: "#8a6a30",
        bg: "rgba(138, 106, 48, 0.06)",
        hoverBg: "rgba(138, 106, 48, 0.12)",
      },
      meta: {
        color: "#5a6a80",
        bg: "rgba(90, 106, 128, 0.06)",
        hoverBg: "rgba(90, 106, 128, 0.12)",
      },
      personal: {
        color: "#b86a8c",
        bg: "rgba(184, 106, 140, 0.06)",
        hoverBg: "rgba(184, 106, 140, 0.12)",
      },
    },
  },
  dark: {
    bg: "#1a1a1a",
    text: "#fff",
    muted: "#999",
    faint: "#555",
    border: "#fff",
    borderSoft: "#333",
    innerBorder: "rgba(255,255,255,0.06)",
    boxGrad:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
    dividerDot: "white",
    dividerOpacity: 0.25,
    shadowBorder: "rgba(255,255,255,0.15)",
    shadowDot: "rgba(255,255,255,0.1)",
    ditherBgDot: "white",
    ditherBgOpacity: 0.035,
    avatarA: "#333",
    avatarB: "#111",
    navActive: "#fff",
    navActiveText: "#000",
    selectionBg: "#fff",
    selectionText: "#000",
    labelBg: "#000",
    labelColor: "#666",
    mgsBg: "#060f0a",
    mgsText: "#88cc88",
    mgsTextBright: "#bbffbb",
    mgsDate: "rgba(136,204,136,0.45)",
    mgsBorderAccent: "#3a7a4a",
    bannerDither: "#666",
    tagCategories: {
      engine: {
        color: "#7db87d",
        bg: "rgba(125, 184, 125, 0.07)",
        hoverBg: "rgba(125, 184, 125, 0.14)",
      },
      creative: {
        color: "#c4a46c",
        bg: "rgba(196, 164, 108, 0.07)",
        hoverBg: "rgba(196, 164, 108, 0.14)",
      },
      meta: {
        color: "#8a9ab0",
        bg: "rgba(138, 154, 176, 0.07)",
        hoverBg: "rgba(138, 154, 176, 0.14)",
      },
      personal: {
        color: "#e0a4c4",
        bg: "rgba(224, 164, 196, 0.07)",
        hoverBg: "rgba(224, 164, 196, 0.14)",
      },
    },
  },
};

export type Theme = typeof THEMES.light;

export function makeDither(opacity: number) {
  return `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='rgba(100,190,100,${opacity})'/%3E%3Crect x='2' y='2' width='2' height='2' fill='rgba(100,190,100,${opacity})'/%3E%3C/svg%3E")`;
}

export const BANDS = [
  { density: 0.22, pct: 20 },
  { density: 0.16, pct: 20 },
  { density: 0.1, pct: 20 },
  { density: 0.06, pct: 20 },
  { density: 0.03, pct: 20 },
];
