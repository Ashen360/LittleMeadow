// Player settings, kept in localStorage separately from the save (they apply to every farm).

const KEY = 'littlemeadow.settings';

export const DEFAULT_SETTINGS = {
  musicVolume: 5,      // 0..10
  sfxVolume: 7,        // 0..10
  renderScale: 0,      // 0 = auto (up to 3x), otherwise the maximum backing-store multiplier
  largeText: false,    // dialogue and messages drawn at 2x
  holdToRepeat: true,  // holding the use button keeps swinging the tool
  bindings: {},        // action -> [KeyboardEvent.code, ...] overrides
};

export function loadSettings() {
  const s = { ...DEFAULT_SETTINGS, bindings: {} };
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      for (const k of Object.keys(DEFAULT_SETTINGS)) {
        if (typeof saved[k] === typeof DEFAULT_SETTINGS[k]) s[k] = saved[k];
      }
    }
  } catch {
    // Storage blocked or corrupt: defaults.
  }
  return s;
}

export function saveSettings(s) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Not fatal: settings just won't persist.
  }
}
