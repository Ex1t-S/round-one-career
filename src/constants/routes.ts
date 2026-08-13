export const SCREEN_IDS = [
  'dashboard', 'profile', 'timeline', 'decision', 'calendar',
  'tournament', 'match', 'statistics', 'rankings',
  'team', 'roster', 'market', 'contract', 'training', 'health', 'trophies', 'rivalries',
  'news', 'social', 'awards', 'retirement', 'hall-of-fame', 'summary', 'settings',
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

