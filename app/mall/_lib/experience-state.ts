import type { PoiId, RideControlMode } from "./scene-contract";

export type RuntimeStatus = "loading" | "ready" | "unavailable";

export type MallExperienceState = {
  runtimeStatus: RuntimeStatus;
  runtimeMessage: string | null;
  controlMode: RideControlMode;
  resumeMode: Exclude<RideControlMode, "paused">;
  selectedPoi: PoiId | null;
};

export type MallExperienceAction =
  | { type: "runtime-ready" }
  | { type: "runtime-unavailable"; reason: string }
  | { type: "insert-token" }
  | { type: "exit-ride" }
  | { type: "pause-attract" }
  | { type: "resume-attract" }
  | {
      type: "open-poi";
      id: PoiId;
      restoreMode?: Exclude<RideControlMode, "paused">;
    }
  | { type: "close-poi" }
  | {
      type: "runtime-control-mode";
      mode: RideControlMode;
    };

export const initialMallExperienceState: MallExperienceState = {
  runtimeStatus: "loading",
  runtimeMessage: null,
  controlMode: "attract",
  resumeMode: "attract",
  selectedPoi: null,
};

export function mallExperienceReducer(
  state: MallExperienceState,
  action: MallExperienceAction,
): MallExperienceState {
  switch (action.type) {
    case "runtime-ready":
      return { ...state, runtimeStatus: "ready", runtimeMessage: null };
    case "runtime-unavailable":
      return {
        ...state,
        runtimeStatus: "unavailable",
        runtimeMessage: action.reason,
        controlMode: "paused",
      };
    case "insert-token": {
      if (state.selectedPoi) return state;
      return { ...state, controlMode: "driving", resumeMode: "driving" };
    }
    case "exit-ride":
      return { ...state, controlMode: "attract", resumeMode: "attract" };
    case "runtime-control-mode": {
      if (state.selectedPoi) return state;
      if (action.mode === "paused") {
        return { ...state, controlMode: "paused" };
      }
      return {
        ...state,
        controlMode: action.mode,
        resumeMode: action.mode,
      };
    }
    case "pause-attract":
      if (state.controlMode !== "attract") return state;
      return { ...state, controlMode: "paused", resumeMode: "attract" };
    case "resume-attract":
      if (
        state.selectedPoi ||
        state.runtimeStatus === "unavailable" ||
        state.resumeMode !== "attract"
      ) {
        return state;
      }
      return { ...state, controlMode: "attract" };
    case "open-poi": {
      const resumeMode =
        action.restoreMode ??
        (state.controlMode === "paused" ? state.resumeMode : state.controlMode);
      return {
        ...state,
        selectedPoi: action.id,
        resumeMode,
        controlMode: "paused",
      };
    }
    case "close-poi":
      return {
        ...state,
        selectedPoi: null,
        controlMode:
          state.runtimeStatus === "unavailable" ? "paused" : state.resumeMode,
      };
  }
}
