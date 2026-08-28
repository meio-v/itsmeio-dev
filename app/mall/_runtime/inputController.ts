import { EMPTY_RIDE_INPUT, type RideInput } from "./rideTypes";

const CONTROL_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyR",
]);

export class InputController {
  private readonly pressed = new Set<string>();
  private virtual: RideInput = { ...EMPTY_RIDE_INPUT };
  private enabled = false;
  private resetQueued = false;

  constructor(private readonly surface: HTMLElement) {
    surface.addEventListener("keydown", this.onKeyDown);
    surface.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.releaseAll);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.releaseAll();
  }

  read(): RideInput {
    if (!this.enabled) return EMPTY_RIDE_INPUT;

    const steer =
      Number(this.pressed.has("KeyD") || this.pressed.has("ArrowRight")) -
      Number(this.pressed.has("KeyA") || this.pressed.has("ArrowLeft"));
    const input = {
      throttle: Math.max(
        this.virtual.throttle,
        Number(this.pressed.has("KeyW") || this.pressed.has("ArrowUp")),
      ),
      brakeReverse: Math.max(
        this.virtual.brakeReverse,
        Number(this.pressed.has("KeyS") || this.pressed.has("ArrowDown")),
      ),
      steer: this.virtual.steer || steer,
      reset: this.resetQueued || this.virtual.reset,
    };
    this.resetQueued = false;
    this.virtual.reset = false;
    return input;
  }

  setVirtual(input: Partial<RideInput>) {
    this.virtual = { ...this.virtual, ...input };
  }

  dispose() {
    this.releaseAll();
    this.surface.removeEventListener("keydown", this.onKeyDown);
    this.surface.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.releaseAll);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled || !CONTROL_KEYS.has(event.code)) return;
    event.preventDefault();
    if (event.code === "KeyR" && !event.repeat) this.resetQueued = true;
    this.pressed.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (!CONTROL_KEYS.has(event.code)) return;
    this.pressed.delete(event.code);
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden) this.releaseAll();
  };

  private readonly releaseAll = () => {
    this.pressed.clear();
    this.virtual = { ...EMPTY_RIDE_INPUT };
    this.resetQueued = false;
  };
}
