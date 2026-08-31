export class RideLabActionController {
  private keyboardHeld = false;
  private virtualHeld = false;
  private enabled = false;

  constructor(private readonly surface: HTMLElement, private readonly onForcedRelease: () => void) {
    surface.addEventListener("keydown", this.onKeyDown);
    surface.addEventListener("focusout", this.onFocusOut);
    document.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.forceRelease);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.release();
  }

  setVirtual(held: boolean) {
    this.virtualHeld = held;
  }

  read() {
    return this.enabled && (this.keyboardHeld || this.virtualHeld);
  }

  releaseHeldAction() {
    this.release();
  }

  dispose() {
    this.release();
    this.surface.removeEventListener("keydown", this.onKeyDown);
    this.surface.removeEventListener("focusout", this.onFocusOut);
    document.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.forceRelease);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled || event.code !== "Space") return;
    const target = event.target;
    if (target instanceof Element && target.closest("button, a, input, select, textarea, [role='button'], [contenteditable='true']")) return;
    event.preventDefault();
    this.keyboardHeld = true;
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (event.code !== "Space") return;
    if (this.keyboardHeld) event.preventDefault();
    this.keyboardHeld = false;
  };

  private readonly onFocusOut = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node) || !this.surface.contains(event.relatedTarget)) this.forceRelease();
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden) this.forceRelease();
  };

  private readonly forceRelease = () => {
    if (!this.keyboardHeld && !this.virtualHeld) return;
    this.release();
    this.onForcedRelease();
  };

  private readonly release = () => {
    this.keyboardHeld = false;
    this.virtualHeld = false;
  };
}
