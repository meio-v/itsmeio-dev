"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { MallRideCanvasProps, SceneCommandPort } from "../_lib/scene-contract";
import { MallRideRuntime, type RideDebugSnapshot } from "./MallRideRuntime";

type MallDebugWindow = Window & {
  __mallRideRuntime?: MallRideRuntime;
};

export function MallRideCanvas({
  featuredTitle,
  onEvent,
  onPortReady,
}: MallRideCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<MallRideRuntime | null>(null);
  const debugEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("rideDebug");

  useEffect(() => {
    const canvas = canvasRef.current;
    const controlSurface = surfaceRef.current;
    if (!canvas || !controlSurface) return;

    let runtime: MallRideRuntime | null = null;
    let cancelled = false;

    void MallRideRuntime.create({ canvas, controlSurface, onEvent })
      .then((createdRuntime) => {
        if (cancelled) {
          createdRuntime.dispose();
          return;
        }
        runtime = createdRuntime;
        runtimeRef.current = createdRuntime;
        if (debugEnabled) {
          (window as MallDebugWindow).__mallRideRuntime = createdRuntime;
        }
        const port: SceneCommandPort = {
          dispatch(command) {
            runtime?.dispatch(command);
          },
        };
        onPortReady(port);
        createdRuntime.start();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof Error ? error.message : "The 3D ride could not start.";
        onEvent({ type: "runtime-unavailable", reason });
      });

    return () => {
      cancelled = true;
      onPortReady(null);
      if (runtime) {
        runtime.dispose();
      }
      runtimeRef.current = null;
      if (debugEnabled) {
        delete (window as MallDebugWindow).__mallRideRuntime;
      }
    };
  }, [debugEnabled, onEvent, onPortReady]);

  return (
    <div
      ref={surfaceRef}
      className="mall-ride-surface"
      tabIndex={0}
      role="group"
      aria-label="Mall moped ride controls"
      aria-describedby="ride-controls-help"
      data-featured-title={featuredTitle ?? undefined}
    >
      <canvas ref={canvasRef} className="mall-ride-canvas" aria-hidden="true" />
      <div className="mall-touch-controls" aria-label="Touch ride controls">
        <div className="mall-touch-steer">
          <HoldButton
            label="Steer left"
            onChange={(pressed) => runtimeRef.current?.setVirtualInput({ steer: pressed ? -1 : 0 })}
          >
            ←
          </HoldButton>
          <HoldButton
            label="Steer right"
            onChange={(pressed) => runtimeRef.current?.setVirtualInput({ steer: pressed ? 1 : 0 })}
          >
            →
          </HoldButton>
        </div>
        <div className="mall-touch-pedals">
          <HoldButton
            label="Accelerate"
            onChange={(pressed) => runtimeRef.current?.setVirtualInput({ throttle: pressed ? 1 : 0 })}
          >
            GO
          </HoldButton>
          <HoldButton
            label="Brake or reverse"
            onChange={(pressed) =>
              runtimeRef.current?.setVirtualInput({ brakeReverse: pressed ? 1 : 0 })
            }
          >
            STOP
          </HoldButton>
        </div>
      </div>
      {debugEnabled ? <RideDebugPanel runtimeRef={runtimeRef} /> : null}
    </div>
  );
}

function RideDebugPanel({
  runtimeRef,
}: {
  runtimeRef: RefObject<MallRideRuntime | null>;
}) {
  const [snapshot, setSnapshot] = useState<RideDebugSnapshot | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const runtime = runtimeRef.current;
      if (runtime) setSnapshot(runtime.getDebugSnapshot());
    }, 250);
    return () => window.clearInterval(interval);
  }, [runtimeRef]);

  if (!snapshot) return null;
  return (
    <output className="mall-ride-debug" aria-label="Ride diagnostics">
      <span>{snapshot.mode.toUpperCase()}</span>
      <span>{snapshot.speedKph.toFixed(1)} KM/H</span>
      <span>
        X {snapshot.position.x.toFixed(1)} / Z {snapshot.position.z.toFixed(1)}
      </span>
      <span>{snapshot.groundedWheels}/4 CONTACTS</span>
      <span>{snapshot.drawCalls} CALLS</span>
      <span>{snapshot.triangles.toLocaleString()} TRIS</span>
    </output>
  );
}

function HoldButton({
  label,
  children,
  onChange,
}: {
  label: string;
  children: ReactNode;
  onChange(pressed: boolean): void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onChange(true);
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onLostPointerCapture={() => onChange(false)}
    >
      {children}
    </button>
  );
}

export default MallRideCanvas;
