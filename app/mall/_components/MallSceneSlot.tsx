"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type {
  MallRideCanvasProps,
  SceneCommandPort,
} from "../_lib/scene-contract";
import styles from "../mall.module.css";
import { MallPoster } from "./MallPoster";

const MallRideCanvas = dynamic<MallRideCanvasProps>(
  () =>
    import("../_runtime/MallRideCanvas").then((module) =>
      Promise.resolve(module.MallRideCanvas),
    ),
  {
    ssr: false,
    loading: () => <SceneFallback message="Opening the mall…" />,
  },
);

function SceneFallback({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.sceneFallback}>
      <MallPoster />
      <div className={styles.sceneStatus} role="status">
        <p>{message}</p>
        {action}
      </div>
    </div>
  );
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError(message: string): void },
  { error: string | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return {
      error: error instanceof Error ? error.message : "The ride could not load.",
    };
  }

  componentDidCatch() {
    if (this.state.error) this.props.onError(this.state.error);
  }

  render() {
    if (this.state.error) {
      return (
        <SceneFallback message="The ride is unavailable. The rest of the mall is still open." />
      );
    }
    return this.props.children;
  }
}

type NetworkInformation = {
  saveData?: boolean;
};

type RideCapability = "checking" | "available" | "unavailable" | "deferred";

function subscribeToCapability() {
  return () => undefined;
}

function getServerCapability(): RideCapability {
  return "checking";
}

function getBrowserCapability(): RideCapability {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;
  if (connection?.saveData) return "deferred";

  const probe = document.createElement("canvas");
  return probe.getContext("webgl2") ? "available" : "unavailable";
}

export function MallSceneSlot({
  featuredTitle,
  onEvent,
  onPortReady,
}: MallRideCanvasProps) {
  const detectedCapability = useSyncExternalStore(
    subscribeToCapability,
    getBrowserCapability,
    getServerCapability,
  );
  const [forceLoad, setForceLoad] = useState(false);
  const capability =
    detectedCapability === "deferred" && forceLoad
      ? "available"
      : detectedCapability;

  useEffect(() => {
    if (capability === "unavailable") {
      onEvent({
        type: "runtime-unavailable",
        reason: "WebGL2 is not available in this browser.",
      });
    }
  }, [capability, onEvent]);

  if (capability === "checking") {
    return <SceneFallback message="Checking ride support…" />;
  }

  if (capability === "unavailable") {
    return (
      <SceneFallback message="This browser cannot run the ride. The HTML arcade remains available below." />
    );
  }

  if (capability === "deferred") {
    return (
      <SceneFallback
        message="Data saver is on, so the ride has not been loaded."
        action={
          <button
            type="button"
            className={styles.sceneLoadButton}
            onClick={() => setForceLoad(true)}
          >
            Load ride (up to 5.5 MB)
          </button>
        }
      />
    );
  }

  return (
    <SceneErrorBoundary
      onError={(reason) =>
        onEvent({ type: "runtime-unavailable", reason })
      }
    >
      <MallRideCanvas
        featuredTitle={featuredTitle}
        onEvent={onEvent}
        onPortReady={onPortReady as (port: SceneCommandPort | null) => void}
      />
    </SceneErrorBoundary>
  );
}
