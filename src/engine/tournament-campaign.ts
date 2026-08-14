import { TEAMS, getTeam } from '@/data/teams';
import { Tournament, TournamentCampaignState, CareerState, MatchResult } from '@/types/game';
import { cloneSerializable } from '@/utils/clone';
import { pick, rngFor } from './random';
import { clamp, processLevelUps } from './progression';
import { updateRankings } from './ranking';
import { matchSequence, simulateMatch } from './simulation';

function opponentFor(state: CareerState, tournament: Tournament, faced: string[]) {
  const team = getTeam(state.teamId);
  const rank = state.rankings.find((entry) => entry.teamId === team.id)?.rank ?? team.initialRanking;
  const range = tournament.tier === 'S' ? 55 : tournament.tier === 'A' ? 38 : 24;
  const regional = TEAMS.filter((candidate) => candidate.id !== team.id && !faced.includes(candidate.id) && (
    tournament.region === 'International' || candidate.region === tournament.region ||
    tournament.region === 'South America' && ['Argentina', 'Brazil', 'South America'].includes(candidate.region)
  ));
  const close = regional.filter((candidate) => Math.abs(candidate.initialRanking - rank) <= range);
  return pick(rngFor(state.careerSeed, tournament.id, state.season, matchSequence(state), faced.length), close.length ? close : regional.length ? regional : TEAMS.filter((candidate) => candidate.id !== team.id && !faced.includes(candidate.id)));
}

function appendSeries(state: CareerState, tournament: Tournament, stage: string, faced: string[]) {
  const opponent = opponentFor(state, tournament, faced);
  const result: MatchResult = { ...simulateMatch(state, getTeam(state.teamId), opponent, tournament.id), tournamentStage: stage };
  state.matches.push(result);
  faced.push(opponent.id);
  state.player.fatigue = clamp(state.player.fatigue + Math.max(3, Math.round(result.fatigueChange * .45)));
  state.player.form = clamp(state.player.form + (result.won ? 2 : -2));
  state.player.attributes.confidence = clamp(state.player.attributes.confidence + (result.won ? 2 : -2), 1, 100);
  state.player.xp += 70 + result.aggregate.kills * 2 + (result.won ? 75 : 20);
  if (result.injuryOccurred) {
    state.player.injuredWeeks = Math.max(state.player.injuredWeeks, 1 + Math.floor(state.player.injuryRisk / 35));
    state.news.unshift(`${state.player.identity.nickname} termina la serie con una molestia física.`);
  }
  state.rankings = updateRankings(state.rankings, state.teamId, result.won, opponent.initialRanking, result.won ? Math.max(4, Math.round(tournament.rankingPoints / 28)) : 0);
  return result;
}

export function canEnterTournament(state: CareerState, tournament: Tournament) {
  const rank = state.rankings.find((entry) => entry.teamId === state.teamId)?.rank ?? getTeam(state.teamId).initialRanking;
  if (tournament.kind === 'regional' || tournament.kind === 'online' || tournament.kind === 'academy') return rank <= Math.max(210, tournament.teams * 8);
  if (tournament.tier === 'C') return rank <= 200;
  if (tournament.tier === 'B') return rank <= 150;
  if (tournament.tier === 'A') return rank <= 85;
  return rank <= Math.max(20, tournament.teams * 2);
}

export function simulateTournamentCampaign(source: CareerState, tournament: Tournament) {
  const next = cloneSerializable(source);
  const faced: string[] = [];
  const results: MatchResult[] = [];
  let wins = 0;
  let losses = 0;
  let stage = 'Opening round';

  const play = (label: string) => {
    stage = label;
    const result = appendSeries(next, tournament, label, faced);
    results.push(result);
    if (result.won) wins += 1; else losses += 1;
    return result.won;
  };

  if (tournament.format === 'Swiss' || tournament.format === 'RMR') {
    while (wins < 3 && losses < 3) play(`${wins}-${losses} Swiss`);
    if (wins === 3 && tournament.tier !== 'Qualifier') {
      if (play('Quarterfinal') && play('Semifinal')) play('Grand final');
    }
  } else if (tournament.format === 'Round robin') {
    for (let index = 0; index < 5; index += 1) play(`Group round ${index + 1}`);
    if (wins >= 3 && play('Semifinal')) play('Grand final');
  } else if (tournament.format === 'Groups + playoffs' || tournament.format === 'Play-in') {
    for (let index = 0; index < 3; index += 1) play(`Group round ${index + 1}`);
    if (wins >= 2 && play('Quarterfinal') && play('Semifinal')) play('Grand final');
  } else if (tournament.format === 'Double elimination') {
    while (losses < 2 && wins < 4) play(wins >= 3 ? 'Grand final' : losses ? 'Lower bracket' : 'Upper bracket');
  } else {
    while (wins < 4 && losses < 1) play(wins === 3 ? 'Grand final' : wins === 2 ? 'Semifinal' : wins === 1 ? 'Quarterfinal' : 'Opening round');
  }

  const champion = stage === 'Grand final' && results.at(-1)?.won;
  const deepRun = results.some((result) => ['Quarterfinal', 'Semifinal', 'Grand final'].includes(result.tournamentStage ?? ''));
  const finish = champion ? 'Campeón' : stage === 'Grand final' ? 'Subcampeón' : stage === 'Semifinal' ? 'Semifinalista' : stage === 'Quarterfinal' ? 'Top 8' : wins ? `${wins} victoria${wins === 1 ? '' : 's'}` : 'Eliminación temprana';
  const prizeMoney = champion ? tournament.winnerPrize : stage === 'Grand final' ? Math.round(tournament.prizePool * .18) : deepRun ? Math.round(tournament.prizePool * .055) : wins ? Math.round(tournament.prizePool * .009) : 0;
  // Prize share is stored as a percentage (12 means 12%), never as a multiplier.
  // The cash is settled once during the off-season ledger pass.
  next.player.reputation = clamp(next.player.reputation + (champion ? tournament.reputationImpact : deepRun ? Math.max(2, Math.round(tournament.reputationImpact / 3)) : 0));
  next.player.fanbase = clamp(next.player.fanbase + (champion ? 5 : deepRun ? 2 : 0));
  if (champion) next.trophies.push({ id: `trophy-${tournament.id}-${next.season}`, name: tournament.name, season: next.season, tier: tournament.tier, mvp: results.reduce((sum, item) => sum + item.aggregate.rating, 0) / Math.max(1, results.length) >= 1.3 });
  const average = results.reduce((sum, item) => sum + item.aggregate.rating, 0) / Math.max(1, results.length);
  const currentRank = source.rankings.find((entry) => entry.teamId === source.teamId)?.rank ?? getTeam(source.teamId).initialRanking;
  const underdog = currentRank > 70 && (wins >= 2 || deepRun);
  const narrative = underdog
    ? `${getTeam(next.teamId).name} llegó como #${currentRank} y su ${finish.toLowerCase()} fue leído como una campaña revelación.`
    : champion ? `${getTeam(next.teamId).name} sostuvo el favoritismo y levantó el trofeo.` : `${getTeam(next.teamId).name} cerró el evento como ${finish.toLowerCase()}.`;
  const campaign: TournamentCampaignState = {
    id: `${next.season}-${tournament.id}`, tournamentId: tournament.id, season: next.season,
    status: champion ? 'completed' : 'eliminated', stage, playerMatchIds: results.map((item) => item.id),
    wins, losses, finish, prizeMoney, playerRating: Number(average.toFixed(2)), narrative,
  };
  next.tournamentCampaigns = [...next.tournamentCampaigns.filter((item) => item.id !== campaign.id), campaign];
  next.news.unshift(`${tournament.shortName}: ${finish}. ${narrative}`);
  return { state: processLevelUps(next), campaign, message: `${tournament.shortName}: ${finish} · ${results.length} series · rating ${campaign.playerRating.toFixed(2)}.` };
}
