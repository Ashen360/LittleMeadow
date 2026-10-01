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

// Tool upgrades at the Bramblewick Forge. Level 0 is the starting tool (matches TOOLS above);
// each level's stats are listed per tool. power = hits dealt per swing (a tree takes 5, a rock 2).
// Energy may be fractional; the energy bar shows it smoothly.
export const UPGRADES = {
  order: ['pickaxe', 'axe', 'hoe'],          // rows in the forge menu
  tiers: ['', 'Copper', 'Iron', 'Silver', 'Gold', 'Starlit'],
  // [gold, wood] to reach level 1..5. Stone is too scarce on the farm to ask for.
  cost: [[100, 5], [250, 10], [500, 20], [900, 30], [1500, 40]],
  stats: {
    pickaxe: {
      energy: [3, 2.5, 2, 1.5, 1, 0.5],
      cooldown: [0.45, 0.41, 0.37, 0.33, 0.29, 0.25],
      power: [1, 2, 2, 2, 2, 2],
    },
    axe: {
      energy: [3, 2.5, 2, 1.5, 1, 0.5],
      cooldown: [0.45, 0.41, 0.37, 0.33, 0.29, 0.25],
      power: [1, 2, 2, 3, 4, 5],
    },
    hoe: {
      energy: [2, 1.6, 1.3, 1, 0.7, 0.4],
      cooldown: [0.35, 0.32, 0.29, 0.26, 0.23, 0.2],
    },
  },
};

// Minutes are counted from midnight of the current day; 26:00 = 2:00 the next morning.
export const TIME = {
  dayStart: 6 * 60,
  dayEnd: 26 * 60,        // the clock stops here
  minutesPerStep: 10,
  secondsPerStep: 10,     // real seconds per step (1 in-game hour = 1 real minute)
  daysPerSeason: 28,
  eveningStart: 18 * 60,  // the screen starts to dim
  nightStart: 21 * 60,    // fully dimmed
};

export const ECONOMY = {
  startMoney: 200,
  shopOpen: 9 * 60,       // Fenn's Provisions and the forge share these hours
  shopClose: 17 * 60,
  // What Fenn's Provisions sells, in display order.
  shopStock: ['turnipSeeds', 'potatoSeeds', 'strawberrySeeds'],
};

export const NPC = {
  speed: 40,              // px per second (a little slower than the player)
};

// Friendship points: +perTalk for the first chat each day, up to max. One heart = 100 points.
// tiers: the minimum points for dialogue tier 0, 1, 2.
export const FRIENDSHIP = {
  perTalk: 10,
  max: 1000,
  heart: 100,
  tiers: [0, 100, 300],
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
