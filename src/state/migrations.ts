import { CareerState } from '@/types/game';
import { calculateNetWorth } from '@/engine/upgrades';
import { getMinigameDefinition } from '@/engine/minigames';
import { hashString } from '@/engine/random';
import { overallRating } from '@/engine/progression';

export const CAREER_SCHEMA_VERSION = 4;

const defaultRecords = () => ({ bestRating: 0, bestAdr: 0, mostKills: 0, longestWinStreak: 0, majorWins: 0, majorMvps: 0, clutches: 0, earnings: 0, minigameHighScore: 0, bestPlayerRank: 0 });

export function isImportableCareer(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CareerState>;
  return typeof candidate.schemaVersion === 'number' && candidate.schemaVersion >= 1 && candidate.schemaVersion <= CAREER_SCHEMA_VERSION && Boolean(candidate.player?.identity?.nickname) && Array.isArray(candidate.matches) && Array.isArray(candidate.rankings);
}

function finiteNumbers(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteNumbers);
  if (value && typeof value === 'object') return Object.values(value).every(finiteNumbers);
  return true;
}

export function migrateCareerState(value: unknown): CareerState | null {
  if (!isImportableCareer(value) || !finiteNumbers(value)) return null;
  const source = value as CareerState;
  const pendingDefinition = source.pendingMinigame ? getMinigameDefinition(source.pendingMinigame.definitionId) : undefined;
  const migrated: CareerState = {
    ...source,
    schemaVersion: CAREER_SCHEMA_VERSION,
    majorCampaigns: Array.isArray(source.majorCampaigns) ? source.majorCampaigns : [],
    minigameHistory: Array.isArray(source.minigameHistory) ? source.minigameHistory : [],
    pendingMinigame: source.pendingMinigame ? { ...source.pendingMinigame, options: source.pendingMinigame.options ?? pendingDefinition?.options ?? [], promptSequence: source.pendingMinigame.promptSequence ?? [], clue: source.pendingMinigame.clue ?? pendingDefinition?.description ?? '', contextMetrics: source.pendingMinigame.contextMetrics ?? {} } : undefined,
    financialHistory: Array.isArray(source.financialHistory) ? source.financialHistory : [],
    inventory: source.inventory && Array.isArray(source.inventory.upgrades) ? { ...source.inventory, properties: source.inventory.properties ?? [], investments: source.inventory.investments ?? [], purchaseHistory: source.inventory.purchaseHistory ?? [], consumables: source.inventory.consumables ?? [] } : { upgrades: [], properties: [], investments: [], purchaseHistory: [], consumables: [] },
    netWorth: Number.isFinite(source.netWorth) ? source.netWorth : source.player.money,
    careerRecords: { ...defaultRecords(), ...(source.careerRecords ?? {}) },
    seasonalStatistics: Array.isArray(source.seasonalStatistics) ? source.seasonalStatistics : [],
    playerRankingHistory: Array.isArray(source.playerRankingHistory) ? source.playerRankingHistory : [],
    visualAssets: source.visualAssets ?? { avatarId: 'avatar-01', majorBanners: { 'colonge-major': 'major-cologne', 'singapore-major': 'major-singapore' }, endingAsset: 'career-finale' },
    careerSeed: Number.isFinite(source.careerSeed) ? source.careerSeed : hashString(source.id),
    seasonVariance: Number.isFinite(source.seasonVariance) ? source.seasonVariance : 0,
    squad: source.squad ?? { role: source.player.benched ? 'benched' : 'rotation', coachTrust: source.coachRelationship ?? 50, roleSecurity: source.player.benched ? 25 : 55, mapShare: source.player.benched ? 18 : 72, internalCompetition: 55, competitorName: 'academy player', seasonsAtTeam: 1, lastChangeReason: 'Estado reconstruido desde el guardado anterior.' },
    offers: Array.isArray(source.offers) ? source.offers : [],
    tournamentCampaigns: Array.isArray(source.tournamentCampaigns) ? source.tournamentCampaigns : [],
    deferredConsequences: Array.isArray(source.deferredConsequences) ? source.deferredConsequences : [],
    decisionSlotsUsed: Array.isArray(source.decisionSlotsUsed) ? source.decisionSlotsUsed : [],
    seasonStartSnapshot: source.seasonStartSnapshot ?? { overall: overallRating(source.player.attributes), reputation: source.player.reputation, teamRank: source.rankings.find((entry) => entry.teamId === source.teamId)?.rank ?? 100, money: source.player.money },
    offseasonPending: Boolean(source.offseasonPending),
    offseasonStep: Number.isFinite(source.offseasonStep) ? source.offseasonStep : 0,
    settings: {
      simulationSpeed: source.settings?.simulationSpeed ?? 'balanced',
      minigames: source.settings?.minigames ?? true,
      minigameMode: source.settings?.minigameMode ?? 'important',
      minigameDifficulty: source.settings?.minigameDifficulty ?? 'normal',
      reducedMotion: source.settings?.reducedMotion ?? false,
      animations: source.settings?.animations ?? 'full',
      sound: source.settings?.sound ?? false,
      vibration: source.settings?.vibration ?? true,
      autosave: source.settings?.autosave ?? true,
    },
  };
  migrated.netWorth = calculateNetWorth(migrated);
  return migrated;
}
