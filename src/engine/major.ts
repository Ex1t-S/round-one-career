import { DEFAULT_MAJOR_FORMAT } from '@/data/majorStages';
import { MAJORS, getTournament } from '@/data/tournaments';
import { getTeam, TEAMS } from '@/data/teams';
import { CareerState, MajorCampaignState, MajorEntryPath, MajorStage, MatchResult, SwissRoundMatch, SwissStanding } from '@/types/game';
import { cloneSerializable } from '@/utils/clone';
import { createBracket, recordBracketResult } from './brackets';
import { clamp } from './progression';
import { rngFor } from './random';
import { estimatedSeriesWinProbability } from './simulation';

export const MAJOR_PATHS: Record<string, string> = {
  'major-1-open': 'colonge-major',
  'major-1-rmr': 'colonge-major',
  'colonge-major': 'colonge-major',
  'major-2-open': 'singapore-major',
  'major-2-rmr': 'singapore-major',
  'singapore-major': 'singapore-major',
};

export function majorTournamentForEvent(tournamentId: string) {
  return MAJOR_PATHS[tournamentId];
}

export function determineMajorEntryPath(state: CareerState): MajorEntryPath {
  const rank = state.rankings.find((entry) => entry.teamId === state.teamId)?.rank ?? 100;
  const defending = state.majorCampaigns.some((campaign) => campaign.season === state.season - 1 && campaign.bracket?.championId === state.teamId);
  if (defending) return 'defending-champion';
  if (rank <= DEFAULT_MAJOR_FORMAT.directInviteRank) return 'direct-invite';
  if (rank <= 18) return 'ranking';
  if (rank <= 32 && state.chemistry >= 58) return 'regional-invite';
  if (rank <= 52) return 'rmr';
  if (rank <= 76) return 'closed-qualifier';
  return 'open-qualifier';
}

function startingStage(path: MajorEntryPath): MajorStage {
  if (path === 'defending-champion' || path === 'direct-invite' || path === 'ranking') return 'opening-stage';
  if (path === 'regional-invite' || path === 'rmr') return 'rmr';
  if (path === 'closed-qualifier') return 'closed-qualifier';
  return 'open-qualifier';
}

function campaignParticipants(state: CareerState, count = 16) {
  const ordered = state.rankings.slice().sort((a, b) => a.rank - b.rank).map((entry) => entry.teamId).filter((id) => id !== state.teamId);
  return [state.teamId, ...ordered].slice(0, count);
}

export function createMajorCampaign(state: CareerState, tournamentId: string): MajorCampaignState {
  const path = determineMajorEntryPath(state);
  const stage = startingStage(path);
  return {
    id: `major-${state.season}-${tournamentId}`,
    tournamentId,
    season: state.season,
    stage,
    entryPath: path,
    qualified: ['defending-champion', 'direct-invite', 'ranking'].includes(path),
    status: 'active',
    participants: campaignParticipants(state),
    swiss: [],
    swissRounds: [],
    playerMatchIds: [],
    objectives: ['Clasificar al evento principal', 'Llegar a playoffs', 'Mantener 1.10+ de rating'],
    news: [`El camino a ${getTournament(tournamentId).name} comienza mediante ${path.replaceAll('-', ' ')}.`],
    gallery: [],
    playerRating: 0,
    playerKills: 0,
    mediaPressure: getTournament(tournamentId).pressure,
    allStarTeam: [],
    records: [],
  };
}

export function ensureMajorCampaign(state: CareerState, tournamentId: string) {
  const existing = state.majorCampaigns.find((campaign) => campaign.season === state.season && campaign.tournamentId === tournamentId);
  if (existing) return state;
  const next = cloneSerializable(state);
  const campaign = createMajorCampaign(next, tournamentId);
  next.majorCampaigns.push(campaign);
  next.activeMajorId = campaign.id;
  next.news.unshift(`${getTournament(tournamentId).name}: ${campaign.entryPath.replaceAll('-', ' ')} confirmado.`);
  return next;
}

export function createSwissStandings(participants: string[]): SwissStanding[] {
  return participants.map((teamId) => ({ teamId, record: { wins: 0, losses: 0, buchholz: 0 }, opponents: [], status: 'active' }));
}

export function pairSwissRound(standings: SwissStanding[], round: number): SwissRoundMatch[] {
  const active = standings.filter((entry) => entry.status === 'active').sort((a, b) => b.record.wins - a.record.wins || a.record.losses - b.record.losses || b.record.buchholz - a.record.buchholz || a.teamId.localeCompare(b.teamId));
  const unpaired = [...active];
  const matches: SwissRoundMatch[] = [];
  while (unpaired.length >= 2) {
    const teamA = unpaired.shift()!;
    let index = unpaired.findIndex((candidate) => candidate.record.wins === teamA.record.wins && candidate.record.losses === teamA.record.losses && !teamA.opponents.includes(candidate.teamId));
    if (index < 0) index = unpaired.findIndex((candidate) => !teamA.opponents.includes(candidate.teamId));
    if (index < 0) index = 0;
    const [teamB] = unpaired.splice(index, 1);
    const decider = teamA.record.wins === 2 || teamA.record.losses === 2 || teamB.record.wins === 2 || teamB.record.losses === 2;
    matches.push({ id: `swiss-r${round}-${matches.length + 1}`, round, teamAId: teamA.teamId, teamBId: teamB.teamId, format: decider ? DEFAULT_MAJOR_FORMAT.swissDeciderFormat : DEFAULT_MAJOR_FORMAT.swissInitialFormat, explanation: [`Emparejamiento por récord ${teamA.record.wins}-${teamA.record.losses}`, teamA.opponents.includes(teamB.teamId) ? 'Revancha inevitable por falta de rivales válidos' : 'Sin enfrentamiento repetido'] });
  }
  return matches;
}

export function recordSwissRound(standings: SwissStanding[], roundMatches: SwissRoundMatch[]) {
  const next = standings.map((entry) => ({ ...entry, record: { ...entry.record }, opponents: [...entry.opponents] }));
  for (const match of roundMatches) {
    if (!match.winnerId || !match.loserId) continue;
    const winner = next.find((entry) => entry.teamId === match.winnerId);
    const loser = next.find((entry) => entry.teamId === match.loserId);
    if (!winner || !loser) continue;
    winner.record.wins += 1; loser.record.losses += 1;
    winner.opponents.push(loser.teamId); loser.opponents.push(winner.teamId);
    if (winner.record.wins >= 3) winner.status = 'qualified';
    if (loser.record.losses >= 3) loser.status = 'eliminated';
  }
  for (const entry of next) entry.record.buchholz = entry.opponents.reduce((sum, opponentId) => sum + (next.find((item) => item.teamId === opponentId)?.record.wins ?? 0), 0);
  return next;
}

function nextQualificationStage(stage: MajorStage): MajorStage {
  if (stage === 'open-qualifier') return 'closed-qualifier';
  if (stage === 'closed-qualifier') return 'rmr';
  return 'opening-stage';
}

function opponentForQualification(state: CareerState, campaign: MajorCampaignState) {
  const rank = state.rankings.find((entry) => entry.teamId === state.teamId)?.rank ?? 100;
  const random = rngFor(campaign.id, campaign.stage, campaign.playerMatchIds.length);
  const range = campaign.stage === 'open-qualifier' ? 28 : campaign.stage === 'closed-qualifier' ? 18 : 12;
  const candidates = state.rankings.filter((entry) => entry.teamId !== state.teamId && Math.abs(entry.rank - rank) <= range);
  return candidates[Math.floor(random() * Math.max(1, candidates.length))]?.teamId ?? campaign.participants.find((id) => id !== state.teamId) ?? TEAMS[0].id;
}

export function majorProbabilityBreakdown(state: CareerState, campaign: MajorCampaignState, opponentId?: string) {
  const opponent = getTeam(opponentId ?? campaign.pendingOpponentId ?? TEAMS[0].id);
  const rank = state.rankings.find((entry) => entry.teamId === state.teamId)?.rank ?? 100;
  const recent = state.matches.slice(-8);
  const recentForm = recent.length ? recent.filter((match) => match.won).length / recent.length * 100 : state.player.form;
  const roster = state.player.benched ? -18 : state.player.injuredWeeks ? -22 : 0;
  const factors = {
    ranking: clamp(58 - (rank - opponent.initialRanking) * 0.7, 18, 82),
    recentForm,
    chemistry: state.chemistry,
    playerLevel: Object.values(state.player.attributes).reduce((sum, value) => sum + value, 0) / Object.values(state.player.attributes).length,
    roster,
    budget: clamp(getTeam(state.teamId).budget / Math.max(1, opponent.budget) * 50, 20, 80),
    condition: clamp(100 - state.player.fatigue - state.player.injuryRisk * 0.5, 10, 95),
  };
  const swissMatch = campaign.swissRounds.at(-1)?.find((match) => match.teamAId === state.teamId || match.teamBId === state.teamId);
  const bracketMatch = campaign.bracket?.matches.find((match) => match.round === campaign.stage && (match.teamAId === state.teamId || match.teamBId === state.teamId));
  const format = campaign.stage === 'open-qualifier' ? 'BO1' : swissMatch?.format ?? bracketMatch?.format ?? 'BO3';
  const probability = estimatedSeriesWinProbability(state, getTeam(state.teamId), opponent, campaign.tournamentId, format) * 100;
  return { probability, factors };
}

function fillPlayoffParticipants(state: CareerState, campaign: MajorCampaignState) {
  const qualified = campaign.swiss.filter((entry) => entry.status === 'qualified').sort((a, b) => b.record.wins - a.record.wins || b.record.buchholz - a.record.buchholz).map((entry) => entry.teamId);
  const fallback = state.rankings.slice().sort((a, b) => a.rank - b.rank).map((entry) => entry.teamId);
  return [...new Set([state.teamId, ...qualified, ...fallback])].slice(0, 8);
}

function eliminationStageParticipants(state: CareerState, campaign: MajorCampaignState) {
  const advanced = campaign.swiss.filter((entry) => entry.status === 'qualified').map((entry) => entry.teamId);
  const invited = state.rankings.slice().sort((a, b) => a.rank - b.rank).map((entry) => entry.teamId).filter((teamId) => !advanced.includes(teamId) && !campaign.participants.includes(teamId));
  return [...advanced, ...invited].slice(0, 16);
}

export function prepareMajorMatch(state: CareerState): { state: CareerState; message: string } {
  if (!state.activeMajorId || state.pendingMatchId || state.pendingMinigame) return { state, message: 'Hay una acción pendiente.' };
  const next = cloneSerializable(state);
  const campaign = next.majorCampaigns.find((item) => item.id === next.activeMajorId);
  if (campaign?.playerMatchIds.length) next.player.fatigue = clamp(next.player.fatigue - 8);
  if (!campaign) return { state, message: 'No hay una campaña de Major activa.' };
  if (campaign.status === 'eliminated' || campaign.status === 'completed') return { state, message: campaign.outcome ?? 'La campaña terminó.' };
  if (campaign.stage === 'ceremony') return finalizeMajorCeremony(next);
  if (campaign.stage === 'playoffs') {
    campaign.bracket = createBracket(fillPlayoffParticipants(next, campaign), DEFAULT_MAJOR_FORMAT.playoffFormat, DEFAULT_MAJOR_FORMAT.grandFinalFormat);
    campaign.stage = 'quarterfinal';
  }
  let opponentId: string | undefined;
  let context: string = campaign.stage;
  if (['open-qualifier', 'closed-qualifier', 'rmr'].includes(campaign.stage)) opponentId = opponentForQualification(next, campaign);
  else if (campaign.stage === 'opening-stage' || campaign.stage === 'elimination-stage') {
    if (!campaign.swiss.length) campaign.swiss = createSwissStandings(campaign.participants);
    const round = pairSwissRound(campaign.swiss, campaign.swissRounds.length + 1);
    campaign.swissRounds.push(round);
    const playerPair = round.find((match) => match.teamAId === next.teamId || match.teamBId === next.teamId);
    opponentId = playerPair?.teamAId === next.teamId ? playerPair.teamBId : playerPair?.teamAId;
    context = `${campaign.stage} ${campaign.swiss.find((entry) => entry.teamId === next.teamId)?.record.wins ?? 0}-${campaign.swiss.find((entry) => entry.teamId === next.teamId)?.record.losses ?? 0}`;
  } else if (campaign.bracket) {
    const match = campaign.bracket.matches.find((item) => item.round === campaign.stage && !item.winnerId && (item.teamAId === next.teamId || item.teamBId === next.teamId));
    opponentId = match?.teamAId === next.teamId ? match.teamBId : match?.teamAId;
  }
  if (!opponentId) return { state, message: 'No se pudo determinar el próximo rival del Major.' };
  campaign.pendingOpponentId = opponentId;
  next.pendingMatchId = `${campaign.tournamentId}|${opponentId}|${campaign.id}`;
  return { state: next, message: `${getTournament(campaign.tournamentId).shortName}: ${context} vs ${getTeam(opponentId).name}.` };
}

function simulateOtherSwissMatches(state: CareerState, campaign: MajorCampaignState, playerResult: MatchResult) {
  const round = campaign.swissRounds[campaign.swissRounds.length - 1];
  for (const match of round) {
    const includesPlayer = match.teamAId === state.teamId || match.teamBId === state.teamId;
    if (includesPlayer) {
      match.winnerId = playerResult.won ? state.teamId : campaign.pendingOpponentId;
      match.loserId = playerResult.won ? campaign.pendingOpponentId : state.teamId;
      match.score = playerResult.seriesScore;
    } else {
      const random = rngFor(campaign.id, campaign.stage, match.round, match.id);
      const teamA = getTeam(match.teamAId); const teamB = getTeam(match.teamBId);
      const chance = clamp(0.5 + (teamA.globalLevel - teamB.globalLevel) / 80, 0.2, 0.8);
      match.winnerId = random() < chance ? teamA.id : teamB.id;
      match.loserId = match.winnerId === teamA.id ? teamB.id : teamA.id;
      match.score = match.format === 'BO1' ? '1-0' : '2-1';
    }
  }
  campaign.swiss = recordSwissRound(campaign.swiss, round);
}

function simulateBracketRound(state: CareerState, campaign: MajorCampaignState, playerResult: MatchResult) {
  if (!campaign.bracket) return;
  const playerMatch = campaign.bracket.matches.find((item) => item.round === campaign.stage && !item.winnerId && (item.teamAId === state.teamId || item.teamBId === state.teamId));
  if (!playerMatch) return;
  const winner = playerResult.won ? state.teamId : campaign.pendingOpponentId!;
  campaign.bracket = recordBracketResult(campaign.bracket, playerMatch.id, winner, playerResult.seriesScore, playerResult.aggregate.rating >= 1.22 ? state.player.identity.nickname : getTeam(winner).star, playerResult.highlights[0]);
  const roundMatches = campaign.bracket.matches.filter((item) => item.round === campaign.stage && !item.winnerId && item.teamAId && item.teamBId);
  for (const match of roundMatches) {
    const random = rngFor(campaign.id, match.id);
    const teamA = getTeam(match.teamAId!); const teamB = getTeam(match.teamBId!);
    const winnerId = random() < clamp(0.5 + (teamA.globalLevel - teamB.globalLevel) / 80, 0.2, 0.8) ? teamA.id : teamB.id;
    campaign.bracket = recordBracketResult(campaign.bracket, match.id, winnerId, match.format === 'BO5' ? '3-1' : '2-1', getTeam(winnerId).star, 'La serie se definió en el mapa decisivo.');
  }
}

export function recordMajorMatch(state: CareerState, result: MatchResult): CareerState {
  if (!state.activeMajorId) return state;
  const next = cloneSerializable(state);
  const campaign = next.majorCampaigns.find((item) => item.id === next.activeMajorId);
  if (!campaign) return state;
  campaign.playerMatchIds.push(result.id);
  campaign.playerKills += result.aggregate.kills;
  campaign.playerRating = Math.round(((campaign.playerRating * (campaign.playerMatchIds.length - 1) + result.aggregate.rating) / campaign.playerMatchIds.length) * 100) / 100;
  campaign.gallery.push(result.highlights[0]);
  if (['open-qualifier', 'closed-qualifier', 'rmr'].includes(campaign.stage)) {
    if (!result.won) {
      const eliminatedStage = campaign.stage;
      campaign.stage = 'eliminated'; campaign.status = 'eliminated'; campaign.outcome = `Eliminado en ${eliminatedStage.replaceAll('-', ' ')}.`;
    } else {
      const previous = campaign.stage;
      campaign.stage = nextQualificationStage(campaign.stage);
      if (campaign.stage === 'opening-stage') campaign.qualified = true;
      campaign.news.unshift(`Clasificación superada: ${previous.replaceAll('-', ' ')}.`);
    }
  } else if (campaign.stage === 'opening-stage' || campaign.stage === 'elimination-stage') {
    const currentStage = campaign.stage;
    simulateOtherSwissMatches(next, campaign, result);
    const player = campaign.swiss.find((entry) => entry.teamId === next.teamId);
    if (player?.status === 'eliminated') {
      campaign.stage = 'eliminated'; campaign.status = 'eliminated'; campaign.outcome = `Eliminado ${player.record.wins}-${player.record.losses} en ${currentStage.replaceAll('-', ' ')}.`;
    } else if (player?.status === 'qualified') {
      if (currentStage === 'opening-stage') {
        const participants = eliminationStageParticipants(next, campaign);
        campaign.stage = 'elimination-stage'; campaign.swiss = []; campaign.swissRounds = []; campaign.participants = participants;
      } else campaign.stage = 'playoffs';
      campaign.news.unshift(`Avance ${player.record.wins}-${player.record.losses} desde ${currentStage.replaceAll('-', ' ')}.`);
    }
  } else if (campaign.bracket) {
    const currentStage = campaign.stage;
    simulateBracketRound(next, campaign, result);
    if (!result.won) {
      campaign.stage = 'eliminated'; campaign.status = 'eliminated'; campaign.outcome = currentStage === 'grand-final' ? 'Subcampeón del Major.' : `Eliminado en ${currentStage.replaceAll('-', ' ')}.`;
    } else if (currentStage === 'quarterfinal') campaign.stage = 'semifinal';
    else if (currentStage === 'semifinal') campaign.stage = 'grand-final';
    else campaign.stage = 'ceremony';
  }
  campaign.pendingOpponentId = undefined;
  if (campaign.status === 'eliminated') next.activeMajorId = undefined;
  next.player.pressure = clamp(next.player.pressure + (result.won ? -2 : 4));
  return next;
}

export function finalizeMajorCeremony(state: CareerState): { state: CareerState; message: string } {
  if (!state.activeMajorId) return { state, message: 'No hay ceremonia pendiente.' };
  const next = cloneSerializable(state);
  const campaign = next.majorCampaigns.find((item) => item.id === next.activeMajorId);
  if (!campaign) return { state, message: 'No hay ceremonia pendiente.' };
  const champion = campaign.bracket?.championId;
  const playerWon = champion === next.teamId;
  campaign.mvp = campaign.playerRating >= 1.28 ? next.player.identity.nickname : champion ? getTeam(champion).star : undefined;
  campaign.allStarTeam = [campaign.mvp ?? next.player.identity.nickname, ...campaign.participants.filter((id) => id !== champion).slice(0, 4).map((id) => getTeam(id).star)];
  if (campaign.playerRating >= 1.45) campaign.records.push(`Rating histórico ${campaign.playerRating.toFixed(2)}`);
  if (campaign.playerKills >= 180) campaign.records.push(`${campaign.playerKills} kills en la campaña`);
  if (next.player.reputation < 45 && campaign.playerRating >= 1.18) campaign.records.push(`Revelación del torneo: ${next.player.identity.nickname}`);
  campaign.status = 'completed'; campaign.stage = 'completed'; campaign.outcome = playerWon ? `Campeón de ${getTournament(campaign.tournamentId).name}.` : campaign.outcome ?? 'Campaña completada.';
  if (playerWon) {
    next.trophies.push({ id: `trophy-${campaign.id}`, name: getTournament(campaign.tournamentId).name, season: next.season, tier: 'S', mvp: campaign.mvp === next.player.identity.nickname });
    next.careerRecords.majorWins += 1;
    next.player.reputation = clamp(next.player.reputation + 14);
    next.player.marketValue = Math.round(next.player.marketValue * 1.18);
    next.contract.decisionInfluence = clamp(next.contract.decisionInfluence + 5);
  }
  if (campaign.mvp === next.player.identity.nickname) { next.awards.push(`MVP · ${getTournament(campaign.tournamentId).name}`); next.careerRecords.majorMvps += 1; }
  next.activeMajorId = undefined;
  return { state: next, message: campaign.outcome };
}

export function allSeasonMajorsResolved(state: CareerState) {
  return MAJORS.every((major) => state.majorCampaigns.some((campaign) => campaign.season === state.season && campaign.tournamentId === major.id && ['eliminated', 'completed'].includes(campaign.status)));
}
