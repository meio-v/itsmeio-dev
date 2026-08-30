"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CharacterPrototypeRuntime, type CharacterPrototypeMetrics, type CharacterPrototypePose, type CharacterPrototypeVariant, type CharacterPrototypeView } from "../../_ride-lab/CharacterPrototypeRuntime";
import styles from "./characterPrototype.module.css";

// PROTOTYPE: three diagnostic views of the rider, switchable through ?variant=.
const VARIANTS: readonly { key: CharacterPrototypeVariant; name: string; question: string }[] = [
  { key: "A", name: "Anatomy", question: "Is the neutral T-pose, topology, and skeleton structurally clean?" },
  { key: "B", name: "Contact", question: "Do seat, hands, and feet meet the scooter without deformation?" },
  { key: "C", name: "Motion", question: "Do the gameplay poses preserve silhouette and joint volume?" },
];
const POSES: readonly { key: CharacterPrototypePose; label: string }[] = [
  { key: "idle", label: "Idle" },
  { key: "turn-left", label: "Turn left" },
  { key: "turn-right", label: "Turn right" },
  { key: "accelerate", label: "Accelerate" },
  { key: "brake", label: "Brake" },
];
const VIEWS: readonly { key: CharacterPrototypeView; label: string }[] = [
  { key: "rear", label: "Rear" },
  { key: "front", label: "Front" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "high", label: "High ¾" },
];
const EMPTY_METRICS: CharacterPrototypeMetrics = {
  drawCalls: 0,
  triangles: 0,
  seatErrorMeters: 0,
  leftHandErrorMeters: 0,
  rightHandErrorMeters: 0,
  leftFootErrorMeters: 0,
  rightFootErrorMeters: 0,
};

export function CharacterPrototypeExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<CharacterPrototypeRuntime | null>(null);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requestedVariant = params.get("variant")?.toUpperCase();
  const variant = (VARIANTS.some((item) => item.key === requestedVariant) ? requestedVariant : "A") as CharacterPrototypeVariant;
  const [pose, setPose] = useState<CharacterPrototypePose>("idle");
  const [metrics, setMetrics] = useState<CharacterPrototypeMetrics>(EMPTY_METRICS);
  const [error, setError] = useState<string | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const current = VARIANTS.find((item) => item.key === variant) ?? VARIANTS[0];

  const selectVariant = useCallback((next: CharacterPrototypeVariant) => {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("variant", next);
    router.replace(`${pathname}?${nextParams.toString()}`);
  }, [params, pathname, router]);
  const cycleVariant = useCallback((direction: -1 | 1) => {
    const index = VARIANTS.findIndex((item) => item.key === variant);
    selectVariant(VARIANTS[(index + direction + VARIANTS.length) % VARIANTS.length].key);
  }, [selectVariant, variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let runtime: CharacterPrototypeRuntime | null = null;
    void CharacterPrototypeRuntime.create({ canvas, onMetrics: setMetrics })
      .then((created) => {
        if (cancelled) return created.dispose();
        runtime = created;
        runtimeRef.current = created;
        created.start();
        setRuntimeReady(true);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Character prototype failed to start");
      });
    return () => {
      cancelled = true;
      runtime?.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!runtimeReady) return;
    runtimeRef.current?.setVariant(variant);
    runtimeRef.current?.setPose(pose);
  }, [pose, runtimeReady, variant]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable='true']")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      cycleVariant(event.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycleVariant]);
  const selectPose = (next: CharacterPrototypePose) => {
    setPose(next);
    runtimeRef.current?.setPose(next);
  };

  return (
    <main className={styles.shell} data-testid="character-prototype" data-variant={variant} data-pose={pose}>
      <header className={styles.header}>
        <div>
          <p>THROWAWAY PROTOTYPE · RIDE LAB ONLY</p>
          <h1>Character benchmark</h1>
          <span>{current.question}</span>
        </div>
        <Link href="/mall/ride-lab">Back to rideLab</Link>
      </header>

      <section className={styles.stage} aria-label={`${current.name} character benchmark`}>
        <canvas ref={canvasRef} aria-label="Interactive 3D rider benchmark; drag to orbit and scroll to zoom" />
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className={styles.viewControls} aria-label="Camera angles">
          {VIEWS.map((view) => <button type="button" key={view.key} onClick={() => runtimeRef.current?.setView(view.key)}>{view.label}</button>)}
        </div>
        {variant === "C" && (
          <div className={styles.poseControls} aria-label="Pose benchmarks">
            {POSES.map((item) => (
              <button type="button" key={item.key} aria-pressed={pose === item.key} onClick={() => selectPose(item.key)}>{item.label}</button>
            ))}
          </div>
        )}
        <aside className={styles.diagnostics} aria-label="Character diagnostics">
          <h2>{variant} · {current.name}</h2>
          <dl>
            <dt>Draw calls</dt><dd>{metrics.drawCalls}</dd>
            <dt>Triangles</dt><dd>{metrics.triangles.toLocaleString()}</dd>
            <dt>Seat error</dt><dd>{formatMillimeters(metrics.seatErrorMeters)}</dd>
            <dt>Hands L/R</dt><dd>{formatMillimeters(metrics.leftHandErrorMeters)} / {formatMillimeters(metrics.rightHandErrorMeters)}</dd>
            <dt>Feet L/R</dt><dd>{formatMillimeters(metrics.leftFootErrorMeters)} / {formatMillimeters(metrics.rightFootErrorMeters)}</dd>
          </dl>
          <p>{variant === "A" ? "Skeleton visible. Inspect rest topology before blaming animation." : variant === "B" ? "Coloured markers expose the authored seat, grip, and floorboard anchors." : "Compare the same five gameplay poses at every camera angle."}</p>
        </aside>
      </section>

      <nav className={styles.variantSwitcher} aria-label="Prototype variants">
        <button type="button" aria-label="Previous prototype variant" onClick={() => cycleVariant(-1)}>←</button>
        <button type="button" onClick={() => selectVariant(current.key)}>{current.key} — {current.name}</button>
        <button type="button" aria-label="Next prototype variant" onClick={() => cycleVariant(1)}>→</button>
      </nav>
    </main>
  );
}

function formatMillimeters(meters: number) {
  return `${Math.round(meters * 1000)} mm`;
}
