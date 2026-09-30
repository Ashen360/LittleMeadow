// Engine-level constants. Gameplay tuning (speeds, prices, costs) lives in src/data/.

export const TILE = 16;

// Logical resolution: 24 x 13.5 tiles. Integer-scales cleanly to 1152x648 and 1920x1080.
export const VIEW_W = 384;
export const VIEW_H = 216;

// Highest backing-store multiplier. Higher = smoother sub-pixel motion, more fill cost.
export const MAX_RENDER_SCALE = 3;

// Simulation sub-step cap (prevents tunnelling through 16 px tiles) and frame dt cap.
export const MAX_STEP = 1 / 30;
export const MAX_FRAME_DT = 0.25;
