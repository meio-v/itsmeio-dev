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
  poiReturnMode: RideControlMode | null;
};

export type MallExperienceAction =
  | { type: "runtime-ready" }
  | { type: "runtime-interrupted"; reason: string }
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
  poiReturnMode: null,
};

export function mallExperienceReducer(
  state: MallExperienceState,
  action: MallExperienceAction,
): MallExperienceState {
  switch (action.type) {
    case "runtime-ready":
      return {
        ...state,
        runtimeStatus: "ready",
        runtimeMessage: null,
        controlMode:
          state.runtimeStatus === "recovering" ? state.resumeMode : state.controlMode,
      };
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
      const poiReturnMode =
        action.restoreMode ??
        (state.selectedPoi ? state.poiReturnMode ?? state.controlMode : state.controlMode);
      return {
        ...state,
        selectedPoi: action.id,
        poiReturnMode,
        controlMode: "paused",
      };
    }
    case "close-poi": {
      const returnMode = state.poiReturnMode ?? state.resumeMode;
      return {
        ...state,
        selectedPoi: null,
        poiReturnMode: null,
        controlMode:
          state.runtimeStatus === "unavailable" ? "paused" : returnMode,
        resumeMode: returnMode === "paused" ? state.resumeMode : returnMode,
      };
    }
  }
}
