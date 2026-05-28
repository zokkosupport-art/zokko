const STORAGE_KEY = "zokko_favorites";

export function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isFavorite(listingId) {
  return getFavoriteIds().includes(listingId);
}

export function toggleFavorite(listingId) {
  const ids = getFavoriteIds();
  const next = ids.includes(listingId)
    ? ids.filter((id) => id !== listingId)
    : [listingId, ...ids];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("zokko-favorites-changed"));
  return next.includes(listingId);
}
