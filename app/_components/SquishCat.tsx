"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { DitherDivider } from "./DitherDivider";
import { WidgetCard } from "./WidgetCard";
import {
  addSquishes,
  fetchInitialState,
  onServerUpdate,
  handleUnload,
  cleanup,
} from "@/lib/squish-sync";

// ── TUNABLES ──────────────────────────────────────────────
const TAP_GAIN = 42; // internal points per tap
const TAP_RELIEF = 40; // drain suppression per tap
const RELIEF_CAP = 230; // max accumulated drain suppression
const RELIEF_DECAY = 0.92; // how fast relief fades per tick (0-1)
const MIN_DRAIN = 6; // floor drain per tick

// Drain curve breakpoints (per 50ms tick)
const DRAIN_ZONE_1_END = 400;
const DRAIN_ZONE_2_END = 750; // momentum kicks in earlier
const DRAIN_ZONE_1_MAX = 48;
const DRAIN_ZONE_2_MAX = 100; // smoother mid-zone
const DRAIN_ZONE_3_MAX = 220; // steeper wall — relief barely overcomes it

// Big push — bonus points when crossing threshold
const PUSH_THRESHOLD = 900;
const PUSH_AMOUNT = 40;

const FEVER_THRESHOLD = 1000;
const FEVER_DURATION = 6000; // ms

const TICK_INTERVAL = 50; // 20 ticks/sec

const LEVELS = [
  { name: "IDLE", min: 0, multi: 1, tier: "idle" as const },
  { name: "ACTIVE", min: 30, multi: 1, tier: "active" as const },
  { name: "HEATED", min: 150, multi: 2, tier: "hot" as const },
  { name: "ON FIRE", min: 400, multi: 3, tier: "fire" as const },
  { name: "\u2605 FEVER \u2605", min: 1000, multi: 5, tier: "fever" as const },
];
// ── END TUNABLES ──────────────────────────────────────────

type Tier = (typeof LEVELS)[number]["tier"];

const STORAGE_KEY = "squish_cat_total";

function getScaleFactor(n: number): number {
  if (n < 10_000) return 1;
  return 10 ** (Math.floor(Math.log10(n)) - 2);
}

function formatCount(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  const units = [
    { val: 1e15, suffix: "Q" },
    { val: 1e12, suffix: "T" },
    { val: 1e9, suffix: "B" },
    { val: 1e6, suffix: "M" },
    { val: 1e3, suffix: "K" },
  ];
  for (const u of units) {
    if (n >= u.val) {
      const v = n / u.val;
      if (v < 10) return v.toFixed(2) + u.suffix;
      if (v < 100) return v.toFixed(1) + u.suffix;
      return Math.floor(v) + u.suffix;
    }
  }
  return n.toLocaleString("en-US");
}

interface EngineState {
  iPoints: number;
  decayReduction: number;
  pushFired: boolean;
  feverMode: boolean;
  feverTimer: ReturnType<typeof setTimeout> | null;
  tapTimes: number[];
  sessionSquishes: number;
  totalSquishes: number;
  globalTotal: number;
  globalVisitors: number;
}

interface DisplayState {
  totalSquishes: number;
  sessionSquishes: number;
  tier: Tier;
  levelName: string;
  multiplier: number;
  barPct: number;
  tapsPerSec: number;
  globalTotal: number;
  globalVisitors: number;
}

interface FloatItem {
  id: number;
  x: number;
  y: number;
  amount: number;
  tier: Tier;
}

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

interface ConfettiItem {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  color: string;
}

function getLevel(e: EngineState) {
  if (e.feverMode) return LEVELS[4];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (e.iPoints >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function decayTick(e: EngineState) {
  if (e.feverMode) return;
  let baseDrain: number;
  if (e.iPoints <= DRAIN_ZONE_1_END) {
    baseDrain = (e.iPoints / FEVER_THRESHOLD) * DRAIN_ZONE_1_MAX;
  } else if (e.iPoints <= DRAIN_ZONE_2_END) {
    const mid =
      (e.iPoints - DRAIN_ZONE_1_END) / (DRAIN_ZONE_2_END - DRAIN_ZONE_1_END);
    baseDrain = DRAIN_ZONE_1_MAX + mid * (DRAIN_ZONE_2_MAX - DRAIN_ZONE_1_MAX);
  } else {
    const final =
      (e.iPoints - DRAIN_ZONE_2_END) / (FEVER_THRESHOLD - DRAIN_ZONE_2_END);
    baseDrain =
      DRAIN_ZONE_2_MAX +
      final * final * (DRAIN_ZONE_3_MAX - DRAIN_ZONE_2_MAX);
  }
  const effectiveDrain = Math.max(MIN_DRAIN, baseDrain - e.decayReduction);
  e.decayReduction *= RELIEF_DECAY;
  e.iPoints = Math.max(0, e.iPoints - effectiveDrain);
  if (e.iPoints < PUSH_THRESHOLD) e.pushFired = false;

  // Clean reset at idle
  if (e.iPoints === 0) {
    e.decayReduction = 0;
    e.pushFired = false;
    e.tapTimes = [];
  }
}

export function SquishCat() {
  const { t, mode } = useTheme();
  // Darker greens in light mode for legibility on white
  const greenAccent = mode === "light" ? "#2d7a2d" : t.mgsText;
  const greenBright = mode === "light" ? "#1f6b1f" : t.mgsTextBright;
  // Stats labels — stronger contrast in light mode
  const labelColor = mode === "light" ? "#777" : t.faint;

  const engineRef = useRef<EngineState>({
    iPoints: 0,
    decayReduction: 0,
    pushFired: false,
    feverMode: false,
    feverTimer: null,
    tapTimes: [],
    sessionSquishes: 0,
    totalSquishes: 0,
    globalTotal: 0,
    globalVisitors: 0,
  });

  const [display, setDisplay] = useState<DisplayState>({
    totalSquishes: 0,
    sessionSquishes: 0,
    tier: "idle",
    levelName: "IDLE",
    multiplier: 1,
    barPct: 0,
    tapsPerSec: 0,
    globalTotal: 0,
    globalVisitors: 0,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [impactKey, setImpactKey] = useState(0);
  const [isHit, setIsHit] = useState(false);
  const shakeRef = useRef<HTMLDivElement>(null);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const [confetti, setConfetti] = useState<ConfettiItem[]>([]);
  const floatIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const confettiIdRef = useRef(0);
  const hitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDisplay = useCallback(() => {
    const e = engineRef.current;
    const level = getLevel(e);
    const now = Date.now();
    e.tapTimes = e.tapTimes.filter((ts) => now - ts < 2000);
    setDisplay({
      totalSquishes: e.totalSquishes,
      sessionSquishes: e.sessionSquishes,
      tier: level.tier,
      levelName: level.name,
      multiplier: level.multi,
      barPct: e.feverMode ? 100 : (e.iPoints / FEVER_THRESHOLD) * 100,
      tapsPerSec: e.tapTimes.length / 2,
      globalTotal: e.globalTotal,
      globalVisitors: e.globalVisitors,
    });
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      engineRef.current.totalSquishes = saved ? parseInt(saved) || 0 : 0;
    } catch {
      engineRef.current.totalSquishes = 0;
    }
    updateDisplay();
  }, [updateDisplay]);

  // Global sync — fetch initial state, subscribe to updates, register unload
  useEffect(() => {
    fetchInitialState().then((data) => {
      if (data) {
        engineRef.current.globalTotal = data.total;
        engineRef.current.globalVisitors = data.visitors;
        updateDisplay();
      }
    });

    const unsub = onServerUpdate((data) => {
      engineRef.current.globalTotal = data.total;
      engineRef.current.globalVisitors = data.visitors;
      updateDisplay();
    });

    const onBeforeUnload = () => handleUnload();
    const onVisChange = () => {
      if (document.visibilityState === "hidden") handleUnload();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      unsub();
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisChange);
      cleanup();
    };
  }, [updateDisplay]);

  // Engine loop — 20 ticks/sec
  useEffect(() => {
    const id = setInterval(() => {
      decayTick(engineRef.current);
      updateDisplay();
    }, TICK_INTERVAL);
    return () => clearInterval(id);
  }, [updateDisplay]);

  const triggerFever = useCallback(
    (e: EngineState) => {
      e.feverMode = true;
      setFlashKey((k) => k + 1);

      // Burst of scaled floats
      const burstAmount = getScaleFactor(e.totalSquishes) * 5;
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const id = ++floatIdRef.current;
          setFloats((prev) => [
            ...prev,
            {
              id,
              x: Math.random() * 80 + 10,
              y: Math.random() * 60 + 20,
              amount: burstAmount,
              tier: "fever",
            },
          ]);
          setTimeout(
            () => setFloats((prev) => prev.filter((f) => f.id !== id)),
            700
          );
        }, i * 50);
      }

      // Continuous rainbow confetti rain throughout fever
      const rainbowColors = ["#e06060", "#e0a060", "#f0c040", "#60c060", "#40a0e0", "#8060d0", "#d060a0"];
      const spawnWave = () => {
        const wave: ConfettiItem[] = Array.from({ length: 30 }, () => ({
          id: ++confettiIdRef.current,
          x: Math.random() * 100,
          delay: Math.random() * 0.2,
          duration: 0.4 + Math.random() * 0.5,
          rotation: 180 + Math.random() * 540,
          size: 2 + Math.random() * 6,
          color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
        }));
        setConfetti((prev) => [...prev, ...wave]);
        const ids = wave.map((w) => w.id);
        setTimeout(() => setConfetti((prev) => prev.filter((c) => !ids.includes(c.id))), 1500);
      };
      spawnWave();
      const confettiInterval = setInterval(spawnWave, 200);
      setTimeout(() => {
        clearInterval(confettiInterval);
        setTimeout(() => setConfetti([]), 2000);
      }, FEVER_DURATION);

      if (e.feverTimer) clearTimeout(e.feverTimer);
      e.feverTimer = setTimeout(() => {
        e.feverMode = false;
        e.iPoints = 0;
        e.decayReduction = 0;
        e.pushFired = false;
        updateDisplay();
      }, FEVER_DURATION);
    },
    [updateDisplay]
  );

  const handleTap = useCallback(
    (evt: React.MouseEvent | React.TouchEvent) => {
      if (evt.type === "touchend") evt.preventDefault();

      const eng = engineRef.current;

      // Internal engine
      if (!eng.feverMode) {
        eng.iPoints = Math.min(FEVER_THRESHOLD, eng.iPoints + TAP_GAIN);
        eng.decayReduction = Math.min(
          RELIEF_CAP,
          eng.decayReduction + TAP_RELIEF
        );

        // Big push near threshold
        if (eng.iPoints >= PUSH_THRESHOLD && !eng.pushFired) {
          eng.pushFired = true;
          eng.iPoints = Math.min(FEVER_THRESHOLD, eng.iPoints + PUSH_AMOUNT);
        }

        if (eng.iPoints >= FEVER_THRESHOLD) {
          triggerFever(eng);
        }
      }

      // External: scaled + multiplied count
      const level = getLevel(eng);
      const scale = getScaleFactor(eng.totalSquishes);
      const added = scale * level.multi;
      eng.totalSquishes += added;
      eng.sessionSquishes += added;
      eng.tapTimes.push(Date.now());

      // Persist
      try {
        localStorage.setItem(STORAGE_KEY, eng.totalSquishes.toString());
      } catch { }

      // Sync to server
      addSquishes(added);

      // Visual effects
      if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
      setIsHit(true);
      hitTimerRef.current = setTimeout(() => setIsHit(false), 100);

      setFlashKey((k) => k + 1);
      setImpactKey((k) => k + 1);
      if (eng.feverMode && shakeRef.current) {
        const el = shakeRef.current;
        el.style.animation = "none";
        el.offsetHeight; // force reflow
        el.style.animation = "feverShake 0.15s ease-in-out";
      }

      // Get click position
      let clientX: number | undefined, clientY: number | undefined;
      if ("changedTouches" in evt && evt.changedTouches[0]) {
        clientX = evt.changedTouches[0].clientX;
        clientY = evt.changedTouches[0].clientY;
      } else if ("clientX" in evt) {
        clientX = evt.clientX;
        clientY = evt.clientY;
      }

      // Floating +N
      const fid = ++floatIdRef.current;
      let fx = 50,
        fy = 30;
      if (clientX !== undefined && clientY !== undefined) {
        const rect = (
          evt.currentTarget as HTMLElement
        ).getBoundingClientRect();
        fx = ((clientX - rect.left) / rect.width) * 100;
        fy = ((clientY - rect.top) / rect.height) * 100;
      }
      const xJitter = (Math.random() - 0.5) * 20;
      setFloats((prev) => [
        ...prev,
        { id: fid, x: fx + xJitter, y: fy, amount: added, tier: level.tier },
      ]);
      setTimeout(
        () => setFloats((prev) => prev.filter((f) => f.id !== fid)),
        700
      );

      // Ripple at click position
      if (clientX !== undefined && clientY !== undefined) {
        const rid = ++rippleIdRef.current;
        setRipples((prev) => [...prev, { id: rid, x: clientX!, y: clientY! }]);
        setTimeout(
          () => setRipples((prev) => prev.filter((r) => r.id !== rid)),
          500
        );
      }

      updateDisplay();
    },
    [triggerFever, updateDisplay]
  );

  const { tier } = display;
  const isFever = tier === "fever";

  // Tier-aware colors
  const countColor =
    tier === "fever"
      ? "#f0c040"
      : tier === "fire"
        ? "#e0a060"
        : tier === "hot"
          ? "#c4a46c"
          : greenAccent;

  const countShadow =
    tier === "fever"
      ? "0 0 20px rgba(240,192,64,0.6), 0 0 40px rgba(224,96,96,0.3)"
      : tier === "fire"
        ? "0 0 20px rgba(224,160,96,0.5), 0 0 40px rgba(224,96,96,0.2)"
        : tier === "hot"
          ? "0 0 20px rgba(196,164,108,0.4)"
          : tier === "active"
            ? "0 0 20px rgba(125,184,125,0.4), 0 0 40px rgba(125,184,125,0.2)"
            : "none";

  const rankColor =
    tier === "fever"
      ? "#f0c040"
      : tier === "fire"
        ? "#e06060"
        : tier === "hot"
          ? "#c4a46c"
          : tier === "active"
            ? greenAccent
            : t.faint;

  const multiColor =
    tier === "fever"
      ? "#f0c040"
      : tier === "fire"
        ? "#e06060"
        : tier === "hot"
          ? "#c4a46c"
          : t.text;

  const catBg =
    tier === "fever"
      ? "#f0c040"
      : tier === "fire"
        ? "#e0a060"
        : tier === "hot"
          ? "#c4a46c"
          : tier === "active"
            ? greenAccent
            : t.mgsBg;

  const barFillBg =
    tier === "fever"
      ? "linear-gradient(90deg, #e06060, #f0c040, #e06060)"
      : tier === "fire"
        ? "linear-gradient(90deg, #c4a46c, #e06060)"
        : tier === "hot"
          ? "#c4a46c"
          : greenAccent;

  function floatStyle(floatTier: Tier): React.CSSProperties {
    const base: React.CSSProperties = {
      position: "absolute",
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 700,
      pointerEvents: "none",
      zIndex: 30,
      animation: "floatUp 0.7s ease-out forwards",
    };
    if (floatTier === "fever")
      return {
        ...base,
        color: "#f0c040",
        textShadow: "0 0 12px rgba(240,192,64,0.6)",
        fontSize: 20,
      };
    if (floatTier === "fire")
      return {
        ...base,
        color: "#e0a060",
        textShadow: "0 0 10px rgba(224,160,96,0.5)",
        fontSize: 18,
      };
    if (floatTier === "hot")
      return {
        ...base,
        color: "#c4a46c",
        textShadow: "0 0 10px rgba(196,164,108,0.5)",
        fontSize: 14,
      };
    return {
      ...base,
      color: greenBright,
      textShadow: "0 0 10px rgba(125,184,125,0.5)",
      fontSize: 14,
    };
  }

  return (
    <>
      <DitherDivider />
      <div ref={shakeRef}>
        <WidgetCard
          title="SQUISH THE CAT"
          right={
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 8,
                letterSpacing: 1.5,
                padding: "2px 8px",
                textTransform: "uppercase",
                border: `1px solid ${t.borderSoft}`,
                color: rankColor,
                fontWeight: 500,
                transition: "color 0.2s",
              }}
            >
              {display.levelName}
            </span>
          }
          containerStyle={{
            position: "relative",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            transition: "box-shadow 0.3s, border-color 0.3s",
            borderColor: isFever ? "rgba(224,160,96,0.3)" : t.border,
            boxShadow: isFever
              ? "0 0 20px rgba(240,192,64,0.15), 0 0 40px rgba(224,96,96,0.08)"
              : "none",
            overflow: "hidden",
            ...(isFever
              ? { animation: "rainbowBg 0.15s linear infinite" }
              : {}),
          }}
        >
          {/* CRT flash overlay */}
          <div
            key={`flash-${flashKey}`}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              pointerEvents: "none",
              animation:
                flashKey > 0 ? "crtFlash 0.2s steps(4) forwards" : "none",
            }}
          />

          {/* Rainbow confetti rain */}
          <div ref={cardRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 25, overflow: "hidden" }}>
            {confetti.map((c) => (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: `${c.x}%`,
                  top: 0,
                  width: c.size,
                  height: c.size * 1.4,
                  background: c.color,
                  borderRadius: 1,
                  pointerEvents: "none",
                  opacity: 0,
                  animation: `confettiFall ${c.duration}s ${c.delay}s ease-in forwards`,
                  ["--confetti-rot" as string]: `${c.rotation}deg`,
                  ["--confetti-dist" as string]: `${cardRef.current?.offsetHeight ?? 400}px`,
                }}
              />
            ))}
          </div>

          {/* Main area */}
          <div
            style={{
              padding: "20px 16px",
              display: "flex",
              gap: 16,
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Cat image container */}
            <div
              onClick={handleTap}
              onTouchEnd={handleTap}
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                border: `1px solid ${t.borderSoft}`,
                background: catBg,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                touchAction: "manipulation",
                transition: "background 0.3s",
              }}
            >
              <img
                src={isHit ? "/cat_hit.png" : "/cat_idle.png"}
                alt="cat"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  imageRendering: "pixelated",
                  display: "block",
                  userSelect: "none",
                }}
              />
              {/* Scanline overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
                  pointerEvents: "none",
                }}
              />
              {/* Impact ring */}
              <div
                key={`impact-${impactKey}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  border: `2px solid ${greenBright}`,
                  pointerEvents: "none",
                  zIndex: 5,
                  animation:
                    impactKey > 0
                      ? "impactPop 0.25s ease-out forwards"
                      : "none",
                  opacity: impactKey > 0 ? undefined : 0,
                }}
              />
            </div>

            {/* Counter area */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: t.faint,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {"\u25B8"} YOUR SQUISHES
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "clamp(28px, 7vw, 40px)",
                  fontWeight: 700,
                  color: countColor,
                  letterSpacing: 2,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  textShadow: countShadow,
                  transition: "color 0.2s, text-shadow 0.2s",
                  ...(isFever
                    ? {
                      animation:
                        "feverPulse 0.3s ease-in-out infinite alternate",
                    }
                    : {}),
                }}
              >
                {formatCount(display.totalSquishes)}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: t.faint,
                  marginTop: 6,
                  letterSpacing: 1,
                }}
              >
                <span
                  style={{
                    color: tier === "idle" ? t.faint : greenAccent,
                  }}
                >
                  {"\u25B8"}
                </span>{" "}
                tap to squish
              </div>
            </div>

            {/* Floating +N elements */}
            {floats.map((f) => (
              <div
                key={f.id}
                style={{
                  ...floatStyle(f.tier),
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                }}
              >
                +{formatCount(f.amount)}
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              borderTop: `1px dashed ${t.borderSoft}`,
            }}
          >
            {[
              {
                label: "ALL-TIME",
                value: formatCount(Math.max(display.globalTotal, display.totalSquishes)),
                color: t.text,
              },
              {
                label: "VISITORS",
                value: display.globalVisitors > 0 ? display.globalVisitors.toLocaleString("en-US") : "—",
                color: t.text,
              },
              {
                label: "MULTIPLIER",
                value: `x${display.multiplier}`,
                color: multiColor,
                style: isFever
                  ? {
                    textShadow: "0 0 8px rgba(240,192,64,0.4)",
                    animation: "feverPulse 0.3s ease-in-out infinite alternate",
                  }
                  : {},
              },
              {
                label: "SQUISH/SEC",
                value: display.tapsPerSec.toFixed(1),
                color: t.text,
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  ...(i > 0 ? { borderLeft: `1px dashed ${t.borderSoft}` } : {}),
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 7,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: labelColor,
                    marginBottom: 4,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: stat.color,
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.2s",
                    ...((stat as { style?: React.CSSProperties }).style ?? {}),
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Intensity bar */}
          <div
            style={{
              padding: "8px 16px 10px",
              borderTop: `1px dashed ${t.borderSoft}`,
              background: "rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 8,
                letterSpacing: 2,
                color: labelColor,
                textTransform: "uppercase",
                marginBottom: 5,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>INTENSITY</span>
            </div>
            <div
              style={{
                height: 4,
                background: t.borderSoft,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${display.barPct}%`,
                  background: barFillBg,
                  transition: "width 0.15s ease-out, background 0.3s",
                  ...(isFever
                    ? {
                      backgroundSize: "200% 100%",
                      animation: "feverShimmer 0.4s linear infinite",
                    }
                    : {}),
                }}
              />
            </div>
          </div>

        </WidgetCard>
      </div>

      {/* Ripple elements (fixed position, outside card) */}
      {ripples.map((r) => (
        <div
          key={r.id}
          style={{
            position: "fixed",
            left: r.x - 6,
            top: r.y - 6,
            width: 12,
            height: 12,
            border: `1px solid ${greenAccent}`,
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 9998,
            animation: "rippleOut 0.5s ease-out forwards",
          }}
        />
      ))}
    </>
  );
}
