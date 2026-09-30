// Soil and crop rules: tilling, watering, planting, growth overnight and harvesting.
// State lives on the map (soil / watered / fallow / cropAt / crops) so it can be saved per map.

import { TILE } from '../config.js';
import { CROPS } from '../data/crops.js';
import { FARMING } from '../data/tuning.js';

export class Farming {
  constructor(atlas) {
    // Stage sprites resolved once per crop.
    this.sprites = {};
    for (const id of Object.keys(CROPS)) {
      this.sprites[id] = Array.from({ length: CROPS[id].stages }, (_, i) => atlas.get(`crop.${id}.${i}`));
    }
  }

  canTill(map, tx, ty) {
    if (!map.inBounds(tx, ty)) return false;
    const i = map.index(tx, ty);
    return map.tileAt(tx, ty).tillable === true && map.soil[i] === 0 && map.objectAt[i] === null;
  }

  till(map, tx, ty) {
    const i = map.index(tx, ty);
    map.soil[i] = 1;
    map.fallow[i] = 0;
  }

  canWater(map, tx, ty) {
    if (!map.inBounds(tx, ty)) return false;
    const i = map.index(tx, ty);
    return map.soil[i] === 1 && map.watered[i] === 0;
  }

  water(map, tx, ty) {
    map.watered[map.index(tx, ty)] = 1;
  }

  canPlant(map, tx, ty) {
    if (!map.inBounds(tx, ty)) return false;
    const i = map.index(tx, ty);
    return map.soil[i] === 1 && map.cropAt[i] === null;
  }

  plant(map, tx, ty, cropId) {
    const def = CROPS[cropId];
    if (!def) return null;
    const crop = {
      id: cropId, def, x: tx, y: ty, growth: 0, stage: 0,
      px: tx * TILE + TILE / 2,
      py: (ty + 1) * TILE,
      // Slightly above the tile bottom, so a player standing on the tile draws in front.
      sortY: ty * TILE + 12,
      sprite: null,
    };
    this.setStage(crop);
    const i = map.index(tx, ty);
    map.cropAt[i] = crop;
    map.fallow[i] = 0;
    map.crops.push(crop);
    return crop;
  }

  cropAtTile(map, tx, ty) {
    return map.inBounds(tx, ty) ? map.cropAt[map.index(tx, ty)] : null;
  }

  isMature(crop) {
    return crop.growth >= crop.def.days;
  }

  // Picks a mature crop. Regrowing crops stay and step back; others are removed.
  // Returns the harvested item id.
  harvest(map, crop) {
    const def = crop.def;
    if (def.regrow > 0) {
      crop.growth = def.days - def.regrow;
      this.setStage(crop);
    } else {
      const i = map.index(crop.x, crop.y);
      map.cropAt[i] = null;
      map.crops.splice(map.crops.indexOf(crop), 1);
    }
    return def.harvestItem;
  }

  setStage(crop) {
    const { days, stages } = crop.def;
    crop.stage = crop.growth >= days ? stages - 1 : Math.floor((crop.growth / days) * (stages - 1));
    crop.sprite = this.sprites[crop.id][crop.stage];
  }

  // Overnight: watered crops grow a day, all soil dries, and soil left empty too long reverts.
  // Pushes the indices of tiles whose ground look changed into `changed`.
  newDay(map, changed) {
    changed.length = 0;
    for (const crop of map.crops) {
      if (map.watered[map.index(crop.x, crop.y)] && crop.growth < crop.def.days) {
        crop.growth++;
        this.setStage(crop);
      }
    }
    for (let i = 0; i < map.soil.length; i++) {
      if (map.soil[i] === 0) continue;
      if (map.watered[i]) {
        map.watered[i] = 0;
        changed.push(i);
      }
      if (map.cropAt[i]) {
        map.fallow[i] = 0;
      } else if (++map.fallow[i] >= FARMING.fallowNights) {
        map.soil[i] = 0;
        map.fallow[i] = 0;
        changed.push(i);
      }
    }
  }
}
