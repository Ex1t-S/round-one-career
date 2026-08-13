import { AttributeKey, PlayStyle, PlayerAttributes, PlayerRole } from '@/types/game';

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  aim: 'Aim', crosshairPlacement: 'Crosshair', sprayControl: 'Spray control', movement: 'Movement', reaction: 'Reaction', awpSkill: 'AWP', pistolSkill: 'Pistols', entryImpact: 'Entry impact', tradeEfficiency: 'Trade efficiency', clutch: 'Clutch', utilityUsage: 'Utility', flashAssists: 'Flash assists', smokeLineups: 'Smoke lineups', grenadeTiming: 'Grenade timing', positioning: 'Positioning', gameSense: 'Game sense', mapKnowledge: 'Map knowledge', readingOpponents: 'Reading', communication: 'Communication', leadership: 'Leadership', discipline: 'Discipline', adaptability: 'Adaptability', mentalStrength: 'Mental', confidence: 'Confidence', consistency: 'Consistency', stamina: 'Stamina', mediaSkill: 'Media', englishCommunication: 'English', teamChemistry: 'Team chemistry',
};

const allKeys = Object.keys(ATTRIBUTE_LABELS) as AttributeKey[];

export function createBaseAttributes(seed = 48): PlayerAttributes {
  return Object.fromEntries(allKeys.map((key, index) => [key, Math.max(35, Math.min(62, seed + ((index * 7) % 11) - 5))])) as PlayerAttributes;
}

export const ROLE_BONUSES: Record<PlayerRole, Partial<Record<AttributeKey, number>>> = {
  Entry: { aim: 8, reaction: 7, entryImpact: 12, movement: 5, mentalStrength: 3 },
  AWPer: { awpSkill: 14, reaction: 7, positioning: 7, clutch: 5, pistolSkill: -3 },
  Rifler: { aim: 8, sprayControl: 9, tradeEfficiency: 7, consistency: 5 },
  Lurker: { gameSense: 9, readingOpponents: 10, positioning: 8, communication: -2 },
  Support: { utilityUsage: 12, flashAssists: 12, smokeLineups: 10, teamChemistry: 7, aim: -2 },
  IGL: { leadership: 14, communication: 11, readingOpponents: 10, gameSense: 8, aim: -5 },
  Hybrid: { adaptability: 12, awpSkill: 5, aim: 5, gameSense: 5 },
  Anchor: { positioning: 12, mentalStrength: 8, utilityUsage: 6, clutch: 5 },
};

export const STYLE_BONUSES: Record<PlayStyle, Partial<Record<AttributeKey, number>>> = {
  Aggressive: { entryImpact: 7, reaction: 5, discipline: -3 }, Tactical: { gameSense: 7, mapKnowledge: 6, aim: -2 }, Clutch: { clutch: 10, mentalStrength: 6 }, Mechanical: { aim: 8, movement: 6, gameSense: -2 }, 'Team player': { teamChemistry: 9, tradeEfficiency: 6, mediaSkill: 2 }, 'Star player': { confidence: 8, aim: 6, teamChemistry: -2 }, 'Utility specialist': { utilityUsage: 10, grenadeTiming: 8, flashAssists: 7 }, Defensive: { positioning: 8, consistency: 6, entryImpact: -3 }, Flexible: { adaptability: 10, communication: 4, consistency: 3 },
};

export function buildInitialAttributes(role: PlayerRole, style: PlayStyle, age: number): PlayerAttributes {
  const attributes = createBaseAttributes(47 + Math.max(0, 19 - age));
  for (const source of [ROLE_BONUSES[role], STYLE_BONUSES[style]]) {
    for (const [key, value] of Object.entries(source)) {
      attributes[key as AttributeKey] = Math.max(1, Math.min(100, attributes[key as AttributeKey] + (value ?? 0)));
    }
  }
  return attributes;
}
