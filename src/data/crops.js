// Crop definitions. days = watered days to mature; stages = sprite count (crop.<id>.0 … N-1);
// regrow = days to fruit again after a harvest (0 = the plant is removed when harvested).
// Buy and sell prices live on the seed and harvest items in items.js.

export const CROPS = {
  turnip: {
    id: 'turnip', seedItem: 'turnipSeeds', harvestItem: 'turnip',
    days: 4, stages: 4, regrow: 0,
  },
  potato: {
    id: 'potato', seedItem: 'potatoSeeds', harvestItem: 'potato',
    days: 6, stages: 5, regrow: 0,
  },
  strawberry: {
    id: 'strawberry', seedItem: 'strawberrySeeds', harvestItem: 'strawberry',
    days: 8, stages: 5, regrow: 3,
  },
};
