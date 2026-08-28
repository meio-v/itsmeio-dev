import type { PoiId, RideControlMode } from "./scene-contract";

export type RuntimeStatus =
  | "loading"
  | "ready"
  | "recovering"
  | "unavailable";

export type MallExperienceState = {
  runtimeStatus: RuntimeStatus;
  runtimeMessage: string | null;
  controlMode: RideControlMode;
  resumeMode: Exclude<RideControlMode, "paused">;
  selectedPoi: PoiId | null;
};

export type MallExperienceAction =
  | { type: "runtime-ready" }
  | { type: "runtime-interrupted"; reason: string }
  | { type: "runtime-unavailable"; reason: string }
  | { type: "take-control" }
  | { type: "pause-ride" }
  | { type: "resume-ride" }
  | { type: "open-poi"; id: PoiId }
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
    case "runtime-interrupted":
      return {
        ...state,
        runtimeStatus: "recovering",
        runtimeMessage: action.reason,
        controlMode: "paused",
      };
    case "runtime-unavailable":
      return {
        ...state,
        runtimeStatus: "unavailable",
        runtimeMessage: action.reason,
        controlMode: "paused",
      };
    case "take-control": {
      if (state.selectedPoi) return state;
      return { ...state, controlMode: "driving", resumeMode: "driving" };
    }
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
    case "pause-ride":
      return { ...state, controlMode: "paused" };
    case "resume-ride":
      if (state.selectedPoi || state.runtimeStatus === "unavailable") return state;
      return { ...state, controlMode: state.resumeMode };
    case "open-poi": {
      const resumeMode =
        state.controlMode === "paused" ? state.resumeMode : state.controlMode;
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
