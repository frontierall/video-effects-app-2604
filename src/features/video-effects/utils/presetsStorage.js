const PRESETS_KEY = 'vfx_presets';

export function loadPresets() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePresets(presets) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore storage failures
  }
}
