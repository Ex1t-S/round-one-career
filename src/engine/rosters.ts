import { CareerState, Team } from '@/types/game';
import { getTeam, TEAMS } from '@/data/teams';
import { overallRating } from './progression';
import { cloneSerializable } from '@/utils/clone';

export function transferOffers(state: CareerState): Team[] {
  const rating = overallRating(state.player.attributes);
  const current = getTeam(state.teamId);
  const targetRank = Math.max(1, current.initialRanking - Math.round((rating - 50) * 1.8 + state.player.reputation / 5));
  return TEAMS.filter((team) => team.id !== current.id && Math.abs(team.initialRanking - targetRank) <= 14 && team.budget > state.player.marketValue * 0.6).slice(0, 6);
}

export function roleFit(state: CareerState, team: Team) {
  const duplicate = team.roster.some((player) => player.toLowerCase().includes(state.player.identity.role.toLowerCase()));
  return Math.max(25, Math.min(95, team.chemistry + team.coachQuality / 5 - (duplicate ? 12 : 0)));
}

export function simulateRosterWindow(state: CareerState) {
  const team = getTeam(state.teamId);
  const risk = team.rosterRisk + (state.chemistry < 45 ? 20 : 0) + (state.player.benched ? 15 : 0);
  if (risk < 60) return { state, message: 'El roster mantiene su estructura para la próxima etapa.' };
  const next = cloneSerializable(state);
  next.chemistry = Math.max(25, next.chemistry - 8);
  next.news.unshift(`${team.name} prepara cambios después de una ventana de resultados irregulares.`);
  return { state: next, message: 'Rumores de cambios: la estabilidad del roster bajó.' };
}
