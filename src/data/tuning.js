// Gameplay tuning numbers. Systems read these; change the balance here, not in system code.

export const PLAYER = {
  maxEnergy: 100,
};

// energy = cost per successful use, cooldown = seconds per swing (also the swing animation).
export const TOOLS = {
  hoe: { energy: 2, cooldown: 0.35 },
  can: { energy: 1, cooldown: 0.35, capacity: 20 },
  axe: { energy: 3, cooldown: 0.45 },
  pickaxe: { energy: 3, cooldown: 0.45 },
};

export const FARMING = {
  // Tilled soil with no crop reverts to plain field after this many nights.
  fallowNights: 3,
};

export const INVENTORY = {
  size: 24,
  hotbar: 9,
  stack: 99,
};

// [itemId, quantity], in slot order (the first 9 land on the hotbar).
export const STARTING_ITEMS = [
  ['hoe', 1],
  ['wateringCan', 1],
  ['axe', 1],
  ['pickaxe', 1],
  ['turnipSeeds', 12],
];

// Extra items with ?debug, so every crop can be tested before the shop exists (Phase 3).
export const DEBUG_ITEMS = [
  ['potatoSeeds', 6],
  ['strawberrySeeds', 4],
];
