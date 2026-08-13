export type Region = 'Europe' | 'CIS' | 'North America' | 'South America' | 'Brazil' | 'Argentina' | 'Asia' | 'Oceania' | 'Middle East' | 'Africa' | 'International';
export type TeamTier = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Semi-pro' | 'Amateur' | 'Academy' | 'Mix' | 'Free agents';
export type PlayerRole = 'Entry' | 'AWPer' | 'Rifler' | 'Lurker' | 'Support' | 'IGL' | 'Hybrid' | 'Anchor';
export type PlayStyle = 'Aggressive' | 'Tactical' | 'Clutch' | 'Mechanical' | 'Team player' | 'Star player' | 'Utility specialist' | 'Defensive' | 'Flexible';
export type Personality = 'Ambicioso' | 'Disciplinado' | 'Carismático' | 'Reservado' | 'Competitivo' | 'Analítico';
export type CareerPath = 'player' | 'coach' | 'analyst' | 'creator' | 'retired';
export type EventCategory = 'training' | 'transfer' | 'relationship' | 'contract' | 'money' | 'equipment' | 'schedule' | 'travel' | 'rest' | 'injury' | 'nutrition' | 'mental' | 'social' | 'streaming' | 'media' | 'sponsor' | 'conflict' | 'rivalry' | 'role' | 'language' | 'bootcamp' | 'confidence' | 'team' | 'igl' | 'coach' | 'fanbase' | 'pressure' | 'integrity' | 'suspension' | 'retirement';
export type TournamentTier = 'S' | 'A' | 'B' | 'C' | 'Qualifier';
export type TournamentFormat = 'BO1' | 'BO3' | 'BO5' | 'Swiss' | 'Round robin' | 'Double elimination' | 'Single elimination' | 'Groups + playoffs' | 'RMR' | 'Major stages' | 'Play-in';
export type CalendarKind = 'preseason' | 'market' | 'bootcamp' | 'scrim' | 'qualifier' | 'rmr' | 'tournament' | 'major' | 'offseason' | 'vacation' | 'renewal' | 'awards';
export type MajorStage = 'not-started' | 'open-qualifier' | 'closed-qualifier' | 'rmr' | 'opening-stage' | 'elimination-stage' | 'playoffs' | 'quarterfinal' | 'semifinal' | 'grand-final' | 'ceremony' | 'eliminated' | 'completed';
export type MajorEntryPath = 'open-qualifier' | 'closed-qualifier' | 'regional-invite' | 'ranking' | 'rmr' | 'direct-invite' | 'defending-champion';
export type MinigameId = 'clutch' | 'map-veto' | 'round-buy' | 'tactical-timeout' | 'retake-save' | 'peek-timing' | 'utility-memory' | 'minimap-read' | 'spray-control' | 'overtime-decision';
export type MinigameMode = 'all' | 'important' | 'majors' | 'key-decisions' | 'auto';
export type MinigameDifficulty = 'easy' | 'normal' | 'hard';
export type UpgradeCategory = 'equipment' | 'training' | 'health' | 'housing' | 'brand' | 'staff' | 'investment' | 'luxury';

export type AttributeKey =
  | 'aim' | 'crosshairPlacement' | 'sprayControl' | 'movement' | 'reaction' | 'awpSkill'
  | 'pistolSkill' | 'entryImpact' | 'tradeEfficiency' | 'clutch' | 'utilityUsage'
  | 'flashAssists' | 'smokeLineups' | 'grenadeTiming' | 'positioning' | 'gameSense'
  | 'mapKnowledge' | 'readingOpponents' | 'communication' | 'leadership' | 'discipline'
  | 'adaptability' | 'mentalStrength' | 'confidence' | 'consistency' | 'stamina'
  | 'mediaSkill' | 'englishCommunication' | 'teamChemistry';

export type PlayerAttributes = Record<AttributeKey, number>;

export interface PlayerIdentity {
  fullName: string;
  nickname: string;
  nationality: string;
  region: Region;
  city: string;
  age: number;
  primaryLanguage: string;
  secondaryLanguages: string[];
  handedness: 'Diestro' | 'Zurdo';
  height?: number;
  personality: Personality;
  ambition: number;
  riskTolerance: number;
  priority: 'Estabilidad' | 'Dinero' | 'Títulos' | 'Minutos';
  role: PlayerRole;
  style: PlayStyle;
}

export interface PlayerCareer {
  identity: PlayerIdentity;
  attributes: PlayerAttributes;
  level: number;
  xp: number;
  trainingPoints: number;
  form: number;
  fatigue: number;
  burnout: number;
  injuryRisk: number;
  motivation: number;
  pressure: number;
  reputation: number;
  fanbase: number;
  marketValue: number;
  money: number;
  path: CareerPath;
  benched: boolean;
  injuredWeeks: number;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  region: Region;
  country: string;
  city: string;
  tier: TeamTier;
  globalLevel: number;
  initialRanking: number;
  vrsPoints: number;
  budget: number;
  averageSalary: number;
  popularity: number;
  fanbase: number;
  staffQuality: number;
  analystQuality: number;
  coachQuality: number;
  stability: number;
  culture: 'Structured' | 'Aggressive' | 'Development' | 'Star system' | 'Family' | 'International';
  aggression: number;
  tacticalStyle: string;
  mapPool: string[];
  objective: string;
  rivals: string[];
  roster: string[];
  substitutes: string[];
  igl: string;
  awper: string;
  star: string;
  contractStatus: 'Stable' | 'Rebuilding' | 'Expiring' | 'Academy';
  chemistry: number;
  titles: number;
  sponsorLevel: number;
  rosterRisk: number;
  transferActivity: number;
  color: string;
  dataStatus: 'official-snapshot' | 'approximate' | 'generated';
}

export interface MapDefinition {
  id: string;
  name: string;
  active: boolean;
  legacy?: boolean;
  ctBias: number;
  tBias: number;
  modifiers: Partial<Record<PlayerRole | 'Utility' | 'Clutch' | 'Experience', number>>;
  description: string;
}

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  kind: 'major' | 'rmr' | 'international' | 'regional' | 'online' | 'academy' | 'showmatch' | 'qualifier';
  tier: TournamentTier;
  region: Region;
  month: number;
  week: number;
  prizePool: number;
  format: TournamentFormat;
  seriesFormat: 'BO1' | 'BO3' | 'BO5';
  teams: number;
  durationWeeks: number;
  prestige: number;
  pressure: number;
  rankingPoints: number;
  inviteChance: number;
  qualification: string;
  stages: string[];
  winnerPrize: number;
  contractImpact: number;
  reputationImpact: number;
  mapPool: string[];
  location: string;
}

export interface CalendarEvent {
  id: string;
  season: number;
  month: number;
  week: number;
  title: string;
  kind: CalendarKind;
  status: 'upcoming' | 'active' | 'completed' | 'missed';
  tournamentId?: string;
  description: string;
}

export interface Contract {
  teamId: string;
  monthlySalary: number;
  monthsRemaining: number;
  prizeShare: number;
  winBonus: number;
  majorBonus: number;
  mvpBonus: number;
  buyout: number;
  guaranteedRole: PlayerRole;
  streamingAllowed: boolean;
  decisionInfluence: number;
  vacationWeeks: number;
  personalStaff: boolean;
}

export interface MatchStats {
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  adr: number;
  kast: number;
  rating: number;
  openingKills: number;
  openingDeaths: number;
  firstKillPercentage: number;
  clutches: number;
  clutch1v1: number;
  clutch1v2: number;
  clutch1v3: number;
  clutch1v4: number;
  clutch1v5: number;
  headshotPercentage: number;
  damage: number;
  flashAssists: number;
  utilityDamage: number;
  tradeKills: number;
  entrySuccess: number;
  multiKills: number;
  ecoKills: number;
  antiEcoPerformance: number;
  ctRating: number;
  tRating: number;
  overtimeRating: number;
  pistolRating: number;
  pressureRating: number;
}

export interface MapResult {
  mapId: string;
  teamScore: number;
  opponentScore: number;
  overtime: boolean;
  playerStats: MatchStats;
}

export interface MatchResult {
  id: string;
  season: number;
  month: number;
  week: number;
  tournamentId: string;
  opponentTeamId: string;
  format: 'BO1' | 'BO3' | 'BO5';
  won: boolean;
  seriesScore: string;
  maps: MapResult[];
  aggregate: MatchStats;
  highlights: string[];
  explanation: string[];
  fatigueChange: number;
  confidenceChange: number;
  injuryOccurred: boolean;
}

export interface DecisionEffect {
  attributes?: Partial<Record<AttributeKey, number>>;
  flags?: Record<string, boolean | number | string>;
  confidence?: number;
  chemistry?: number;
  reputation?: number;
  money?: number;
  fatigue?: number;
  burnout?: number;
  motivation?: number;
  pressure?: number;
  coachRelationship?: number;
  iglRelationship?: number;
  fanbase?: number;
  trainingPoints?: number;
}

export interface DecisionChoice {
  id: string;
  title: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  effectPreview: string;
  effects: DecisionEffect;
  outcome: string;
}

export interface CareerDecision {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  choices: DecisionChoice[];
  minSeason?: number;
  requiredFlags?: string[];
  blockedFlags?: string[];
  weight: number;
}

export interface DecisionRecord {
  eventId: string;
  choiceId: string;
  season: number;
  week: number;
  outcome: string;
}

export interface Trophy {
  id: string;
  name: string;
  season: number;
  tier: TournamentTier;
  mvp: boolean;
}

export interface RankingEntry {
  teamId: string;
  rank: number;
  points: number;
  trend: number;
}

export interface SwissRecord { wins: number; losses: number; buchholz: number; }

export interface SwissRoundMatch {
  id: string;
  round: number;
  teamAId: string;
  teamBId: string;
  format: 'BO1' | 'BO3';
  winnerId?: string;
  loserId?: string;
  score?: string;
  explanation: string[];
}

export interface SwissStanding {
  teamId: string;
  record: SwissRecord;
  opponents: string[];
  status: 'active' | 'qualified' | 'eliminated';
}

export interface BracketMatch {
  id: string;
  round: 'quarterfinal' | 'semifinal' | 'grand-final';
  slot: number;
  teamAId?: string;
  teamBId?: string;
  winnerId?: string;
  loserId?: string;
  format: 'BO3' | 'BO5';
  score?: string;
  mvp?: string;
  highlight?: string;
}

export interface BracketState {
  participants: string[];
  matches: BracketMatch[];
  championId?: string;
  runnerUpId?: string;
}

export interface MajorCampaignState {
  id: string;
  tournamentId: string;
  season: number;
  stage: MajorStage;
  entryPath: MajorEntryPath;
  qualified: boolean;
  status: 'upcoming' | 'active' | 'eliminated' | 'completed';
  participants: string[];
  swiss: SwissStanding[];
  swissRounds: SwissRoundMatch[][];
  bracket?: BracketState;
  pendingOpponentId?: string;
  pendingMinigameId?: MinigameId;
  playerMatchIds: string[];
  objectives: string[];
  news: string[];
  gallery: string[];
  playerRating: number;
  playerKills: number;
  mediaPressure: number;
  mvp?: string;
  allStarTeam: string[];
  records: string[];
  outcome?: string;
}

export interface MinigameDefinition {
  id: MinigameId;
  name: string;
  description: string;
  attributeKeys: AttributeKey[];
  timeLimitSeconds?: number;
  options: string[];
  maxModifier: number;
}

export interface MinigameState {
  id: string;
  definitionId: MinigameId;
  majorCampaignId?: string;
  matchContext: string;
  difficulty: MinigameDifficulty;
  step: number;
  choices: string[];
  options: string[];
  promptSequence: string[];
  clue: string;
  contextMetrics: Record<string, number | string>;
  score: number;
  startedAt: string;
}

export interface MinigameResult {
  id: string;
  definitionId: MinigameId;
  season: number;
  score: number;
  success: boolean;
  modifier: number;
  choices: string[];
  explanation: string;
  simulated: boolean;
  createdAt: string;
}

export interface FinancialSeasonSummary {
  season: number;
  salary: number;
  prizeMoney: number;
  winBonuses: number;
  tournamentBonuses: number;
  majorBonuses: number;
  mvpBonuses: number;
  sponsors: number;
  streaming: number;
  content: number;
  otherIncome: number;
  taxes: number;
  agentFees: number;
  housing: number;
  travel: number;
  health: number;
  training: number;
  maintenance: number;
  purchases: number;
  balance: number;
  closingCash: number;
  netWorth: number;
}

export interface OwnedUpgrade {
  upgradeId: string;
  level: number;
  acquiredSeason: number;
  purchasePrice: number;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  category: UpgradeCategory;
  description: string;
  basePrice: number;
  maxLevel: number;
  maintenance: number;
  requiredReputation: number;
  requiredLevel: number;
  requiredTitles: number;
  weeklyTime: number;
  resaleRate: number;
  risk: number;
  benefits: Partial<Record<AttributeKey | 'fatigueRecovery' | 'injuryProtection' | 'burnoutProtection' | 'motivation' | 'fanbase' | 'sponsorIncome' | 'streamingIncome' | 'trainingEfficiency' | 'technicalReliability' | 'regionalMobility' | 'financialStability', number>>;
  imageKey: string;
}

export interface Property { id: string; upgradeId: string; value: number; maintenance: number; acquiredSeason: number; }
export interface Investment { id: string; upgradeId: string; principal: number; currentValue: number; annualReturn: number; risk: number; acquiredSeason: number; }
export interface PurchaseRecord { id: string; upgradeId: string; season: number; price: number; level: number; }
export interface Inventory { upgrades: OwnedUpgrade[]; properties: Property[]; investments: Investment[]; purchaseHistory: PurchaseRecord[]; }

export interface CareerRecords {
  bestRating: number;
  bestAdr: number;
  mostKills: number;
  longestWinStreak: number;
  majorWins: number;
  majorMvps: number;
  clutches: number;
  earnings: number;
  minigameHighScore: number;
}

export interface SeasonalStatistics {
  season: number;
  matches: number;
  wins: number;
  rating: number;
  adr: number;
  kast: number;
  kd: number;
  clutches: number;
  worldRank: number;
  marketValue: number;
  salary: number;
  attributeAverage: number;
}

export interface VisualAssetReferences {
  avatarId: string;
  majorBanners: Record<string, string>;
  endingAsset: string;
}

export interface CareerState {
  schemaVersion: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  player: PlayerCareer;
  teamId: string;
  season: number;
  year: number;
  month: number;
  week: number;
  calendar: CalendarEvent[];
  contract: Contract;
  matches: MatchResult[];
  decisions: DecisionRecord[];
  trophies: Trophy[];
  rankings: RankingEntry[];
  flags: Record<string, boolean | number | string>;
  chemistry: number;
  coachRelationship: number;
  iglRelationship: number;
  rivalries: Record<string, number>;
  news: string[];
  socialFeed: string[];
  awards: string[];
  majorCampaigns: MajorCampaignState[];
  activeMajorId?: string;
  pendingMinigame?: MinigameState;
  minigameHistory: MinigameResult[];
  financialHistory: FinancialSeasonSummary[];
  inventory: Inventory;
  netWorth: number;
  careerRecords: CareerRecords;
  seasonalStatistics: SeasonalStatistics[];
  visualAssets: VisualAssetReferences;
  offseasonPending: boolean;
  offseasonStep: number;
  pendingDecisionId?: string;
  pendingMatchId?: string;
  finished: boolean;
  ending?: string;
  settings: {
    simulationSpeed: 'detailed' | 'balanced' | 'fast';
    minigames: boolean;
    minigameMode: MinigameMode;
    minigameDifficulty: MinigameDifficulty;
    reducedMotion: boolean;
    animations: 'full' | 'simple';
    sound: boolean;
    vibration: boolean;
    autosave: boolean;
  };
}

export interface TrainingActivity {
  id: string;
  name: string;
  description: string;
  attributes: AttributeKey[];
  pointCost: number;
  moneyCost: number;
  fatigue: number;
  burnout: number;
  gains: number;
}

export interface SeasonAdvanceResult {
  state: CareerState;
  messages: string[];
  requiresDecision: boolean;
  requiresMatch: boolean;
}
