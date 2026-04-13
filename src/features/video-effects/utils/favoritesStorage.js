const FAVORITES_KEY = 'vfx_favorites';

export function loadFavoriteTemplateIds() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteTemplateIds(ids) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage failures
  }
}
