export const SCREEN_IDS = [
  'dashboard', 'profile', 'timeline', 'decision', 'calendar',
  'tournament', 'match', 'statistics', 'performance', 'rankings',
  'major-hub', 'major-qualification', 'swiss-stage', 'major-bracket', 'major-match', 'minigames', 'major-ceremony',
  'team', 'roster', 'market', 'contract', 'training', 'health', 'trophies', 'rivalries',
  'season-review', 'financial-report', 'lifestyle', 'inventory', 'investments', 'analytics', 'records', 'trophy-room', 'legacy', 'finance',
  'news', 'social', 'awards', 'retirement', 'hall-of-fame', 'summary', 'settings',
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];
