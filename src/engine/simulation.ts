import { getMap } from '@/data/maps';
import { getTournament } from '@/data/tournaments';
import { CareerState, MapResult, MatchResult, MatchStats, PlayerRole, Team } from '@/types/game';
import { clamp, overallRating } from './progression';
import { pick, randomInt, rngFor } from './random';

const roleKeys: Record<PlayerRole, (keyof CareerState['player']['attributes'])[]> = {
  Entry: ['aim', 'reaction', 'entryImpact', 'movement'], AWPer: ['awpSkill', 'reaction', 'positioning', 'clutch'], Rifler: ['aim', 'sprayControl', 'tradeEfficiency', 'consistency'], Lurker: ['gameSense', 'readingOpponents', 'positioning', 'clutch'], Support: ['utilityUsage', 'flashAssists', 'communication', 'teamChemistry'], IGL: ['leadership', 'communication', 'gameSense', 'readingOpponents'], Hybrid: ['adaptability', 'aim', 'awpSkill', 'gameSense'], Anchor: ['positioning', 'mentalStrength', 'utilityUsage', 'clutch'],
};

function round2(value: number) { return Math.round(value * 100) / 100; }

export function playerPerformanceScore(state: CareerState, mapId: string, opponent: Team, pressure: number) {
  const attributes = state.player.attributes;
  const role = state.player.identity.role;
  const roleScore = roleKeys[role].reduce((sum, key) => sum + attributes[key], 0) / roleKeys[role].length;
  const map = getMap(mapId);
  const mapModifier = map.modifiers[role] ?? 0;
  const condition = state.player.form * 0.13 + attributes.confidence * 0.11 + attributes.consistency * 0.11 + state.chemistry * 0.08 + attributes.mentalStrength * (pressure / 100) * 0.08;
  const penalties = state.player.fatigue * 0.13 + state.player.burnout * 0.08 + state.player.pressure * 0.04 + state.player.injuredWeeks * 8;
  const minigameModifier = typeof state.flags.lastMinigameModifier === 'number' ? clamp(state.flags.lastMinigameModifier, -0.06, 0.06) * 100 : 0;
  return clamp(roleScore * 0.48 + overallRating(attributes) * 0.18 + condition + mapModifier - opponent.globalLevel * 0.11 - penalties + minigameModifier + 11, 20, 98);
}

function generateStats(state: CareerState, mapId: string, opponent: Team, rounds: number, random: () => number, pressure: number): MatchStats {
  const score = playerPerformanceScore(state, mapId, opponent, pressure) + (random() - 0.5) * 18;
  const role = state.player.identity.role;
  const kills = Math.max(4, Math.round(rounds * (0.46 + score / 240)));
  const deaths = Math.max(4, Math.round(rounds * (0.78 - score / 390 + random() * 0.08)));
  const assists = Math.round(rounds * (0.12 + state.player.attributes.communication / 620 + (role === 'Support' ? 0.07 : 0)));
  const adr = round2(clamp(45 + score * 0.47 + (random() - 0.5) * 12, 38, 125));
  const kast = round2(clamp(52 + score * 0.27 + random() * 9, 45, 92));
  const rating = round2(clamp(0.48 + kills / Math.max(1, deaths) * 0.38 + adr / 230 + kast / 600, 0.35, 2.1));
  const openingAttempts = Math.max(1, Math.round(rounds * (role === 'Entry' ? 0.3 : 0.15)));
  const openingKills = Math.min(kills, Math.round(openingAttempts * clamp(score / 100, 0.25, 0.78)));
  const openingDeaths = Math.max(0, openingAttempts - openingKills);
  const clutchChance = state.player.attributes.clutch / 500;
  const clutches = random() < clutchChance ? 1 + (random() > 0.88 ? 1 : 0) : 0;
  const headshotPercentage = round2(clamp(25 + state.player.attributes.aim * 0.43 + (random() - 0.5) * 15 - (role === 'AWPer' ? 18 : 0), 12, 82));
  return { kills, deaths, assists, kd: round2(kills / Math.max(1, deaths)), adr, kast, rating, openingKills, openingDeaths, firstKillPercentage: round2(openingKills / openingAttempts * 100), clutches, clutch1v1: clutches > 0 ? 1 : 0, clutch1v2: clutches > 1 ? 1 : 0, clutch1v3: random() > 0.96 ? 1 : 0, clutch1v4: random() > 0.992 ? 1 : 0, clutch1v5: random() > 0.999 ? 1 : 0, headshotPercentage, damage: Math.round(adr * rounds), flashAssists: Math.round(assists * (role === 'Support' ? 0.65 : 0.35)), utilityDamage: Math.round(rounds * state.player.attributes.utilityUsage * 0.14), tradeKills: Math.round(kills * state.player.attributes.tradeEfficiency / 170), entrySuccess: round2(openingKills / Math.max(1, openingAttempts) * 100), multiKills: Math.round(kills * 0.22), ecoKills: Math.round(kills * 0.15), antiEcoPerformance: round2(clamp(rating + (random() - 0.5) * 0.2, 0.4, 2)), ctRating: round2(clamp(rating + getMap(mapId).ctBias / 100, 0.35, 2.2)), tRating: round2(clamp(rating + getMap(mapId).tBias / 100, 0.35, 2.2)), overtimeRating: round2(clamp(rating + (state.player.attributes.mentalStrength - 50) / 180, 0.35, 2.2)), pistolRating: round2(clamp(rating + (state.player.attributes.pistolSkill - 50) / 180, 0.35, 2.2)), pressureRating: round2(clamp(rating + (state.player.attributes.mentalStrength - pressure) / 220, 0.35, 2.2)) };
}

function aggregateStats(maps: MapResult[]): MatchStats {
  const stats = maps.map((map) => map.playerStats);
  const sum = (key: keyof MatchStats) => stats.reduce((total, item) => total + Number(item[key]), 0);
  const avg = (key: keyof MatchStats) => round2(sum(key) / stats.length);
  return { kills: sum('kills'), deaths: sum('deaths'), assists: sum('assists'), kd: round2(sum('kills') / Math.max(1, sum('deaths'))), adr: avg('adr'), kast: avg('kast'), rating: avg('rating'), openingKills: sum('openingKills'), openingDeaths: sum('openingDeaths'), firstKillPercentage: avg('firstKillPercentage'), clutches: sum('clutches'), clutch1v1: sum('clutch1v1'), clutch1v2: sum('clutch1v2'), clutch1v3: sum('clutch1v3'), clutch1v4: sum('clutch1v4'), clutch1v5: sum('clutch1v5'), headshotPercentage: avg('headshotPercentage'), damage: sum('damage'), flashAssists: sum('flashAssists'), utilityDamage: sum('utilityDamage'), tradeKills: sum('tradeKills'), entrySuccess: avg('entrySuccess'), multiKills: sum('multiKills'), ecoKills: sum('ecoKills'), antiEcoPerformance: avg('antiEcoPerformance'), ctRating: avg('ctRating'), tRating: avg('tRating'), overtimeRating: avg('overtimeRating'), pistolRating: avg('pistolRating'), pressureRating: avg('pressureRating') };
}

export function simulateMatch(state: CareerState, playerTeam: Team, opponent: Team, tournamentId: string, mapIds?: string[], formatOverride?: 'BO1' | 'BO3' | 'BO5'): MatchResult {
  const baseTournament = getTournament(tournamentId);
  const tournament = { ...baseTournament, seriesFormat: formatOverride ?? baseTournament.seriesFormat };
  const random = rngFor(state.id, state.season, state.month, state.week, opponent.id, state.matches.length);
  const maxMaps = tournament.seriesFormat === 'BO1' ? 1 : tournament.seriesFormat === 'BO5' ? 5 : 3;
  const requiredWins = Math.ceil(maxMaps / 2);
  const pool = mapIds?.length ? mapIds : tournament.mapPool;
  const maps: MapResult[] = [];
  let teamWins = 0; let opponentWins = 0;
  for (let index = 0; index < maxMaps && teamWins < requiredWins && opponentWins < requiredWins; index += 1) {
    const mapId = pool[index % pool.length];
    const performance = playerPerformanceScore(state, mapId, opponent, tournament.pressure);
    const teamPower = playerTeam.globalLevel * 0.65 + state.chemistry * 0.16 + performance * 0.19;
    const opponentPower = opponent.globalLevel * 0.82 + opponent.chemistry * 0.18;
    const winProbability = clamp(50 + (teamPower - opponentPower) * 1.5, 12, 88) / 100;
    const won = random() < winProbability;
    const overtime = Math.abs(teamPower - opponentPower) < 5 && random() > 0.65;
    const winnerScore = overtime ? 16 + randomInt(random, 0, 4) : 13;
    const loserScore = overtime ? winnerScore - 2 : randomInt(random, 4, 11);
    const teamScore = won ? winnerScore : loserScore; const opponentScore = won ? loserScore : winnerScore;
    if (won) teamWins += 1; else opponentWins += 1;
    maps.push({ mapId, teamScore, opponentScore, overtime, playerStats: generateStats(state, mapId, opponent, teamScore + opponentScore, random, tournament.pressure) });
  }
  const aggregate = aggregateStats(maps);
  const won = teamWins > opponentWins;
  const injuryChance = clamp((state.player.fatigue + state.player.injuryRisk + state.player.burnout * 0.45) / 650, 0.01, 0.28);
  const injuryOccurred = random() < injuryChance;
  const highlights = [`${aggregate.kills} kills y ${aggregate.adr} ADR en la serie`, aggregate.clutches ? `${aggregate.clutches} clutch${aggregate.clutches > 1 ? 'es' : ''} convertido${aggregate.clutches > 1 ? 's' : ''}` : 'Partida sin clutches convertidos', pick(random, ['Una apertura cambió el mapa decisivo', 'La utility del equipo definió las rondas largas', 'El rival castigó las compras débiles', 'El lado CT sostuvo la serie'])];
  return { id: `match-${state.season}-${state.month}-${state.week}-${state.matches.length + 1}`, season: state.season, month: state.month, week: state.week, tournamentId, opponentTeamId: opponent.id, format: tournament.seriesFormat, won, seriesScore: `${teamWins}-${opponentWins}`, maps, aggregate, highlights, explanation: [`Nivel propio ${overallRating(state.player.attributes)}`, `Forma ${state.player.form} / Fatiga ${state.player.fatigue}`, `Química ${state.chemistry}`, `Rival #${opponent.initialRanking} (${opponent.globalLevel})`, `Presión del evento ${tournament.pressure}`], fatigueChange: 7 + maps.length * 3, confidenceChange: won ? 5 : -4, injuryOccurred };
}
