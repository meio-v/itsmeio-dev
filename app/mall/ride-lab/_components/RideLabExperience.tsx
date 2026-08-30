"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { RIDE_LAB_CONTROLS, type RideLabTuningGroup } from "../../_ride-lab/rideLabControls";
import { resolveTouchSteer } from "../../_ride-lab/rideLabModel";
import { RideLabRuntime, type RideLabInspectionView } from "../../_ride-lab/RideLabRuntime";
import type { RideLabDebugSnapshot, RideLabLifecycle } from "../../_ride-lab/rideLabTypes";
import { DEFAULT_RIDE_LAB_TUNING, getRideLabTuningLimits, parseRideLabTuning, RIDE_LAB_PRESETS, sanitizeRideLabTuning, serializeRideLabTuning, type RideLabPresetName, type RideLabTuning } from "../../_ride-lab/rideLabTuning";
import styles from "../rideLab.module.css";

const LEGACY_STORAGE_KEYS = ["itsmeio.rideLab.config.v1", "itsmeio.rideLab.config.v2", "itsmeio.rideLab.config.v3", "itsmeio.rideLab.config.v4", "itsmeio.rideLab.config.v5", "itsmeio.rideLab.config.v6", "itsmeio.rideLab.config.v7", "itsmeio.rideLab.config.v8", "itsmeio.rideLab.config.v9", "itsmeio.rideLab.config.v10", "itsmeio.rideLab.config.v11"] as const;
const STORAGE_KEY = "itsmeio.rideLab.config.v12";
const GROUPS: readonly RideLabTuningGroup[] = ["Drivetrain", "Braking", "Steering & assist", "Chassis & suspension", "Aerial & grind", "Camera & feedback", "Jolt advanced"];
const TUNING_LIMITS = getRideLabTuningLimits();
const INSPECTION_VIEWS: readonly { view: RideLabInspectionView; label: string; shortLabel: string }[] = [
  { view: "chase", label: "Resume chase camera", shortLabel: "Chase" },
  { view: "rear", label: "Inspect from rear", shortLabel: "Rear" },
  { view: "front", label: "Inspect from front", shortLabel: "Front" },
  { view: "left-profile", label: "Inspect left profile", shortLabel: "Left" },
  { view: "right-profile", label: "Inspect right profile", shortLabel: "Right" },
  { view: "elevated-three-quarter", label: "Inspect elevated three-quarter view", shortLabel: "High ¾" },
];

export function RideLabExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<RideLabRuntime | null>(null);
  const touchSteerRef = useRef({ left: false, right: false });
  const latestTuningRef = useRef<RideLabTuning>({ ...DEFAULT_RIDE_LAB_TUNING });
  const appliedConfigRef = useRef(serializeRideLabTuning({ ...DEFAULT_RIDE_LAB_TUNING }));
  const [tuning, setTuning] = useState<RideLabTuning>({ ...DEFAULT_RIDE_LAB_TUNING });
  const [lifecycle, setLifecycle] = useState<RideLabLifecycle>("loading");
  const [snapshot, setSnapshot] = useState<RideLabDebugSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configText, setConfigText] = useState("");
  const [inspectionView, setInspectionView] = useState<RideLabInspectionView>("chase");
  useEffect(() => {
    latestTuningRef.current = tuning;
  }, [tuning]);

  useEffect(() => {
    try {
      for (const key of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(key);
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? parseRideLabTuning(stored) : null;
      if (parsed) queueMicrotask(() => setTuning(parsed));
    } catch {
      // Storage is an optional lab convenience; defaults remain authoritative.
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    if (!canvas || !surface) return;
    let cancelled = false;
    let runtime: RideLabRuntime | null = null;
    void RideLabRuntime.create({ canvas, surface, tuning: { ...DEFAULT_RIDE_LAB_TUNING }, onLifecycle: setLifecycle, onSnapshot: setSnapshot })
      .then((created) => {
        if (cancelled) {
          created.dispose();
          return;
        }
        runtime = created;
        runtimeRef.current = created;
        created.start();
        const latestTuning = latestTuningRef.current;
        const serialized = serializeRideLabTuning(latestTuning);
        if (serialized !== appliedConfigRef.current) {
          appliedConfigRef.current = serialized;
          void created.reconfigure(latestTuning).catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "Stored tuning could not be applied.");
          });
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "rideLab could not start.");
      });
    return () => {
      cancelled = true;
      runtime?.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const serialized = serializeRideLabTuning(tuning);
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // A private or full storage area must not make the lab unusable.
    }
    const timer = window.setTimeout(() => {
      const runtime = runtimeRef.current;
      if (!runtime || serialized === appliedConfigRef.current) return;
      appliedConfigRef.current = serialized;
      void runtime.reconfigure(tuning).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Tuning could not be applied.");
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [tuning]);

  const update = (key: keyof RideLabTuning, value: number) => {
    setTuning((current) => sanitizeRideLabTuning({ ...current, [key]: value }));
  };

  const selectPreset = (preset: RideLabPresetName) => {
    setTuning({ ...RIDE_LAB_PRESETS[preset] });
    setConfigText("");
  };

  const importConfig = () => {
    const parsed = parseRideLabTuning(configText);
    if (!parsed) {
      setError("That configuration is malformed or uses a different schema version.");
      return;
    }
    setError(null);
    setTuning(parsed);
  };

  const setTouchSteer = (direction: "left" | "right", pressed: boolean) => {
    touchSteerRef.current[direction] = pressed;
    runtimeRef.current?.setVirtualInput({ steer: resolveTouchSteer(touchSteerRef.current.left, touchSteerRef.current.right) });
  };

  const inspectFrom = (view: RideLabInspectionView) => {
    runtimeRef.current?.setVirtualInput({ throttle: 0, brake: 0, steer: 0, aerialAction: false });
    runtimeRef.current?.setInspectionView(view);
    setInspectionView(view);
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Development only · Phases 1–2</p>
          <h1>rideLab</h1>
          <p>Jolt motorcycle feel lab. Nothing here changes the authored Rapier mall ride.</p>
        </div>
        <Link href="/mall">Back to the mall</Link>
      </header>

      <section className={styles.workspace} aria-label="Jolt motorcycle ride laboratory">
        <div
          ref={surfaceRef}
          className={styles.rideSurface}
          tabIndex={0}
          role="application"
          aria-label="rideLab moped controls"
          aria-describedby="ride-lab-help"
          data-testid="ride-lab-surface"
        >
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <div className={styles.speedLines} aria-hidden="true" />
          <p id="ride-lab-help" className={styles.help}>WASD or arrows ride · hold Space to preload, release to ollie, hold airborne to hover or grind · R resets</p>
          <output className={styles.feedback} aria-live="polite">
            {error ? error : `${lifecycle} · ${snapshot?.eventPulse ?? "idle"}`}
          </output>
          <div className={styles.inspectionControls} role="group" aria-label="Snap inspection camera angle">
            {INSPECTION_VIEWS.map(({ view, label, shortLabel }) => (
              <button
                type="button"
                key={view}
                aria-label={label}
                aria-pressed={inspectionView === view}
                onClick={() => inspectFrom(view)}
              >
                {shortLabel}
              </button>
            ))}
          </div>
          <div className={styles.touchControls} aria-label="Touch ride controls">
            <div>
              <HoldButton label="Steer left" onChange={(pressed) => setTouchSteer("left", pressed)}>←</HoldButton>
              <HoldButton label="Steer right" onChange={(pressed) => setTouchSteer("right", pressed)}>→</HoldButton>
            </div>
            <div>
              <HoldButton label="Accelerate" onChange={(pressed) => runtimeRef.current?.setVirtualInput({ throttle: pressed ? 1 : 0 })}>GO</HoldButton>
              <HoldButton label="Brake" onChange={(pressed) => runtimeRef.current?.setVirtualInput({ brake: pressed ? 1 : 0 })}>BRAKE</HoldButton>
              <HoldButton label="Preload or hover" onChange={(pressed) => runtimeRef.current?.setVirtualInput({ aerialAction: pressed })}>SPACE</HoldButton>
              <button type="button" aria-label="Reset moped" onClick={() => runtimeRef.current?.setVirtualInput({ reset: true })}>R</button>
            </div>
          </div>
        </div>

        <aside className={styles.panel} aria-label="rideLab tuning and diagnostics">
          <section className={styles.status} aria-label="Ride diagnostics">
            <h2>Live signals</h2>
            <dl>
              <Metric label="Speed" value={`${((snapshot?.speedMps ?? 0) * 3.6).toFixed(1)} km/h`} />
              <Metric label="Acceleration" value={`${(snapshot?.accelerationMps2 ?? 0).toFixed(2)} m/s²`} />
              <Metric label="Contact" value={`${snapshot?.wheelContacts ?? 0}/2 · ${snapshot?.grounded ? "ground" : "air"}`} />
              <Metric label="Lean" value={`${((snapshot?.leanRadians ?? 0) * 180 / Math.PI).toFixed(1)}°`} />
              <Metric label="Suspension F/R" value={`${(snapshot?.frontSuspensionLoad ?? 0).toFixed(1)} / ${(snapshot?.rearSuspensionLoad ?? 0).toFixed(1)}`} />
              <Metric label="Rear slip" value={(snapshot?.rearSlip ?? 0).toFixed(3)} />
              <Metric label="Aerial state" value={`${snapshot?.aerialPhase ?? "grounded"} · ${(snapshot?.airtimeSeconds ?? 0).toFixed(2)}s`} />
              <Metric label="Runtime" value={`${snapshot?.liveRuntimes ?? 0} world · ${snapshot?.animationLoops ?? 0} loop`} />
            </dl>
            <div className={styles.meters}>
              <Meter label="Throttle" value={snapshot?.intent.throttle ?? 0} />
              <Meter label="Brake" value={snapshot?.intent.brake ?? 0} />
              <Meter label="Lean" value={Math.abs(snapshot?.leanRadians ?? 0) / tuning.maxLeanRadians} />
              <Meter label="Preload" value={snapshot?.preload ?? 0} />
              <Meter label="Hover energy" value={snapshot?.hoverEnergy ?? 1} />
            </div>
            <label className={styles.motionToggle}>
              <input type="checkbox" checked={snapshot?.reducedMotion ?? false} onChange={(event) => runtimeRef.current?.setReducedMotion(event.target.checked)} />
              Reduce camera and speed-line motion
            </label>
          </section>

          <section className={styles.presets} aria-label="Tuning presets">
            <h2>Presets</h2>
            <div>{(Object.keys(RIDE_LAB_PRESETS) as RideLabPresetName[]).map((name) => <button type="button" key={name} onClick={() => selectPreset(name)}>{name}</button>)}</div>
            <button type="button" onClick={() => setTuning({ ...DEFAULT_RIDE_LAB_TUNING })}>Reset all</button>
            <button type="button" onClick={() => runtimeRef.current?.setScenario("start")}>Start setup</button>
            <button type="button" onClick={() => runtimeRef.current?.setScenario("wall-grind")}>Wall grind setup</button>
          </section>

          <section className={styles.tuning} aria-label="Categorized physics tuning">
            <h2>Physics knobs</h2>
            {GROUPS.map((group) => (
              <details key={group} open={group !== "Jolt advanced"}>
                <summary>{group}</summary>
                {RIDE_LAB_CONTROLS.filter((item) => item.group === group).map((item) => {
                  const [min, max] = TUNING_LIMITS[item.key];
                  const descriptionId = `${item.key}-description`;
                  return (
                    <label key={item.key} title={item.description}>
                      <span>{item.label}<output>{formatValue(tuning[item.key])}</output></span>
                      <input aria-describedby={descriptionId} type="range" min={min} max={max} step={item.step} value={tuning[item.key]} onChange={(event) => update(item.key, Number(event.target.value))} />
                      <small id={descriptionId}>{item.description}</small>
                    </label>
                  );
                })}
              </details>
            ))}
          </section>

          <section className={styles.transfer} aria-label="Import or export tuning">
            <h2>Config JSON</h2>
            <textarea aria-label="Versioned rideLab configuration" value={configText} placeholder="Export appears here, or paste a config to import." onChange={(event) => setConfigText(event.target.value)} />
            <div>
              <button type="button" onClick={() => setConfigText(serializeRideLabTuning(tuning))}>Export</button>
              <button type="button" onClick={importConfig}>Import</button>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <><dt>{label}</dt><dd>{value}</dd></>;
}

function Meter({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(1, value));
  return <label>{label}<meter min="0" max="1" value={safe}>{Math.round(safe * 100)}%</meter></label>;
}

function HoldButton({ label, children, onChange }: { label: string; children: ReactNode; onChange(pressed: boolean): void }) {
  return <button type="button" aria-label={label} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onChange(true); }} onPointerUp={() => onChange(false)} onPointerCancel={() => onChange(false)} onLostPointerCapture={() => onChange(false)}>{children}</button>;
}

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(value < 0.1 ? 3 : 2);
}
