export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(...parts: (string | number)[]) {
  return seededRandom(hashString(parts.join('|')));
}

export function randomInt(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

export function weightedPick<T>(random: () => number, values: T[], weight: (value: T) => number): T {
  const total = values.reduce((sum, value) => sum + Math.max(0, weight(value)), 0);
  let cursor = random() * total;
  for (const value of values) {
    cursor -= Math.max(0, weight(value));
    if (cursor <= 0) return value;
  }
  return values[values.length - 1];
}
