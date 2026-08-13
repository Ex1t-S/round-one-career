import { ALL_CAREER_DECISIONS, CAREER_EVENTS, getCareerEvent } from '@/data/events';
import { TEAMS, getTeam } from '@/data/teams';
import { TOURNAMENTS, getTournament } from '@/data/tournaments';
import { CalendarEvent, CareerDecision, CareerState, DecisionChoice, DecisionEffect, PlayerIdentity, SeasonAdvanceResult, Team } from '@/types/game';
import { createContract, monthlyFinances } from './contracts';
import { clamp, calculateMarketValue, overallRating, processLevelUps } from './progression';
import { updateRankings } from './ranking';
import { rngFor, weightedPick } from './random';
import { simulateMatch } from './simulation';
import { buildInitialAttributes } from '@/data/roles';
import { cloneSerializable } from '@/utils/clone';
import { CAREER_SCHEMA_VERSION } from '@/state/migrations';
import { ensureMajorCampaign, majorTournamentForEvent, recordMajorMatch } from './major';
import { calculateFinancialSummary, settleOffseasonFinances } from './economy';
import { calculateNetWorth } from './upgrades';
import { canEnterTournament, simulateTournamentCampaign } from './tournament-campaign';
import { evaluateSquadState, generateCareerOffers } from './rosters';
import { tickConsumables } from './consumables';
import { generateAnnualPlayerRanking } from './player-ranking';

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

export function createCareer(identity: PlayerIdentity, team: Team, year = 2026, providedSeed?: number): CareerState {
  const now = new Date().toISOString();
  const attributes = buildInitialAttributes(identity.role, identity.style, identity.age);
  const player = { identity, attributes, level: 1, xp: 0, trainingPoints: 5, form: 55, fatigue: 10, burnout: 4, injuryRisk: 5, motivation: 78, pressure: 20, reputation: 8, fanbase: 3, marketValue: 25000, money: 1800, path: 'player' as const, benched: false, injuredWeeks: 0 };
  const rankings = TEAMS.map((item) => ({ teamId: item.id, rank: item.initialRanking, points: item.vrsPoints, trend: 0 }));
  const careerSeed = providedSeed ?? Math.floor(Math.random() * 2147483647);
  const state: CareerState = {
    schemaVersion: CAREER_SCHEMA_VERSION, id: `career-${Date.now()}`, createdAt: now, updatedAt: now, player, teamId: team.id, season: 1, year, month: 1, week: 1,
    calendar: buildSeasonCalendar(1), contract: createContract(team, identity.role, 52), matches: [], decisions: [], trophies: [], rankings, flags: {}, chemistry: 58,
    coachRelationship: 55, iglRelationship: 52, rivalries: {}, news: [`${identity.nickname} firma su primer contrato profesional con ${team.name}.`],
    socialFeed: [`@roundone: ${identity.nickname} comienza su camino desde ${identity.city}.`], awards: [], majorCampaigns: [], minigameHistory: [], financialHistory: [],
    inventory: { upgrades: [], properties: [], investments: [], purchaseHistory: [], consumables: [] }, netWorth: player.money,
    careerRecords: { bestRating: 0, bestAdr: 0, mostKills: 0, longestWinStreak: 0, majorWins: 0, majorMvps: 0, clutches: 0, earnings: 0, minigameHighScore: 0, bestPlayerRank: 0 },
    seasonalStatistics: [], playerRankingHistory: [], visualAssets: { avatarId: 'avatar-01', majorBanners: { 'colonge-major': 'major-cologne', 'singapore-major': 'major-singapore' }, endingAsset: 'career-finale' },
    careerSeed, seasonVariance: Math.round((rngFor(careerSeed, 1, 'season-variance')() - .5) * 16),
    squad: { role: team.initialRanking > 150 ? 'starter' : team.initialRanking > 110 ? 'rotation' : 'prospect', coachTrust: 55, roleSecurity: team.initialRanking > 150 ? 70 : team.initialRanking > 110 ? 58 : 46, mapShare: team.initialRanking > 150 ? 100 : team.initialRanking > 110 ? 72 : 48, internalCompetition: Math.max(35, 85 - Math.round((team.initialRanking - 80) * .3)), competitorName: team.roster[team.roster.length - 1] ?? 'academy player', seasonsAtTeam: 1, lastChangeReason: team.initialRanking > 150 ? 'El club chico te ofrece titularidad y responsabilidad inmediata.' : 'El primer contrato ofrece minutos, pero la titularidad se gana en oficiales.' },
    offers: [], tournamentCampaigns: [], deferredConsequences: [], decisionSlotsUsed: [],
    seasonStartSnapshot: { overall: overallRating(attributes), reputation: player.reputation, teamRank: team.initialRanking, money: player.money },
    offseasonPending: false, offseasonStep: 0, finished: false,
    settings: { simulationSpeed: 'balanced', minigames: true, minigameMode: 'important', minigameDifficulty: 'normal', reducedMotion: false, animations: 'full', sound: false, vibration: true, autosave: true },
  };
  state.player.marketValue = calculateMarketValue(state);
  return state;
}

function selectDecision(state: CareerState) {
  const random = rngFor(state.careerSeed, 'decision', state.season, state.month, state.week, state.decisions.length);
  const used = new Set(state.decisions.slice(-16).map((record) => record.eventId));
  const nextSlot = state.decisionSlotsUsed.length + 1;
  const recent = state.matches.filter((match) => match.season === state.season).slice(-8);
  const rating = recent.reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, recent.length);
  const team = getTeam(state.teamId);
  const contextual = ALL_CAREER_DECISIONS.filter((event) => event.slot === nextSlot && matchesDecisionContext(event, state, team, rating) && !used.has(event.id));
  if (contextual.length) return weightedPick(random, contextual, (event) => event.weight);
  const candidates = CAREER_EVENTS.filter((event) => (event.minSeason ?? 1) <= state.season && !used.has(event.id));
  return weightedPick(random, candidates.length ? candidates : CAREER_EVENTS, (event) => event.weight);
}

function matchesDecisionContext(event: CareerDecision, state: CareerState, team: Team, rating: number) {
  const context = event.context;
  if (!context) return true;
  if (context.teamTiers && !context.teamTiers.includes(team.tier)) return false;
  if (context.squadRoles && !context.squadRoles.includes(state.squad.role)) return false;
  if (context.minRating !== undefined && rating < context.minRating) return false;
  if (context.maxRating !== undefined && rating > context.maxRating) return false;
  if (context.minFatigue !== undefined && state.player.fatigue < context.minFatigue) return false;
  if (context.maxFatigue !== undefined && state.player.fatigue > context.maxFatigue) return false;
  if (context.requiresMajorQualified && !state.majorCampaigns.some((campaign) => campaign.season === state.season && campaign.qualified)) return false;
  return true;
}

function applyEffects(state: CareerState, effects: DecisionEffect) {
  for (const [key, value] of Object.entries(effects.attributes ?? {})) state.player.attributes[key as keyof typeof state.player.attributes] = clamp(state.player.attributes[key as keyof typeof state.player.attributes] + (value ?? 0), 1, 100);
  state.player.attributes.confidence = clamp(state.player.attributes.confidence + (effects.confidence ?? 0), 1, 100);
  state.chemistry = clamp(state.chemistry + (effects.chemistry ?? 0));
  state.player.reputation = clamp(state.player.reputation + (effects.reputation ?? 0));
  state.player.money += effects.money ?? 0;
  state.player.fatigue = clamp(state.player.fatigue + (effects.fatigue ?? 0));
  state.player.burnout = clamp(state.player.burnout + (effects.burnout ?? 0));
  state.player.motivation = clamp(state.player.motivation + (effects.motivation ?? 0));
  state.player.pressure = clamp(state.player.pressure + (effects.pressure ?? 0));
  state.coachRelationship = clamp(state.coachRelationship + (effects.coachRelationship ?? 0));
  state.iglRelationship = clamp(state.iglRelationship + (effects.iglRelationship ?? 0));
  state.player.fanbase = clamp(state.player.fanbase + (effects.fanbase ?? 0));
  state.player.trainingPoints += effects.trainingPoints ?? 0;
  Object.assign(state.flags, effects.flags ?? {});
}

function resolveDeferredConsequences(state: CareerState) {
  const absoluteWeek = (state.month - 1) * 4 + state.week;
  const ready = state.deferredConsequences.filter((item) => item.resolveSeason < state.season || item.resolveSeason === state.season && item.resolveWeek <= absoluteWeek);
  for (const item of ready) { applyEffects(state, item.effects); state.news.unshift(item.text); }
  state.deferredConsequences = state.deferredConsequences.filter((item) => !ready.includes(item));
  return ready.map((item) => item.text);
}

function eligibleTournaments(state: CareerState, team: Team) {
  return TOURNAMENTS.filter((tournament) => tournament.month === state.month && tournament.week === state.week && (tournament.region === 'International' || tournament.region === team.region || tournament.region === 'South America' && ['Argentina', 'Brazil', 'South America'].includes(team.region) || tournament.kind === 'qualifier'));
}

function closeYear(state: CareerState) {
  const next = cloneSerializable(state);
  const seasonMatches = next.matches.filter((match) => match.season === next.season);
  const average = seasonMatches.reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, seasonMatches.length);
  const wins = seasonMatches.filter((match) => match.won).length;
  const kills = seasonMatches.reduce((sum, match) => sum + match.aggregate.kills, 0);
  const deaths = seasonMatches.reduce((sum, match) => sum + match.aggregate.deaths, 0);
  const adr = seasonMatches.reduce((sum, match) => sum + match.aggregate.adr, 0) / Math.max(1, seasonMatches.length);
  const kast = seasonMatches.reduce((sum, match) => sum + match.aggregate.kast, 0) / Math.max(1, seasonMatches.length);
  const clutches = seasonMatches.reduce((sum, match) => sum + match.aggregate.clutches, 0);
  const maps = seasonMatches.reduce((sum, match) => sum + match.maps.length, 0);
  const bestMatch = seasonMatches.slice().sort((a, b) => b.aggregate.rating - a.aggregate.rating)[0];
  const worstMatch = seasonMatches.slice().sort((a, b) => a.aggregate.rating - b.aggregate.rating)[0];
  const financial = calculateFinancialSummary(next);
  const majorRuns = next.majorCampaigns.filter((campaign) => campaign.season === next.season);
  const teamRankEnd = next.rankings.find((entry) => entry.teamId === next.teamId)?.rank ?? getTeam(next.teamId).initialRanking;
  const bestMoment = bestMatch ? `${bestMatch.aggregate.rating.toFixed(2)} vs ${getTeam(bestMatch.opponentTeamId).name} en ${getTournament(bestMatch.tournamentId).shortName}` : 'Una temporada sin oficiales';
  const worstMoment = worstMatch ? `${worstMatch.aggregate.rating.toFixed(2)} vs ${getTeam(worstMatch.opponentTeamId).name}` : 'Sin registro';
  const underdogRun = next.tournamentCampaigns.find((campaign) => campaign.season === next.season && campaign.narrative.includes('revelación'));
  const seasonStory = majorRuns.some((campaign) => campaign.stage === 'completed')
    ? 'La temporada quedó definida por un campeonato Major.'
    : underdogRun?.narrative ?? (teamRankEnd < next.seasonStartSnapshot.teamRank ? `El equipo escaló del #${next.seasonStartSnapshot.teamRank} al #${teamRankEnd}.` : `El año exigió sostener el proyecto desde el #${teamRankEnd}.`);
  if (next.season === 1) next.awards.push('Rookie de la temporada');
  if (average >= 1.2) next.awards.push(`Top performer · Temporada ${next.season}`);
  if (next.player.identity.role === 'IGL' && next.chemistry >= 78) next.awards.push(`IGL del año · Temporada ${next.season}`);
  if (next.player.identity.role === 'AWPer' && average >= 1.15) next.awards.push(`AWPer del año · Temporada ${next.season}`);
  next.news.unshift(`${next.player.identity.nickname} cierra la temporada ${next.season} con ${average.toFixed(2)} de rating.`);
  const annualPlayerRanking = generateAnnualPlayerRanking(next);
  const playerRank = annualPlayerRanking.entries.find((entry) => entry.isUser)?.rank ?? 501;
  next.playerRankingHistory.push(annualPlayerRanking);
  next.seasonalStatistics.push({ season: next.season, matches: seasonMatches.length, wins, rating: Number(average.toFixed(2)), adr: Number(adr.toFixed(1)), kast: Number(kast.toFixed(1)), kd: Number((kills / Math.max(1, deaths)).toFixed(2)), clutches, worldRank: playerRank, marketValue: next.player.marketValue, salary: next.contract.monthlySalary, attributeAverage: overallRating(next.player.attributes), maps, kills, deaths, earnings: financial.salary + financial.prizeMoney + financial.winBonuses + financial.tournamentBonuses + financial.majorBonuses + financial.mvpBonuses + financial.sponsors + financial.streaming + financial.content + financial.otherIncome, reputationStart: next.seasonStartSnapshot.reputation, reputationEnd: next.player.reputation, overallStart: next.seasonStartSnapshot.overall, overallEnd: overallRating(next.player.attributes), teamRankStart: next.seasonStartSnapshot.teamRank, teamRankEnd, squadRole: next.squad.role, bestMoment, worstMoment, seasonStory });
  if (playerRank <= 100) next.news.unshift(`${next.player.identity.nickname} entra al Top 100 anual en el puesto #${playerRank}.`);
  if (playerRank <= 20) { next.awards.push(`Top ${playerRank} mundial · Temporada ${next.season}`); next.player.reputation = clamp(next.player.reputation + Math.max(2, 8 - Math.floor(playerRank / 4))); }
  if (playerRank === 1) next.awards.push(`Jugador #1 del mundo · Temporada ${next.season}`);
  next.careerRecords.bestPlayerRank = next.careerRecords.bestPlayerRank === 0 ? (playerRank <= 100 ? playerRank : 0) : Math.min(next.careerRecords.bestPlayerRank, playerRank);
  next.player.marketValue = calculateMarketValue(next);
  next.careerRecords.bestRating = Math.max(next.careerRecords.bestRating, ...seasonMatches.map((match) => match.aggregate.rating), 0);
  next.careerRecords.bestAdr = Math.max(next.careerRecords.bestAdr, ...seasonMatches.map((match) => match.aggregate.adr), 0);
  next.careerRecords.mostKills = Math.max(next.careerRecords.mostKills, ...seasonMatches.map((match) => match.aggregate.kills), 0);
  next.careerRecords.clutches += clutches;
  let streak = 0; let bestStreak = 0;
  for (const match of seasonMatches) { streak = match.won ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak); }
  next.careerRecords.longestWinStreak = Math.max(next.careerRecords.longestWinStreak, bestStreak);
  const evaluated = evaluateSquadState(next);
  evaluated.offers = generateCareerOffers(evaluated);
  const settled = settleOffseasonFinances(evaluated).state;
  settled.offseasonPending = true;
  settled.offseasonStep = 1;
  settled.month = 12;
  settled.week = 4;
  settled.netWorth = calculateNetWorth(settled);
  return settled;
}

export function completeOffseason(state: CareerState): { state: CareerState; message: string } {
  if (!state.offseasonPending) return { state, message: 'No hay un off-season pendiente.' };
  if (state.offseasonStep < 12) return { state, message: 'Completá las etapas del balance antes de continuar.' };
  const next = cloneSerializable(state);
  const currentSummary = calculateFinancialSummary(next);
  next.financialHistory = [...next.financialHistory.filter((item) => item.season !== next.season), { ...currentSummary, closingCash: next.player.money, netWorth: calculateNetWorth(next) }];
  next.player.identity.age += 1;
  next.offseasonPending = false;
  next.offseasonStep = 0;
  if (next.player.identity.age >= 34 || next.season >= 12 || next.player.burnout >= 98) {
    next.finished = true;
    next.player.path = next.player.attributes.leadership > 75 ? 'coach' : next.player.attributes.mediaSkill > 72 ? 'creator' : next.player.attributes.gameSense > 76 ? 'analyst' : 'retired';
    next.ending = next.careerRecords.majorWins >= 2 ? 'Leyenda de los Majors' : next.netWorth >= 1000000 ? 'Imperio más allá del servidor' : next.player.path === 'coach' ? 'El líder continúa desde el banco' : next.player.path === 'creator' ? 'Del servidor a la comunidad' : next.player.reputation > 75 ? 'Ícono del circuito' : 'Una carrera de sacrificio';
    return { state: next, message: next.ending };
  }
  next.season += 1; next.year += 1; next.month = 1; next.week = 1; next.calendar = buildSeasonCalendar(next.season);
  next.player.fatigue = clamp(next.player.fatigue - 35); next.player.burnout = clamp(next.player.burnout - 25); next.player.trainingPoints += 4;
  next.decisionSlotsUsed = [];
  next.seasonVariance = Math.round((rngFor(next.careerSeed, next.season, 'season-variance')() - .5) * 16);
  next.squad.seasonsAtTeam += 1;
  next.offers = next.offers.filter((offer) => offer.expiresAfterSeason >= next.season);
  next.seasonStartSnapshot = { overall: overallRating(next.player.attributes), reputation: next.player.reputation, teamRank: next.rankings.find((entry) => entry.teamId === next.teamId)?.rank ?? getTeam(next.teamId).initialRanking, money: next.player.money };
  next.updatedAt = new Date().toISOString();
  return { state: next, message: `Temporada ${next.season} iniciada. Objetivos confirmados.` };
}

export function advanceWeek(state: CareerState): SeasonAdvanceResult {
  if (state.finished || state.offseasonPending || state.activeMajorId || state.pendingDecisionId || state.pendingMatchId || state.pendingMinigame) return { state, messages: [state.offseasonPending ? 'OFF-SEASON · Completá Balance & Upgrades para iniciar el próximo año.' : state.activeMajorId ? 'La campaña del Major está activa. Continuá desde Major Hub.' : 'Hay una acción pendiente antes de avanzar.'], requiresDecision: Boolean(state.pendingDecisionId), requiresMatch: Boolean(state.pendingMatchId) };
  let next = cloneSerializable(state);
  const messages: string[] = [];
  const team = getTeam(next.teamId);
  messages.push(...resolveDeferredConsequences(next));
  next.calendar = next.calendar.map((event) => event.month === next.month && event.week === next.week ? { ...event, status: 'active' } : event);
  const scheduled = eligibleTournaments(next, team);
  const linkedMajorEvent = scheduled.find((item) => majorTournamentForEvent(item.id));
  const tournament = linkedMajorEvent ?? scheduled.filter((item) => canEnterTournament(next, item)).sort((a, b) => b.prestige - a.prestige)[0];
  const majorTournamentId = tournament ? majorTournamentForEvent(tournament.id) : undefined;
  const absoluteWeek = (next.month - 1) * 4 + next.week;
  const decisionThresholds = [2, 10, 18, 27, 36, 44];
  const nextDecisionSlot = next.decisionSlotsUsed.length + 1;
  const decisionDue = nextDecisionSlot <= 6 && absoluteWeek >= decisionThresholds[nextDecisionSlot - 1];
  const rosterSelected = rngFor(next.careerSeed, next.season, tournament?.id ?? 'scrim', 'roster-selection')() < Math.max(.65, next.squad.mapShare / 100);
  if (tournament && majorTournamentId) {
    next = ensureMajorCampaign(next, majorTournamentId);
    const campaign = next.majorCampaigns.find((item) => item.season === next.season && item.tournamentId === majorTournamentId);
    if (campaign?.status === 'active') {
      if (next.player.injuredWeeks > 0 || next.player.benched && next.player.reputation < 50) {
        campaign.status = 'eliminated'; campaign.stage = 'eliminated'; campaign.outcome = next.player.injuredWeeks > 0 ? 'Baja médica antes del evento.' : 'El roster eligió otro titular.'; next.activeMajorId = undefined;
        messages.push(`${getTournament(majorTournamentId).shortName}: ${campaign.outcome}`);
      } else { if (next.player.benched) campaign.news.unshift(`${next.player.identity.nickname} entra como suplente de emergencia.`); messages.push(`${getTournament(majorTournamentId).shortName}: campaña activa en ${campaign.stage.replaceAll('-', ' ')}.`); }
    } else messages.push(`${getTournament(majorTournamentId).shortName}: el camino de esta temporada ya terminó.`);
  } else if (decisionDue) {
    const decision = selectDecision(next);
    next.pendingDecisionId = decision.id;
    messages.push(`Nueva decisión: ${decision.title}`);
  } else if (tournament && next.player.injuredWeeks === 0 && (rosterSelected || next.player.benched && rngFor(next.careerSeed, next.season, tournament.id, 'substitute')() < .3)) {
    const simulated = simulateTournamentCampaign(next, tournament);
    next = evaluateSquadState(simulated.state);
    messages.push(simulated.message);
  } else if (tournament) {
    next.tournamentCampaigns.push({ id: `${next.season}-${tournament.id}`, tournamentId: tournament.id, season: next.season, status: 'missed', stage: 'Roster selection', playerMatchIds: [], wins: 0, losses: 0, finish: 'No disputado', prizeMoney: 0, playerRating: 0, narrative: next.player.injuredWeeks > 0 ? 'Una lesión dejó al jugador fuera de la convocatoria.' : 'El staff eligió otro titular para este evento.' });
    messages.push(`${tournament.shortName}: no fuiste convocado. Tu lugar en el roster ahora tiene consecuencias reales.`);
  } else {
    next.player.fatigue = clamp(next.player.fatigue - 5);
    next.player.trainingPoints += 1;
    next.player.xp += 35;
    messages.push('Semana de scrims completada: +1 punto de entrenamiento.');
  }
  if (next.player.injuredWeeks > 0) next.player.injuredWeeks -= 1;
  next = tickConsumables(next);
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

export function advanceUntilAction(state: CareerState, maxWeeks = 12): SeasonAdvanceResult {
  let next = state;
  const messages: string[] = [];
  for (let skipped = 0; skipped < Math.max(1, maxWeeks); skipped += 1) {
    const result = advanceWeek(next);
    messages.push(...result.messages);
    if (result.state === next) break;
    next = result.state;
    if (next.pendingDecisionId || next.pendingMatchId || next.pendingMinigame || next.activeMajorId || next.offseasonPending || next.finished) break;
  }
  return { state: next, messages, requiresDecision: Boolean(next.pendingDecisionId), requiresMatch: Boolean(next.pendingMatchId) };
}

export function resolvePendingMatch(state: CareerState): { state: CareerState; message: string } {
  if (!state.pendingMatchId) return { state, message: 'No hay partido pendiente.' };
  const [tournamentId, opponentId, campaignId] = state.pendingMatchId.split('|');
  const team = getTeam(state.teamId); const opponent = getTeam(opponentId); const tournament = getTournament(tournamentId);
  const campaign = campaignId ? state.majorCampaigns.find((item) => item.id === campaignId) : undefined;
  const swissMatch = campaign?.swissRounds.at(-1)?.find((item) => item.teamAId === state.teamId || item.teamBId === state.teamId);
  const bracketMatch = campaign?.bracket?.matches.find((item) => item.round === campaign.stage && (item.teamAId === state.teamId || item.teamBId === state.teamId));
  const majorFormat = campaign?.stage === 'open-qualifier' ? 'BO1' : swissMatch?.format ?? bracketMatch?.format ?? (campaign ? 'BO3' : undefined);
  const vetoMaps = typeof state.flags.lastVetoMaps === 'string' ? state.flags.lastVetoMaps.split('|').filter((id) => tournament.mapPool.includes(id)) : [];
  const selectedMaps = vetoMaps.length ? [...new Set([...vetoMaps, ...tournament.mapPool])] : undefined;
  const result = simulateMatch(state, team, opponent, tournamentId, selectedMaps, majorFormat);
  let next = cloneSerializable(state);
  next.matches.push(result); next.pendingMatchId = undefined;
  next.player.fatigue = clamp(next.player.fatigue + result.fatigueChange); next.player.attributes.confidence = clamp(next.player.attributes.confidence + result.confidenceChange, 1, 100); next.player.form = clamp(next.player.form + (result.won ? 4 : -3));
  next.player.xp += 120 + result.aggregate.kills * 3 + (result.won ? 140 : 30); next.player.reputation = clamp(next.player.reputation + (result.won ? 3 : -1)); next.player.fanbase = clamp(next.player.fanbase + (result.won ? 2 : 0));
  if (result.injuryOccurred) { next.player.injuredWeeks = 1 + Math.floor(next.player.injuryRisk / 30); next.news.unshift(`${next.player.identity.nickname} sufre una molestia y estará ${next.player.injuredWeeks} semana(s) fuera.`); }
  if (!campaignId && result.won && tournament.kind === 'major' && result.aggregate.rating > 1.1) { next.trophies.push({ id: `trophy-${Date.now()}`, name: tournament.name, season: next.season, tier: tournament.tier, mvp: result.aggregate.rating >= 1.35 }); if (result.aggregate.rating >= 1.35) next.awards.push(`MVP · ${tournament.name}`); }
  next.rankings = updateRankings(next.rankings, team.id, result.won, opponent.initialRanking, result.won ? Math.round(tournament.rankingPoints / 10) : 0);
  next.news.unshift(`${team.name} ${result.won ? 'vence' : 'cae'} ${result.seriesScore} ante ${opponent.name} en ${tournament.shortName}.`);
  next.socialFeed.unshift(`@roundone: ${next.player.identity.nickname} firma ${result.aggregate.rating.toFixed(2)} de rating vs ${opponent.name}.`);
  if (campaignId) next = recordMajorMatch(next, result);
  delete next.flags.lastMinigameModifier;
  delete next.flags.lastVetoMaps;
  next.player.marketValue = calculateMarketValue(next); next.updatedAt = new Date().toISOString();
  return { state: processLevelUps(next), message: `${result.won ? 'Victoria' : 'Derrota'} ${result.seriesScore}. Rating ${result.aggregate.rating.toFixed(2)}.` };
}

export function applyDecision(state: CareerState, choice: DecisionChoice): { state: CareerState; message: string } {
  const event = getCareerEvent(state.pendingDecisionId);
  if (!event) return { state, message: 'No hay decisión pendiente.' };
  const next = cloneSerializable(state);
  applyEffects(next, choice.effects);
  const random = rngFor(next.careerSeed, next.season, event.id, choice.id, next.decisions.length);
  const roll = random();
  const skillBias = (next.player.attributes.mentalStrength + next.player.attributes.consistency + next.coachRelationship - 150) / 30;
  const outcome = choice.outcomes?.length ? weightedPick(() => roll, choice.outcomes, (candidate) => Math.max(1, candidate.weight + (candidate.id === 'success' ? skillBias : candidate.id === 'setback' ? -skillBias : 0))) : undefined;
  if (outcome) applyEffects(next, outcome.effects);
  const outcomeText = outcome?.text ?? choice.outcome;
  if (outcome?.delayed) {
    const currentAbsoluteWeek = (next.month - 1) * 4 + next.week;
    const target = currentAbsoluteWeek + outcome.delayed.weeks;
    next.deferredConsequences.push({ id: `deferred-${event.id}-${next.decisions.length}`, sourceEventId: event.id, sourceChoiceId: choice.id, resolveSeason: next.season + outcome.delayed.seasons + Math.floor((target - 1) / 48), resolveWeek: (target - 1) % 48 + 1, text: outcome.delayed.text, effects: outcome.delayed.effects });
  }
  const context = `${getTeam(next.teamId).name} · ${next.squad.role} · forma ${next.player.form.toFixed(0)} · fatiga ${next.player.fatigue.toFixed(0)}`;
  next.decisions.push({ eventId: event.id, choiceId: choice.id, season: next.season, week: next.week, outcome: outcomeText, outcomeId: outcome?.id, roll: Number(roll.toFixed(4)), context });
  if (event.slot && !next.decisionSlotsUsed.includes(event.slot)) next.decisionSlotsUsed.push(event.slot);
  else if (!event.slot && next.decisionSlotsUsed.length < 6) next.decisionSlotsUsed.push(next.decisionSlotsUsed.length + 1);
  next.pendingDecisionId = undefined;
  next.player.xp += 90;
  next.news.unshift(`${next.player.identity.nickname}: ${outcomeText}`);
  next.updatedAt = new Date().toISOString();
  return { state: processLevelUps(next), message: `${outcomeText} Resultado ${outcome?.id ?? 'directo'}; la misma elección puede resolver distinto en otra carrera.` };
}
