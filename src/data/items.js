// Item definitions. tool = key into TOOLS (tools never stack); seed = key into CROPS;
// energy = restored when eaten (right click); price = cost at the shop;
// sellPrice = paid per item through the shipping box (no sellPrice = can't be shipped).

export const ITEMS = {
  hoe: { name: 'Hoe', icon: 'item.hoe', tool: 'hoe', desc: 'Tills field soil for planting.' },
  wateringCan: {
    name: 'Watering Can', icon: 'item.can', tool: 'can',
    desc: 'Waters tilled soil. Refill it at the pond.',
  },
  axe: { name: 'Axe', icon: 'item.axe', tool: 'axe', desc: 'Chops branches, trees and stumps.' },
  pickaxe: { name: 'Pickaxe', icon: 'item.pickaxe', tool: 'pickaxe', desc: 'Breaks rocks.' },

  turnipSeeds: {
    name: 'Turnip Seeds', icon: 'item.seeds.turnip', seed: 'turnip', price: 20, sellPrice: 10,
    desc: 'Plant in tilled soil. Ready in 4 days.',
  },
  potatoSeeds: {
    name: 'Potato Seeds', icon: 'item.seeds.potato', seed: 'potato', price: 40, sellPrice: 20,
    desc: 'Plant in tilled soil. Ready in 6 days.',
  },
  strawberrySeeds: {
    name: 'Strawberry Seeds', icon: 'item.seeds.strawberry', seed: 'strawberry', price: 80, sellPrice: 40,
    desc: 'Ready in 8 days, then fruits every 3 days.',
  },

  turnip: { name: 'Turnip', icon: 'item.turnip', energy: 12, sellPrice: 45, desc: 'Crisp and a little peppery.' },
  potato: { name: 'Potato', icon: 'item.potato', energy: 16, sellPrice: 90, desc: 'Earthy and filling.' },
  strawberry: { name: 'Strawberry', icon: 'item.strawberry', energy: 10, sellPrice: 60, desc: 'Sweet, sun-warmed.' },

  wood: { name: 'Wood', icon: 'item.wood', sellPrice: 2, desc: 'Sturdy. Useful for building, later.' },
  stone: { name: 'Stone', icon: 'item.stone', sellPrice: 3, desc: 'A good, solid stone.' },
};
