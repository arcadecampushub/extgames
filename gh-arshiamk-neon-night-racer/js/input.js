const KEYMAP = {
  ArrowUp: "throttle",
  KeyW: "throttle",
  ArrowDown: "brake",
  KeyS: "brake",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export class Input {
  constructor() {
    this.throttle = false;
    this.brake = false;
    this.left = false;
    this.right = false;
    this._startPressed = false;
    this._mutePressed = false;

    window.addEventListener("keydown", (e) => this._onKey(e, true));
    window.addEventListener("keyup", (e) => this._onKey(e, false));
    this._bindTouch();
  }

  _bindTouch() {
    const root = document.getElementById("touch-controls");
    if (!root) return;
    for (const btn of root.querySelectorAll("[data-action]")) {
      const action = btn.dataset.action;
      const set = (v) => (e) => {
        e.preventDefault();
        this[action] = v;
        btn.classList.toggle("held", v);
      };
      btn.addEventListener("pointerdown", set(true));
      btn.addEventListener("pointerup", set(false));
      btn.addEventListener("pointercancel", set(false));
      btn.addEventListener("pointerleave", set(false));
    }
    // Tapping a start/game-over overlay acts as Enter.
    for (const ov of document.querySelectorAll(".overlay")) {
      ov.addEventListener("pointerdown", () => {
        this._startPressed = true;
      });
    }
  }

  _onKey(e, down) {
    const action = KEYMAP[e.code];
    if (action) {
      this[action] = down;
      e.preventDefault();
    } else if (e.code === "Enter" && down) {
      this._startPressed = true;
    } else if (e.code === "KeyM" && down) {
      this._mutePressed = true;
    }
  }

  get steer() {
    return (this.right ? 1 : 0) - (this.left ? 1 : 0);
  }

  // Edge-triggered: returns true once per Enter press.
  consumeStart() {
    const pressed = this._startPressed;
    this._startPressed = false;
    return pressed;
  }

  consumeMute() {
    const pressed = this._mutePressed;
    this._mutePressed = false;
    return pressed;
  }
}
