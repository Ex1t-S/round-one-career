import { CareerOffer, CareerState, PlayerIdentity, SquadRole, Team } from '@/types/game';
import { getTeam, LOW_TIER_TEAMS, TEAMS } from '@/data/teams';
import { overallRating } from './progression';
import { cloneSerializable } from '@/utils/clone';
import { hashString, rngFor } from './random';

export function initialTeamOffers(identity: PlayerIdentity): Team[] {
  const regional = LOW_TIER_TEAMS.filter((team) => team.region === identity.region || identity.region === 'Argentina' && ['Argentina', 'South America'].includes(team.region));
  const pool = regional.length >= 6 ? regional : LOW_TIER_TEAMS;
  const random = rngFor(hashString(`${identity.nickname}|${identity.role}|${identity.priority}`), 'first-contract');
  const bands = [pool.filter((team) => team.initialRanking >= 80 && team.initialRanking <= 120), pool.filter((team) => team.initialRanking > 120 && team.initialRanking <= 165), pool.filter((team) => team.initialRanking > 165)];
  const chosen: Team[] = [];
  for (const band of bands) {
    const available = band.filter((team) => !chosen.some((item) => item.id === team.id));
    if (available.length) chosen.push(available[Math.floor(random() * available.length)]);
  }
  return chosen.length === 3 ? chosen : LOW_TIER_TEAMS.slice(0, 3);
}

export function transferOffers(state: CareerState): Team[] {
  if (state.offers.length) return state.offers.filter((offer) => offer.expiresAfterSeason >= state.season).map((offer) => getTeam(offer.teamId));
  const rating = overallRating(state.player.attributes);
  const current = getTeam(state.teamId);
  const targetRank = Math.max(1, current.initialRanking - Math.round((rating - 50) * 1.8 + state.player.reputation / 5));
  return TEAMS.filter((team) => team.id !== current.id && Math.abs(team.initialRanking - targetRank) <= 14 && team.budget > state.player.marketValue * 0.6).slice(0, 6);
}

export function roleFit(state: CareerState, team: Team) {
  const duplicate = team.roster.some((player) => player.toLowerCase().includes(state.player.identity.role.toLowerCase()));
  return Math.max(25, Math.min(95, team.chemistry + team.coachQuality / 5 - (duplicate ? 12 : 0)));
}

function roleForOffer(state: CareerState, team: Team): SquadRole {
  const recent = state.matches.filter((match) => match.season === state.season).slice(-12);
  const rating = recent.reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, recent.length);
  const gap = overallRating(state.player.attributes) - team.globalLevel;
  if (gap >= 7 || rating >= 1.18) return 'star';
  if (gap >= 1 || rating >= 1.05) return 'starter';
  if (gap >= -5 || rating >= .93) return 'rotation';
  return 'prospect';
}

export function generateCareerOffers(state: CareerState): CareerOffer[] {
  const current = getTeam(state.teamId);
  const recent = state.matches.filter((match) => match.season === state.season).slice(-18);
  const rating = recent.reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, recent.length);
  const performanceLift = Math.round((rating - 1) * 75 + (state.player.reputation - 20) * .25 + (state.squad.role === 'star' ? 8 : 0));
  const targetRank = Math.max(1, current.initialRanking - performanceLift);
  const preference = state.flags.transferPreference;
  const candidates = TEAMS.filter((team) => team.id !== current.id && team.budget > state.player.marketValue * .35 && Math.abs(team.initialRanking - targetRank) <= (preference === 'project' ? 40 : 24))
    .sort((a, b) => Math.abs(a.initialRanking - targetRank) - Math.abs(b.initialRanking - targetRank));
  const random = rngFor(state.careerSeed, state.season, 'offers', state.decisions.length);
  return candidates.slice(0, 12).sort(() => random() - .5).slice(0, 5).map((team, index) => {
    const squadRole = roleForOffer(state, team);
    const fit = roleFit(state, team);
    return {
      id: `offer-${state.season}-${team.id}`, teamId: team.id, season: state.season,
      monthlySalary: Math.round(team.averageSalary * (.68 + Math.max(0, rating - .9) * .5)), durationMonths: 12 + (index % 3) * 6,
      squadRole, fit, interest: Math.max(35, Math.min(96, fit + Math.round((rating - 1) * 30))),
      rationale: squadRole === 'star' ? 'El proyecto ofrece recursos y protagonismo.' : squadRole === 'starter' ? 'Entrarías en el quinteto inicial.' : squadRole === 'rotation' ? 'Competirías por mapas desde el primer bloque.' : 'El club te ve como desarrollo a medio plazo.',
      expiresAfterSeason: state.season + 1,
    };
  });
}

export function evaluateSquadState(state: CareerState) {
  const next = cloneSerializable(state);
  const recent = next.matches.filter((match) => match.season === next.season).slice(-10);
  if (!recent.length) return next;
  const rating = recent.reduce((sum, match) => sum + match.aggregate.rating, 0) / recent.length;
  const wins = recent.filter((match) => match.won).length;
  const signal = (rating - 1) * 42 + (wins / recent.length - .5) * 16 + (next.coachRelationship - 50) * .18 + (next.player.attributes.consistency - 50) * .08;
  const noise = (rngFor(next.careerSeed, next.season, next.matches.length, 'squad')() - .5) * 10;
  next.squad.coachTrust = Math.max(0, Math.min(100, next.squad.coachTrust + Math.round(signal * .22 + noise)));
  next.squad.roleSecurity = Math.max(0, Math.min(100, next.squad.roleSecurity + Math.round(signal * .3 + noise)));
  const prior = next.squad.role;
  const score = next.squad.roleSecurity + next.squad.coachTrust * .35 + Math.max(-12, Math.min(18, signal));
  next.squad.role = score >= 120 ? rating >= 1.18 ? 'star' : 'starter' : score >= 88 ? 'rotation' : score >= 62 ? 'prospect' : 'benched';
  next.squad.mapShare = next.squad.role === 'star' || next.squad.role === 'starter' ? 100 : next.squad.role === 'rotation' ? 72 : next.squad.role === 'prospect' ? 48 : 18;
  next.player.benched = next.squad.role === 'benched';
  if (prior !== next.squad.role) {
    next.squad.lastChangeReason = rating >= 1.12 ? `El rating ${rating.toFixed(2)} y la confianza del staff elevaron tu lugar.` : `El rating ${rating.toFixed(2)} y la competencia interna cambiaron tu lugar.`;
    next.news.unshift(`Jerarquía del roster: ${next.player.identity.nickname} pasa de ${prior} a ${next.squad.role}.`);
  }
  return next;
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
