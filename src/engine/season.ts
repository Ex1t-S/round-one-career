import { CAREER_EVENTS, getCareerEvent } from '@/data/events';
import { TEAMS, getTeam } from '@/data/teams';
import { TOURNAMENTS, getTournament } from '@/data/tournaments';
import { CalendarEvent, CareerState, DecisionChoice, PlayerIdentity, SeasonAdvanceResult, Team } from '@/types/game';
import { createContract, monthlyFinances } from './contracts';
import { clamp, calculateMarketValue, processLevelUps } from './progression';
import { updateRankings } from './ranking';
import { pick, rngFor, weightedPick } from './random';
import { simulateMatch } from './simulation';
import { buildInitialAttributes } from '@/data/roles';
import { cloneSerializable } from '@/utils/clone';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function buildSeasonCalendar(season: number): CalendarEvent[] {
  const base: CalendarEvent[] = [
    { id: `s${season}-preseason`, season, month: 1, week: 1, title: 'Pretemporada', kind: 'preseason', status: 'upcoming', description: 'Objetivos, pruebas físicas y definición de roles.' },
    { id: `s${season}-market-1`, season, month: 1, week: 2, title: 'Mercado de fichajes', kind: 'market', status: 'upcoming', description: 'Rumores, renovaciones y cambios de roster.' },
    { id: `s${season}-bootcamp-1`, season, month: 5, week: 4, title: 'Bootcamp de Major I', kind: 'bootcamp', status: 'upcoming', description: 'Preparación intensiva del map pool.' },
    { id: `s${season}-break`, season, month: 7, week: 3, title: 'Player break', kind: 'vacation', status: 'upcoming', description: 'Descanso obligatorio y recuperación mental.' },
    { id: `s${season}-market-2`, season, month: 7, week: 4, title: 'Mercado de mitad de año', kind: 'market', status: 'upcoming', description: 'La temporada reordena proyectos y roles.' },
    { id: `s${season}-bootcamp-2`, season, month: 11, week: 3, title: 'Bootcamp de Major II', kind: 'bootcamp', status: 'upcoming', description: 'Último ajuste antes del evento más importante.' },
    { id: `s${season}-awards`, season, month: 12, week: 4, title: 'Premios y ranking final', kind: 'awards', status: 'upcoming', description: 'Cierre anual, reconocimientos y renovaciones.' },
  ];
  for (const tournament of TOURNAMENTS) {
    base.push({ id: `s${season}-${tournament.id}`, season, month: tournament.month, week: tournament.week, title: tournament.name, kind: tournament.kind === 'major' ? 'major' : tournament.kind === 'rmr' ? 'rmr' : tournament.kind === 'qualifier' ? 'qualifier' : 'tournament', status: 'upcoming', tournamentId: tournament.id, description: `${tournament.location} · ${tournament.seriesFormat} · $${tournament.prizePool.toLocaleString('en-US')}` });
  }
  for (let month = 1; month <= 12; month += 1) for (const week of [1, 3]) base.push({ id: `s${season}-scrim-${month}-${week}`, season, month, week, title: `Bloque de scrims · ${monthNames[month - 1]}`, kind: 'scrim', status: 'upcoming', description: 'Práctica contra rivales del circuito y revisión de demos.' });
  return base.sort((a, b) => a.month * 10 + a.week - (b.month * 10 + b.week));
}

export function createCareer(identity: PlayerIdentity, team: Team, year = 2026): CareerState {
  const now = new Date().toISOString();
  const attributes = buildInitialAttributes(identity.role, identity.style, identity.age);
  const player = { identity, attributes, level: 1, xp: 0, trainingPoints: 5, form: 55, fatigue: 10, burnout: 4, injuryRisk: 5, motivation: 78, pressure: 20, reputation: 8, fanbase: 3, marketValue: 25000, money: 1800, path: 'player' as const, benched: false, injuredWeeks: 0 };
  const rankings = TEAMS.map((item) => ({ teamId: item.id, rank: item.initialRanking, points: item.vrsPoints, trend: 0 }));
  const state: CareerState = { schemaVersion: 1, id: `career-${Date.now()}`, createdAt: now, updatedAt: now, player, teamId: team.id, season: 1, year, month: 1, week: 1, calendar: buildSeasonCalendar(1), contract: createContract(team, identity.role, 52), matches: [], decisions: [], trophies: [], rankings, flags: {}, chemistry: 58, coachRelationship: 55, iglRelationship: 52, rivalries: {}, news: [`${identity.nickname} firma su primer contrato profesional con ${team.name}.`], socialFeed: [`@roundone: ${identity.nickname} comienza su camino desde ${identity.city}.`], awards: [], finished: false, settings: { simulationSpeed: 'balanced', minigames: true, reducedMotion: false, autosave: true } };
  state.player.marketValue = calculateMarketValue(state);
  return state;
}

function selectDecision(state: CareerState) {
  const random = rngFor(state.id, 'decision', state.season, state.month, state.week, state.decisions.length);
  const used = new Set(state.decisions.slice(-16).map((record) => record.eventId));
  const candidates = CAREER_EVENTS.filter((event) => (event.minSeason ?? 1) <= state.season && !used.has(event.id));
  return weightedPick(random, candidates.length ? candidates : CAREER_EVENTS, (event) => event.weight);
}

function eligibleTournaments(state: CareerState, team: Team) {
  return TOURNAMENTS.filter((tournament) => tournament.month === state.month && tournament.week === state.week && (tournament.region === 'International' || tournament.region === team.region || tournament.region === 'South America' && ['Argentina', 'Brazil', 'South America'].includes(team.region) || tournament.kind === 'qualifier'));
}

function chooseOpponent(state: CareerState, team: Team, tournamentId: string) {
  const random = rngFor(state.id, tournamentId, state.season, state.month, state.week);
  const rank = state.rankings.find((entry) => entry.teamId === team.id)?.rank ?? team.initialRanking;
  const candidates = TEAMS.filter((candidate) => candidate.id !== team.id && Math.abs(candidate.initialRanking - rank) < (getTournament(tournamentId).tier === 'S' ? 35 : 18));
  return pick(random, candidates.length ? candidates : TEAMS.filter((candidate) => candidate.id !== team.id));
}

function closeYear(state: CareerState) {
  const next = cloneSerializable(state);
  const average = next.matches.filter((match) => match.season === next.season).reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, next.matches.filter((match) => match.season === next.season).length);
  if (next.season === 1) next.awards.push('Rookie de la temporada');
  if (average >= 1.2) next.awards.push(`Top performer · Temporada ${next.season}`);
  if (next.player.identity.role === 'IGL' && next.chemistry >= 78) next.awards.push(`IGL del año · Temporada ${next.season}`);
  if (next.player.identity.role === 'AWPer' && average >= 1.15) next.awards.push(`AWPer del año · Temporada ${next.season}`);
  next.news.unshift(`${next.player.identity.nickname} cierra la temporada ${next.season} con ${average.toFixed(2)} de rating.`);
  next.player.identity.age += 1;
  if (next.player.identity.age >= 34 || next.season >= 12 || next.player.burnout >= 98) {
    next.finished = true;
    next.player.path = next.player.attributes.leadership > 75 ? 'coach' : next.player.attributes.mediaSkill > 72 ? 'creator' : next.player.attributes.gameSense > 76 ? 'analyst' : 'retired';
    next.ending = next.trophies.some((trophy) => trophy.name.includes('Major')) ? 'Leyenda de los Majors' : next.player.path === 'coach' ? 'El líder continúa desde el banco' : next.player.path === 'creator' ? 'Del servidor a la comunidad' : next.player.reputation > 75 ? 'Ícono del circuito' : 'Una carrera de sacrificio';
    return next;
  }
  next.season += 1; next.year += 1; next.month = 1; next.week = 1; next.calendar = buildSeasonCalendar(next.season);
  next.player.fatigue = clamp(next.player.fatigue - 35); next.player.burnout = clamp(next.player.burnout - 25); next.player.trainingPoints += 4;
  return next;
}

export function advanceWeek(state: CareerState): SeasonAdvanceResult {
  if (state.finished || state.pendingDecisionId || state.pendingMatchId) return { state, messages: ['Hay una acción pendiente antes de avanzar.'], requiresDecision: Boolean(state.pendingDecisionId), requiresMatch: Boolean(state.pendingMatchId) };
  let next = cloneSerializable(state);
  const messages: string[] = [];
  const team = getTeam(next.teamId);
  next.calendar = next.calendar.map((event) => event.month === next.month && event.week === next.week ? { ...event, status: 'active' } : event);
  const scheduled = eligibleTournaments(next, team);
  const tournament = scheduled.sort((a, b) => b.prestige - a.prestige)[0];
  const teamRank = next.rankings.find((entry) => entry.teamId === team.id)?.rank ?? 100;
  const canEnter = tournament && (tournament.kind === 'qualifier' || tournament.kind === 'regional' || teamRank <= Math.max(tournament.teams * 2, 16));
  if (tournament && canEnter && next.player.injuredWeeks === 0 && !next.player.benched) {
    const opponent = chooseOpponent(next, team, tournament.id);
    next.pendingMatchId = `${tournament.id}|${opponent.id}`;
    messages.push(`Próximo partido: ${team.name} vs ${opponent.name} en ${tournament.name}.`);
  } else if ((next.week + next.month + next.season) % 3 === 0) {
    const decision = selectDecision(next);
    next.pendingDecisionId = decision.id;
    messages.push(`Nueva decisión: ${decision.title}`);
  } else {
    next.player.fatigue = clamp(next.player.fatigue - 5);
    next.player.trainingPoints += 1;
    next.player.xp += 35;
    messages.push('Semana de scrims completada: +1 punto de entrenamiento.');
  }
  if (next.player.injuredWeeks > 0) next.player.injuredWeeks -= 1;
  const finances = monthlyFinances(next.contract, next.player.money, 700 + Math.round(next.player.fanbase * 3));
  if (next.week === 4) { next.player.money = finances.balance; next.contract.monthsRemaining = Math.max(0, next.contract.monthsRemaining - 1); }
  next.calendar = next.calendar.map((event) => event.month === next.month && event.week === next.week && event.status === 'active' ? { ...event, status: 'completed' } : event);
  next.week += 1;
  if (next.week > 4) { next.week = 1; next.month += 1; }
  if (next.month > 12) next = closeYear(next);
  next.player.form = clamp(next.player.form + (next.player.motivation - 50) / 20 - next.player.fatigue / 40);
  next.player.injuryRisk = clamp(next.player.fatigue * 0.45 + next.player.burnout * 0.35);
  next.player.marketValue = calculateMarketValue(next);
  next.updatedAt = new Date().toISOString();
  next = processLevelUps(next);
  return { state: next, messages, requiresDecision: Boolean(next.pendingDecisionId), requiresMatch: Boolean(next.pendingMatchId) };
}

export function resolvePendingMatch(state: CareerState): { state: CareerState; message: string } {
  if (!state.pendingMatchId) return { state, message: 'No hay partido pendiente.' };
  const [tournamentId, opponentId] = state.pendingMatchId.split('|');
  const team = getTeam(state.teamId); const opponent = getTeam(opponentId); const tournament = getTournament(tournamentId);
  const result = simulateMatch(state, team, opponent, tournamentId);
  const next = cloneSerializable(state);
  next.matches.push(result); next.pendingMatchId = undefined;
  next.player.fatigue = clamp(next.player.fatigue + result.fatigueChange); next.player.attributes.confidence = clamp(next.player.attributes.confidence + result.confidenceChange, 1, 100); next.player.form = clamp(next.player.form + (result.won ? 4 : -3));
  next.player.xp += 120 + result.aggregate.kills * 3 + (result.won ? 140 : 30); next.player.reputation = clamp(next.player.reputation + (result.won ? 3 : -1)); next.player.fanbase = clamp(next.player.fanbase + (result.won ? 2 : 0));
  if (result.injuryOccurred) { next.player.injuredWeeks = 1 + Math.floor(next.player.injuryRisk / 30); next.news.unshift(`${next.player.identity.nickname} sufre una molestia y estará ${next.player.injuredWeeks} semana(s) fuera.`); }
  if (result.won && tournament.kind === 'major' && result.aggregate.rating > 1.1) { next.trophies.push({ id: `trophy-${Date.now()}`, name: tournament.name, season: next.season, tier: tournament.tier, mvp: result.aggregate.rating >= 1.35 }); if (result.aggregate.rating >= 1.35) next.awards.push(`MVP · ${tournament.name}`); }
  next.rankings = updateRankings(next.rankings, team.id, result.won, opponent.initialRanking, result.won ? Math.round(tournament.rankingPoints / 10) : 0);
  next.news.unshift(`${team.name} ${result.won ? 'vence' : 'cae'} ${result.seriesScore} ante ${opponent.name} en ${tournament.shortName}.`);
  next.socialFeed.unshift(`@roundone: ${next.player.identity.nickname} firma ${result.aggregate.rating.toFixed(2)} de rating vs ${opponent.name}.`);
  next.player.marketValue = calculateMarketValue(next); next.updatedAt = new Date().toISOString();
  return { state: processLevelUps(next), message: `${result.won ? 'Victoria' : 'Derrota'} ${result.seriesScore}. Rating ${result.aggregate.rating.toFixed(2)}.` };
}

export function applyDecision(state: CareerState, choice: DecisionChoice): { state: CareerState; message: string } {
  const event = getCareerEvent(state.pendingDecisionId);
  if (!event) return { state, message: 'No hay decisión pendiente.' };
  const next = cloneSerializable(state); const effects = choice.effects;
  for (const [key, value] of Object.entries(effects.attributes ?? {})) next.player.attributes[key as keyof typeof next.player.attributes] = clamp(next.player.attributes[key as keyof typeof next.player.attributes] + (value ?? 0), 1, 100);
  next.player.attributes.confidence = clamp(next.player.attributes.confidence + (effects.confidence ?? 0), 1, 100); next.chemistry = clamp(next.chemistry + (effects.chemistry ?? 0)); next.player.reputation = clamp(next.player.reputation + (effects.reputation ?? 0)); next.player.money += effects.money ?? 0; next.player.fatigue = clamp(next.player.fatigue + (effects.fatigue ?? 0)); next.player.burnout = clamp(next.player.burnout + (effects.burnout ?? 0)); next.player.motivation = clamp(next.player.motivation + (effects.motivation ?? 0)); next.player.pressure = clamp(next.player.pressure + (effects.pressure ?? 0)); next.coachRelationship = clamp(next.coachRelationship + (effects.coachRelationship ?? 0)); next.iglRelationship = clamp(next.iglRelationship + (effects.iglRelationship ?? 0)); next.player.fanbase = clamp(next.player.fanbase + (effects.fanbase ?? 0)); next.player.trainingPoints += effects.trainingPoints ?? 0; Object.assign(next.flags, effects.flags ?? {});
  next.decisions.push({ eventId: event.id, choiceId: choice.id, season: next.season, week: next.week, outcome: choice.outcome }); next.pendingDecisionId = undefined; next.player.xp += 90; next.news.unshift(`${next.player.identity.nickname}: ${choice.outcome}`); next.updatedAt = new Date().toISOString();
  return { state: processLevelUps(next), message: choice.outcome };
}
