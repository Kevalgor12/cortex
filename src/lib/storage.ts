// Thin, safe wrapper over localStorage. Everything is namespaced so future
// features (stats, achievements, daily challenge) share one clean key space.
const PREFIX = 'cortex:';

export function readValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures — persistence is best-effort.
  }
}
