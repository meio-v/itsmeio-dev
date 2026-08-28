export type PoiId = "currently-playing";

export type RideControlMode = "attract" | "driving" | "paused";

export type SceneEvent =
  | { type: "runtime-ready" }
  | { type: "runtime-interrupted"; reason: string }
  | { type: "runtime-unavailable"; reason: string }
  | { type: "entered-poi"; id: PoiId }
  | {
      type: "control-mode-changed";
      mode: RideControlMode;
    };

export type SceneCommand =
  | { type: "set-control-mode"; mode: RideControlMode }
  | { type: "focus-poi"; id: PoiId }
  | { type: "set-muted"; muted: boolean }
  | { type: "set-motion-mode"; mode: "full" | "reduced" };

export interface SceneCommandPort {
  dispatch(command: SceneCommand): void;
}

export interface MallRideCanvasProps {
  featuredTitle: string | null;
  onEvent(event: SceneEvent): void;
  onPortReady(port: SceneCommandPort | null): void;
}
