import { Region, Tournament } from '@/types/game';
import { ACTIVE_MAP_IDS } from './maps';

const make = (input: Partial<Tournament> & Pick<Tournament, 'id' | 'name' | 'shortName' | 'kind' | 'tier' | 'region' | 'month' | 'week' | 'prizePool' | 'format' | 'seriesFormat' | 'teams' | 'location'>): Tournament => ({
  durationWeeks: input.kind === 'major' ? 3 : input.tier === 'S' ? 2 : 1,
  prestige: input.kind === 'major' ? 100 : input.tier === 'S' ? 85 : input.tier === 'A' ? 68 : 45,
  pressure: input.kind === 'major' ? 100 : input.tier === 'S' ? 82 : input.tier === 'A' ? 63 : 42,
  rankingPoints: input.kind === 'major' ? 500 : input.tier === 'S' ? 320 : input.tier === 'A' ? 180 : 80,
  inviteChance: input.kind === 'qualifier' ? 100 : 45,
  qualification: input.kind === 'major' ? 'Valve Regional Standings / Major path' : input.kind === 'rmr' ? 'Open and closed qualifiers' : 'VRS invitation or qualifier',
  stages: input.kind === 'major' ? ['Stage 1', 'Stage 2', 'Stage 3', 'Playoffs'] : input.format === 'Groups + playoffs' ? ['Groups', 'Playoffs', 'Grand final'] : ['Opening', 'Elimination', 'Grand final'],
  winnerPrize: Math.round(input.prizePool * 0.4), contractImpact: input.tier === 'S' ? 12 : 5,
  reputationImpact: input.kind === 'major' ? 20 : input.tier === 'S' ? 12 : 5,
  mapPool: ACTIVE_MAP_IDS, ...input,
});

const regionalCircuits: { id: string; name: string; region: Region; location: string }[] = [
  { id: 'eu', name: 'European Circuit', region: 'Europe', location: 'Online Europe' },
  { id: 'cis', name: 'Eastern Circuit', region: 'CIS', location: 'Online East' },
  { id: 'sa', name: 'South American Circuit', region: 'South America', location: 'Online South America' },
  { id: 'br', name: 'Brazil Challenger', region: 'Brazil', location: 'São Paulo, Brazil' },
  { id: 'na', name: 'North American Circuit', region: 'North America', location: 'Online North America' },
  { id: 'as', name: 'Asia Challenger', region: 'Asia', location: 'Online Asia' },
  { id: 'oc', name: 'Oceania Challenger', region: 'Oceania', location: 'Online Oceania' },
  { id: 'me', name: 'MENA Circuit', region: 'Middle East', location: 'Online MENA' },
];

// These events model the dense weekly ecosystem below the headline LANs. They
// are original, configurable competitions rather than claims about an official
// annual calendar.
const CIRCUIT_EVENTS: Tournament[] = regionalCircuits.flatMap((circuit, circuitIndex) => [1, 2, 3, 4, 5, 6].map((split) => {
  const month = ((split - 1) * 2 + circuitIndex % 2) % 12 + 1;
  const week = 1 + ((circuitIndex + split) % 4);
  const tier = split % 3 === 0 ? 'A' as const : split % 2 === 0 ? 'B' as const : 'C' as const;
  return make({
    id: `circuit-${circuit.id}-${split}`,
    name: `${circuit.name} · Split ${split}`,
    shortName: `${circuit.id.toUpperCase()} C${split}`,
    kind: split % 2 === 0 ? 'regional' : 'online',
    tier,
    region: circuit.region,
    month,
    week,
    prizePool: tier === 'A' ? 120000 : tier === 'B' ? 60000 : 25000,
    format: split % 3 === 0 ? 'Swiss' : split % 2 === 0 ? 'Groups + playoffs' : 'Double elimination',
    seriesFormat: 'BO3',
    teams: tier === 'A' ? 16 : 24,
    location: circuit.location,
  });
}));

export const TOURNAMENTS: Tournament[] = [
  make({ id: 'iem-krakow', name: 'IEM Kraków', shortName: 'IEM KRA', kind: 'international', tier: 'S', region: 'Europe', month: 1, week: 3, prizePool: 1000000, format: 'Play-in', seriesFormat: 'BO3', teams: 24, location: 'Kraków, Poland' }),
  make({ id: 'blast-bounty-s1', name: 'BLAST Bounty Season 1', shortName: 'Bounty S1', kind: 'international', tier: 'S', region: 'Europe', month: 2, week: 2, prizePool: 500000, format: 'Single elimination', seriesFormat: 'BO3', teams: 32, location: 'Malta' }),
  make({ id: 'esl-pro-league-s23', name: 'ESL Pro League Season 23', shortName: 'EPL S23', kind: 'international', tier: 'S', region: 'International', month: 2, week: 4, prizePool: 750000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 24, location: 'Stockholm, Sweden' }),
  make({ id: 'pgl-cluj', name: 'PGL Cluj-Napoca', shortName: 'PGL CLJ', kind: 'international', tier: 'S', region: 'Europe', month: 3, week: 2, prizePool: 1250000, format: 'Swiss', seriesFormat: 'BO3', teams: 16, location: 'Cluj-Napoca, Romania' }),
  make({ id: 'major-1-open', name: 'Cologne Major Open Qualifier', shortName: 'M1 OPEN', kind: 'qualifier', tier: 'Qualifier', region: 'International', month: 3, week: 4, prizePool: 0, format: 'Double elimination', seriesFormat: 'BO1', teams: 64, location: 'Online' }),
  make({ id: 'major-1-rmr', name: 'Cologne Major Regional Qualifier', shortName: 'M1 RMR', kind: 'rmr', tier: 'A', region: 'International', month: 4, week: 2, prizePool: 150000, format: 'RMR', seriesFormat: 'BO3', teams: 32, location: 'Regional LAN' }),
  make({ id: 'pgl-bucharest', name: 'PGL Bucharest', shortName: 'PGL BUC', kind: 'international', tier: 'S', region: 'Europe', month: 4, week: 3, prizePool: 1250000, format: 'Swiss', seriesFormat: 'BO3', teams: 16, location: 'Bucharest, Romania' }),
  make({ id: 'iem-atlanta', name: 'IEM Atlanta', shortName: 'IEM ATL', kind: 'international', tier: 'S', region: 'North America', month: 5, week: 2, prizePool: 1000000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'Atlanta, USA' }),
  make({ id: 'colonge-major', name: 'IEM Cologne Major', shortName: 'MAJOR I', kind: 'major', tier: 'S', region: 'International', month: 6, week: 1, prizePool: 1250000, format: 'Major stages', seriesFormat: 'BO3', teams: 32, location: 'Cologne, Germany' }),
  make({ id: 'cct-global', name: 'CCT Global Finals', shortName: 'CCT GF', kind: 'international', tier: 'A', region: 'Europe', month: 7, week: 2, prizePool: 500000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'Belgrade, Serbia' }),
  make({ id: 'ewc', name: 'Esports World Cup', shortName: 'EWC', kind: 'international', tier: 'S', region: 'Middle East', month: 8, week: 2, prizePool: 2000000, format: 'Single elimination', seriesFormat: 'BO3', teams: 24, location: 'Riyadh, Saudi Arabia' }),
  make({ id: 'blast-bounty-s2', name: 'BLAST Bounty Season 2', shortName: 'Bounty S2', kind: 'international', tier: 'S', region: 'Europe', month: 8, week: 4, prizePool: 500000, format: 'Single elimination', seriesFormat: 'BO3', teams: 32, location: 'Malta' }),
  make({ id: 'esl-pro-league-s24', name: 'ESL Pro League Season 24', shortName: 'EPL S24', kind: 'international', tier: 'S', region: 'International', month: 9, week: 2, prizePool: 750000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 24, location: 'Stockholm, Sweden' }),
  make({ id: 'thunderpick', name: 'Thunderpick World Championship', shortName: 'TP WC', kind: 'online', tier: 'A', region: 'International', month: 9, week: 4, prizePool: 850000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'Online / Berlin' }),
  make({ id: 'major-2-open', name: 'Singapore Major Open Qualifier', shortName: 'M2 OPEN', kind: 'qualifier', tier: 'Qualifier', region: 'International', month: 10, week: 1, prizePool: 0, format: 'Double elimination', seriesFormat: 'BO1', teams: 64, location: 'Online' }),
  make({ id: 'major-2-rmr', name: 'Singapore Major Regional Qualifier', shortName: 'M2 RMR', kind: 'rmr', tier: 'A', region: 'International', month: 10, week: 3, prizePool: 150000, format: 'RMR', seriesFormat: 'BO3', teams: 32, location: 'Regional LAN' }),
  make({ id: 'betboom-dacha', name: 'BetBoom Dacha', shortName: 'Dacha', kind: 'international', tier: 'S', region: 'CIS', month: 11, week: 1, prizePool: 1000000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'Belgrade, Serbia' }),
  make({ id: 'singapore-major', name: 'PGL Major Singapore', shortName: 'MAJOR II', kind: 'major', tier: 'S', region: 'International', month: 11, week: 4, prizePool: 1250000, format: 'Major stages', seriesFormat: 'BO3', teams: 32, location: 'Singapore' }),
  make({ id: 'blast-world-final', name: 'BLAST World Final', shortName: 'BLAST WF', kind: 'international', tier: 'S', region: 'International', month: 12, week: 3, prizePool: 1000000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 8, location: 'Abu Dhabi, UAE' }),
  make({ id: 'fire-league', name: 'FiReLEAGUE Global', shortName: 'FiRe', kind: 'regional', tier: 'A', region: 'Argentina', month: 3, week: 1, prizePool: 150000, format: 'Double elimination', seriesFormat: 'BO3', teams: 16, location: 'Buenos Aires, Argentina' }),
  make({ id: 'cbc-s1', name: 'CBCS Season 1', shortName: 'CBCS S1', kind: 'regional', tier: 'B', region: 'Brazil', month: 2, week: 1, prizePool: 100000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'São Paulo, Brazil' }),
  make({ id: 'cbc-s2', name: 'CBCS Season 2', shortName: 'CBCS S2', kind: 'regional', tier: 'B', region: 'Brazil', month: 7, week: 4, prizePool: 100000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'São Paulo, Brazil' }),
  make({ id: 'cct-sa-1', name: 'CCT South America Series 1', shortName: 'CCT SA1', kind: 'online', tier: 'B', region: 'South America', month: 1, week: 2, prizePool: 50000, format: 'Swiss', seriesFormat: 'BO3', teams: 24, location: 'Online' }),
  make({ id: 'cct-sa-2', name: 'CCT South America Series 2', shortName: 'CCT SA2', kind: 'online', tier: 'B', region: 'South America', month: 5, week: 4, prizePool: 50000, format: 'Swiss', seriesFormat: 'BO3', teams: 24, location: 'Online' }),
  make({ id: 'esl-challenger', name: 'ESL Challenger', shortName: 'ESL CH', kind: 'international', tier: 'A', region: 'International', month: 7, week: 1, prizePool: 100000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 8, location: 'DreamHack Valencia' }),
  make({ id: 'academy-league', name: 'WePlay Academy League', shortName: 'Academy', kind: 'academy', tier: 'B', region: 'Europe', month: 4, week: 1, prizePool: 100000, format: 'Round robin', seriesFormat: 'BO3', teams: 12, location: 'Kyiv, Ukraine' }),
  make({ id: 'argentina-pro', name: 'Liga Argentina Pro', shortName: 'LAP', kind: 'regional', tier: 'C', region: 'Argentina', month: 1, week: 1, prizePool: 25000, format: 'Round robin', seriesFormat: 'BO3', teams: 12, location: 'Buenos Aires, Argentina' }),
  make({ id: 'na-challenger', name: 'ESL Challenger League NA', shortName: 'ECL NA', kind: 'regional', tier: 'B', region: 'North America', month: 3, week: 3, prizePool: 80000, format: 'Round robin', seriesFormat: 'BO3', teams: 16, location: 'Online' }),
  make({ id: 'asia-champions', name: 'Asian Champions League', shortName: 'ACL', kind: 'regional', tier: 'A', region: 'Asia', month: 5, week: 1, prizePool: 300000, format: 'Groups + playoffs', seriesFormat: 'BO3', teams: 16, location: 'Shanghai, China' }),
  make({ id: 'oce-masters', name: 'Oceania Masters', shortName: 'OCE', kind: 'regional', tier: 'B', region: 'Oceania', month: 4, week: 4, prizePool: 50000, format: 'Double elimination', seriesFormat: 'BO3', teams: 8, location: 'Sydney, Australia' }),
  ...CIRCUIT_EVENTS,
];

export const MAJORS = TOURNAMENTS.filter((tournament) => tournament.kind === 'major');
export const getTournament = (id: string) => TOURNAMENTS.find((tournament) => tournament.id === id) ?? TOURNAMENTS[0];
