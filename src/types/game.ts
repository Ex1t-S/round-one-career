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
  pendingDecisionId?: string;
  pendingMatchId?: string;
  finished: boolean;
  ending?: string;
  settings: {
    simulationSpeed: 'detailed' | 'balanced' | 'fast';
    minigames: boolean;
    reducedMotion: boolean;
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
