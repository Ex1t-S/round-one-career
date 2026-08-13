import { PRO_PLAYER_POOL, ProPlayerProfile } from '@/data/pro-players';
import { getTeam } from '@/data/teams';
import { CareerState, PlayerRankingEntry, PlayerRankingSeason, PlayerRole } from '@/types/game';
import { overallRating } from './progression';
import { rngFor } from './random';

function ageModifier(age: number, potential: number) {
  if (age <= 20) return (potential - 50) / 15;
  if (age <= 24) return 2 + (potential - 50) / 24;
  if (age <= 28) return 2.5;
  if (age <= 30) return 1 - (age - 28) * 1.2;
  return -2 - (age - 30) * 2.4;
}

function trendFor(rank: number, previousRank?: number): PlayerRankingEntry['trend'] {
  if (!previousRank) return 'new';
  if (rank < previousRank) return 'up';
  if (rank > previousRank) return 'down';
  return 'same';
}

function scorePro(profile: ProPlayerProfile, state: CareerState) {
  const age = profile.age + state.season - 1;
  const random = rngFor(state.careerSeed, 'annual-top-100', state.season, profile.id);
  const formNoise = (random() + random() + random() - 1.5) * Math.min(12, 6 + state.season * .5);
  const breakout = age <= 27 && random() < Math.min(.1, .035 + state.season * .006) ? 5 + random() * 9 : 0;
  const slump = random() < .08 ? 4 + random() * 8 : 0;
  const team = getTeam(profile.teamId);
  const teamScore = Math.max(-3, 7 - team.initialRanking * .08);
  const score = profile.baseScore + ageModifier(age, profile.potential) + teamScore + formNoise + breakout - slump;
  const story = breakout >= 5 ? 'Irrupción del año' : slump >= 4 ? 'Año irregular' : formNoise >= 5 ? 'Pico de forma' : profile.seedRank && profile.seedRank <= 20 ? 'Consistencia de élite' : 'Impacto sostenido';
  return { score, age, story };
}

function scoreUser(state: CareerState) {
  const matches = state.matches.filter((item) => item.season === state.season);
  const rating = matches.reduce((sum, item) => sum + item.aggregate.rating, 0) / Math.max(1, matches.length);
  const maps = matches.reduce((sum, item) => sum + item.maps.length, 0);
  const winRate = matches.filter((item) => item.won).length / Math.max(1, matches.length);
  const majors = state.majorCampaigns.filter((item) => item.season === state.season && item.bracket?.championId === state.teamId).length;
  const trophies = state.trophies.filter((item) => item.season === state.season).length;
  const samplePenalty = maps < 25 ? (25 - maps) * .5 : 0;
  const score = 48 + (rating - .85) * 92 + winRate * 9 + Math.min(8, maps / 12) + majors * 9 + trophies * 2 + state.player.reputation * .07 + overallRating(state.player.attributes) * .05 - samplePenalty;
  const story = majors ? 'Campeón de Major' : rating >= 1.22 ? 'Temporada superestrella' : rating >= 1.12 ? 'Ascenso internacional' : trophies ? 'Ganador de torneos' : 'En consolidación';
  return { score, rating, story };
}

export function generateAnnualPlayerRanking(state: CareerState): PlayerRankingSeason {
  const previous = state.playerRankingHistory[state.playerRankingHistory.length - 1];
  const previousRanks = new Map(previous?.entries.map((entry) => [entry.playerId, entry.rank]) ?? []);
  const candidates: Omit<PlayerRankingEntry, 'rank' | 'trend' | 'previousRank'>[] = PRO_PLAYER_POOL.map((profile) => {
    const result = scorePro(profile, state);
    return {
      playerId: profile.id, nickname: profile.nickname, teamId: profile.teamId, rating: Number(Math.max(.91, Math.min(1.48, .65 + result.score * .0068)).toFixed(2)),
      score: Number(result.score.toFixed(2)), age: result.age, role: profile.role, story: result.story, isUser: false,
    };
  });
  const user = scoreUser(state);
  candidates.push({ playerId: `career-${state.id}`, nickname: state.player.identity.nickname, teamId: state.teamId, rating: Number(user.rating.toFixed(2)), score: Number(user.score.toFixed(2)), age: state.player.identity.age, role: state.player.identity.role as PlayerRole, story: user.story, isUser: true });
  const entries = candidates.sort((a, b) => b.score - a.score).slice(0, 100).map((entry, index) => {
    const rank = index + 1; const previousRank = previousRanks.get(entry.playerId);
    return { ...entry, rank, previousRank, trend: trendFor(rank, previousRank) };
  });
  return { season: state.season, year: state.year, generatedAt: new Date().toISOString(), entries };
}

export function projectedPlayerRanking(state: CareerState) {
  const latest = state.playerRankingHistory[state.playerRankingHistory.length - 1];
  if (latest?.season === state.season) return latest;
  return generateAnnualPlayerRanking(state);
}
