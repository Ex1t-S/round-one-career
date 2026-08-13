import { CareerState, RankingEntry, Team } from '@/types/game';

export function createInitialRankings(teams: Team[]): RankingEntry[] {
  return teams.map((team) => ({ teamId: team.id, rank: team.initialRanking, points: team.vrsPoints, trend: 0 }));
}

export function updateRankings(rankings: RankingEntry[], playerTeamId: string, won: boolean, opponentRank: number, tournamentPoints = 0): RankingEntry[] {
  const next = rankings.map((entry) => ({ ...entry, trend: 0 }));
  const playerTeam = next.find((entry) => entry.teamId === playerTeamId);
  if (playerTeam) playerTeam.points += (won ? Math.max(16, 120 - opponentRank) : -Math.max(5, 28 - Math.floor(opponentRank / 5))) + tournamentPoints;
  next.sort((a, b) => b.points - a.points);
  return next.map((entry, index) => ({ ...entry, trend: entry.rank - (index + 1), rank: index + 1 }));
}

export function playerWorldRank(state: CareerState) {
  const latest = state.playerRankingHistory?.[state.playerRankingHistory.length - 1];
  const annual = latest?.entries.find((entry) => entry.isUser)?.rank;
  if (annual) return annual;
  const recent = state.matches.slice(-16);
  const rating = recent.reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, recent.length);
  const score = rating * 820 + state.trophies.length * 90 + state.player.reputation * 4 + state.awards.length * 120;
  return Math.max(1, Math.min(500, Math.round(510 - score / 3.4)));
}
