// Versioned saves in localStorage. Writes go to a temp key first, the previous save is kept as
// a backup, and loading falls back to the backup if the main save is unreadable.
// Old saves are upgraded by chained migrations: MIGRATIONS[n] turns a version-n save into n+1.

export const SAVE_VERSION = 2;

const KEY = 'littlemeadow.save';
const BACKUP_KEY = 'littlemeadow.save.bak';
const TEMP_KEY = 'littlemeadow.save.tmp';

const MIGRATIONS = {
  // v2 adds the Bramblewick Forge at (24, 5). Saves list every map object, so older towns get
  // it here; whatever stood on its lot (a tree, or its stump) is cleared.
  1: (data) => {
    const town = data.maps && data.maps.town;
    if (town && Array.isArray(town.objects)) {
      town.objects = town.objects.filter(([, x, y]) => !(x >= 24 && x <= 26 && y >= 5 && y <= 7));
      town.objects.push(['forge', 24, 5]);
    }
    data.version = 2;
    return data;
  },
};

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null; // blocked (privacy settings, sandboxed file://)
  }
}

function parse(json) {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    return data && typeof data.version === 'number' ? data : null;
  } catch {
    return null;
  }
}

export function migrate(data) {
  while (data.version < SAVE_VERSION) {
    const step = MIGRATIONS[data.version];
    if (!step) throw new Error(`No save migration from version ${data.version}`);
    data = step(data);
  }
  if (data.version > SAVE_VERSION) throw new Error('This save comes from a newer version of the game.');
  return data;
}

export class SaveManager {
  static available() {
    const s = storage();
    if (!s) return false;
    try {
      s.setItem(TEMP_KEY, '1');
      s.removeItem(TEMP_KEY);
      return true;
    } catch {
      return false;
    }
  }

  static hasSave() {
    const s = storage();
    if (!s) return false;
    try {
      return parse(s.getItem(KEY)) !== null || parse(s.getItem(BACKUP_KEY)) !== null;
    } catch {
      return false;
    }
  }

  // Returns the migrated save data, or null if there is no usable save.
  static load() {
    const s = storage();
    if (!s) return null;
    for (const key of [KEY, BACKUP_KEY]) {
      try {
        const data = parse(s.getItem(key));
        if (data) return migrate(data);
      } catch (err) {
        console.warn(`Little Meadow: couldn't load ${key}:`, err);
      }
    }
    return null;
  }

  // Returns true on success.
  static write(data) {
    const s = storage();
    if (!s) return false;
    try {
      const json = JSON.stringify(data);
      s.setItem(TEMP_KEY, json);
      const previous = s.getItem(KEY);
      if (previous) s.setItem(BACKUP_KEY, previous);
      s.setItem(KEY, json);
      s.removeItem(TEMP_KEY);
      return true;
    } catch (err) {
      console.warn('Little Meadow: saving failed:', err);
      return false;
    }
  }

  static exportText() {
    const s = storage();
    return s ? s.getItem(KEY) : null;
  }

  // Validates and stores an exported save. Returns an error message, or null on success.
  static importText(json) {
    const data = parse(json);
    if (!data) return 'That file is not a Little Meadow save.';
    try {
      migrate(data);
    } catch (err) {
      return err.message;
    }
    return SaveManager.write(data) ? null : 'Saving is not available in this browser.';
  }
}
