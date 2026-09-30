// Keyboard and mouse mapped to named actions. Bindings use KeyboardEvent.code, so WASD stays
// in the same physical place on AZERTY/QWERTZ keyboards.

import { VIEW_W, VIEW_H } from '../config.js';

export const DEFAULT_BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  interact: ['KeyE'],
  use: ['Space'],
  confirm: ['Enter', 'NumpadEnter'],
  menu: ['Escape'],
  inventory: ['Tab', 'KeyI'],
  nextDay: ['KeyN'], // temporary until sleeping exists (Phase 2)
  debug: ['F3', 'Backquote'],
  slot1: ['Digit1'], slot2: ['Digit2'], slot3: ['Digit3'],
  slot4: ['Digit4'], slot5: ['Digit5'], slot6: ['Digit6'],
  slot7: ['Digit7'], slot8: ['Digit8'], slot9: ['Digit9'],
};

const DIRECTIONS = ['up', 'down', 'left', 'right'];

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.dirOrder = []; // held directions, most recent last
    this.mouse = { x: 0, y: 0, inside: false, left: false, right: false, leftPressed: false, rightPressed: false };
    this.wheel = 0;          // wheel steps this frame (+ = down)
    this.usingMouse = false; // true after the mouse moves, false after a direction key
    this.activity = false; // any input event this frame (used to trigger a redraw)
    this.setBindings(DEFAULT_BINDINGS);

    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.releaseAll());
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseleave', () => { this.mouse.inside = false; this.activity = true; });
    canvas.addEventListener('mousedown', (e) => this.onMouseButton(e, true));
    window.addEventListener('mouseup', (e) => this.onMouseButton(e, false));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY !== 0) this.wheel += Math.sign(e.deltaY);
      this.activity = true;
    }, { passive: false });
  }

  setBindings(bindings) {
    this.bindings = bindings;
    this.codeToActions = new Map();
    for (const [action, codes] of Object.entries(bindings)) {
      for (const code of codes) {
        if (!this.codeToActions.has(code)) this.codeToActions.set(code, []);
        this.codeToActions.get(code).push(action);
      }
    }
  }

  onKey(e, down) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
    const actions = this.codeToActions.get(e.code);
    if (!actions) return;
    e.preventDefault();
    if (down && e.repeat) return;
    this.activity = true;
    for (const a of actions) {
      if (down) {
        if (this.held.has(a)) continue;
        this.held.add(a);
        this.pressed.add(a);
        if (DIRECTIONS.includes(a)) {
          this.dirOrder.push(a);
          this.usingMouse = false;
        }
      } else {
        this.held.delete(a);
        const k = this.dirOrder.indexOf(a);
        if (k >= 0) this.dirOrder.splice(k, 1);
      }
    }
  }

  onMouseMove(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
    this.mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
    this.mouse.inside = true;
    this.usingMouse = true;
    this.activity = true;
  }

  onMouseButton(e, down) {
    if (e.button === 0) {
      if (down && !this.mouse.left) this.mouse.leftPressed = true;
      this.mouse.left = down;
    } else if (e.button === 2) {
      if (down && !this.mouse.right) this.mouse.rightPressed = true;
      this.mouse.right = down;
    }
    this.activity = true;
  }

  releaseAll() {
    this.held.clear();
    this.dirOrder.length = 0;
    this.mouse.left = this.mouse.right = false;
    this.activity = true;
  }

  isDown(action) {
    return this.held.has(action);
  }

  wasPressed(action) {
    return this.pressed.has(action);
  }

  axisX() {
    return (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0);
  }

  axisY() {
    return (this.held.has('down') ? 1 : 0) - (this.held.has('up') ? 1 : 0);
  }

  // The most recently pressed direction that is still held (drives facing), or null.
  lastDirection() {
    const n = this.dirOrder.length;
    return n ? this.dirOrder[n - 1] : null;
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
    this.wheel = 0;
    this.activity = false;
  }
}
