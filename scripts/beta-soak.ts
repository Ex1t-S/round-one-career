import { getCareerEvent } from '../src/data/events';
import { TEAMS } from '../src/data/teams';
import { TRAINING_ACTIVITIES } from '../src/data/training';
import { prepareMajorMatch } from '../src/engine/major';
import { advanceWeek, applyDecision, completeOffseason, createCareer, resolvePendingMatch } from '../src/engine/season';
import { applyTraining } from '../src/engine/progression';
import { purchaseUpgrade } from '../src/engine/upgrades';
import { PlayerIdentity, CareerState } from '../src/types/game';

const identity: PlayerIdentity = { fullName: 'Beta QA Player', nickname: 'BETA', nationality: 'Argentina', region: 'Argentina', city: 'Buenos Aires', age: 17, primaryLanguage: 'Español', secondaryLanguages: ['Inglés'], handedness: 'Diestro', personality: 'Analítico', ambition: 85, riskTolerance: 60, priority: 'Títulos', role: 'Rifler', style: 'Mechanical' };
const seeds = Array.from({ length: 10 }, (_, index) => 2026081301 + index);
const rankingBucket = (rank: number) => rank <= 10 ? '1-10' : rank <= 30 ? '11-30' : rank <= 60 ? '31-60' : rank <= 100 ? '61-100' : '101+';
const argument = (name: string, fallback: number) => { const raw = process.argv.find((item) => item.startsWith(`--${name}=`))?.split('=')[1]; return raw === undefined ? fallback : Math.max(0, Number.parseInt(raw, 10) || 0); };
const partialRuns = argument('partial', 500);
const completeRuns = argument('complete', 250);
const fast = process.argv.includes('--fast');

function applyQaPolicy(state: CareerState, policy: number) {
  let next = state;
  const activityIds = ['aim-routine', 'igl-workshop', 'demo-review', 'media-training'];
  const activity = TRAINING_ACTIVITIES.find((item) => item.id === activityIds[policy % activityIds.length]);
  if (activity) for (let repeat = 0; repeat < 2; repeat += 1) next = applyTraining(next, activity).state;
  if (policy % 5 === 0) {
    next = purchaseUpgrade(next, 'savings').state;
    if (next.season >= 5) next = purchaseUpgrade(next, 'apartment').state;
  }
  return next;
}

function compactFastState(state: CareerState) {
  if (!fast) return state;
  const retainedMatches = state.matches.slice(-12); const removedMatches = state.matches.length - retainedMatches.length;
  state.flags.qaFastMatchOffset = (typeof state.flags.qaFastMatchOffset === 'number' ? state.flags.qaFastMatchOffset : 0) + removedMatches;
  state.matches = retainedMatches;
  state.news = state.news.slice(0, 12); state.socialFeed = state.socialFeed.slice(0, 8);
  state.decisions = state.decisions.slice(-16); state.playerRankingHistory = state.playerRankingHistory.slice(-1);
  state.tournamentCampaigns = state.tournamentCampaigns.filter((item) => item.season >= state.season - 1);
  state.majorCampaigns = state.majorCampaigns.filter((item) => item.season >= state.season - 1);
  return state;
}

function invariant(state: CareerState) {
  const numeric = [state.player.money, state.netWorth, state.player.marketValue, ...Object.values(state.player.attributes)];
  if (numeric.some((value) => !Number.isFinite(value))) throw new Error(`Non-finite value at S${state.season} M${state.month} W${state.week}`);
  if (state.season < 1 || state.month < 1 || state.month > 12 || state.week < 1 || state.week > 4) throw new Error('Invalid calendar invariant');
  const invalidRank = state.rankings.find((entry) => entry.rank < 1 || entry.rank > state.rankings.length); if (invalidRank) throw new Error(`Invalid team rank invariant: ${invalidRank.teamId}=${invalidRank.rank}/${state.rankings.length} at S${state.season} M${state.month} W${state.week}`);
  if (new Set(state.rankings.map((entry) => entry.teamId)).size !== state.rankings.length) throw new Error('Duplicate team ranking');
  if (state.activeMajorId && state.majorCampaigns.filter((campaign) => campaign.id === state.activeMajorId).length !== 1) throw new Error('Invalid active Major');
}

function play(seed: number, teamIndex: number, partial = false) {
  let career = createCareer({ ...identity, nickname: `BETA-${seed}` }, TEAMS[teamIndex % TEAMS.length], 2026, seed);
  career.settings.minigames = false; career.settings.minigameMode = 'auto';
  const limit = partial ? 4 : 6500;
  for (let guard = 0; guard < limit && !career.finished; guard += 1) {
    if (career.pendingDecisionId) { const event = getCareerEvent(career.pendingDecisionId); if (!event) throw new Error(`Missing decision ${career.pendingDecisionId}`); career = applyDecision(career, event.choices[(guard + seed) % event.choices.length]).state; }
    else if (career.pendingMatchId) career = resolvePendingMatch(career).state;
    else if (career.activeMajorId) career = prepareMajorMatch(career).state;
    else if (career.offseasonPending) { career = applyQaPolicy(career, teamIndex); career.offseasonStep = 12; career = completeOffseason(career).state; career = compactFastState(career); }
    else career = advanceWeek(career).state;
    if (fast) { career.news = career.news.slice(0, 12); career.socialFeed = career.socialFeed.slice(0, 8); }
    if (partial || guard % 12 === 0 || career.finished) invariant(career);
  }
  return career;
}

const partialFailures: string[] = [];
for (let index = 0; index < partialRuns; index += 1) { try { play(seeds[index % seeds.length] + index * 17, index, true); } catch (error) { partialFailures.push(String(error)); } }

type EndingAggregate = { count: number; netWorth: number[]; ratings: number[]; majorWins: number; trophies: number; bestRanks: number[] };
const endings = new Map<string, EndingAggregate>();
const careerPaths = new Map<string, number>();
const seasonSeries: number[] = []; const seasonMaps: number[] = [];
const funnel = new Map<string, { attempt: number; qualified: number; opening: number; elimination: number; playoffs: number; semifinal: number; final: number; champion: number }>();
for (const rank of [1, 11, 31, 61, 101]) funnel.set(rankingBucket(rank), { attempt: 0, qualified: 0, opening: 0, elimination: 0, playoffs: 0, semifinal: 0, final: 0, champion: 0 });
for (let index = 0; index < completeRuns; index += 1) {
  if (index % 10 === 0) console.error(`beta soak complete careers: ${index}/${completeRuns}`);
  const teamIndex = Math.min(TEAMS.length - 1, Math.floor(index * TEAMS.length / Math.max(1, completeRuns))); const initialTeam = TEAMS[teamIndex];
  const career = play(2026081301 + index * 7919, teamIndex);
  const ending = career.ending ?? 'unfinished'; const averageRating = career.seasonalStatistics.reduce((total, item) => total + item.rating, 0) / Math.max(1, career.seasonalStatistics.length); const aggregate = endings.get(ending) ?? { count: 0, netWorth: [], ratings: [], majorWins: 0, trophies: 0, bestRanks: [] }; aggregate.count += 1; aggregate.netWorth.push(career.netWorth); aggregate.ratings.push(averageRating); aggregate.majorWins += career.careerRecords.majorWins; aggregate.trophies += career.trophies.length; if (career.careerRecords.bestPlayerRank > 0) aggregate.bestRanks.push(career.careerRecords.bestPlayerRank); endings.set(ending, aggregate); careerPaths.set(career.player.path, (careerPaths.get(career.player.path) ?? 0) + 1); seasonSeries.push(...career.seasonalStatistics.map((item) => item.matches)); seasonMaps.push(...career.seasonalStatistics.map((item) => item.maps ?? 0));
  for (const campaign of career.majorCampaigns) { const bucket = funnel.get(rankingBucket(initialTeam.initialRanking)); if (!bucket) continue; bucket.attempt += 1; if (campaign.qualified) { bucket.qualified += 1; bucket.opening += 1; } const reachedElimination = campaign.bracket || campaign.news.some((item) => item.toLowerCase().includes('opening stage')); if (reachedElimination) bucket.elimination += 1; if (campaign.bracket) { bucket.playoffs += 1; const playerQuarterfinal = campaign.bracket.matches.find((item) => item.round === 'quarterfinal' && (item.teamAId === career.teamId || item.teamBId === career.teamId)); const playerSemifinal = campaign.bracket.matches.find((item) => item.round === 'semifinal' && (item.teamAId === career.teamId || item.teamBId === career.teamId)); const playerFinal = campaign.bracket.matches.find((item) => item.round === 'grand-final' && (item.teamAId === career.teamId || item.teamBId === career.teamId)); if (playerQuarterfinal?.winnerId === career.teamId) bucket.semifinal += 1; if (playerSemifinal?.winnerId === career.teamId) bucket.final += 1; if (playerFinal?.winnerId === career.teamId) bucket.champion += 1; } }
}
const percentile = (values: number[], fraction = .5) => { const sorted = values.slice().sort((a, b) => a - b); return sorted[Math.floor(Math.max(0, sorted.length - 1) * fraction)] ?? 0; };
const endingReport = Object.fromEntries([...endings.entries()].map(([name, aggregate]) => [name, { count: aggregate.count, percent: Number((aggregate.count / Math.max(1, completeRuns) * 100).toFixed(1)), medianRating: Number(percentile(aggregate.ratings).toFixed(2)), medianNetWorth: percentile(aggregate.netWorth), averageMajorWins: Number((aggregate.majorWins / aggregate.count).toFixed(2)), averageTrophies: Number((aggregate.trophies / aggregate.count).toFixed(2)), averageBestWorldRank: aggregate.bestRanks.length ? Number((aggregate.bestRanks.reduce((sum, value) => sum + value, 0) / aggregate.bestRanks.length).toFixed(1)) : null }]));
const distribution = (values: number[]) => ({ p10: percentile(values, .1), p25: percentile(values, .25), median: percentile(values), p75: percentile(values, .75), p90: percentile(values, .9), max: Math.max(0, ...values) });
console.log(JSON.stringify({ mode: fast ? 'fast' : 'full', partialRuns, partialFailures, completeRuns, endings: endingReport, careerPaths: Object.fromEntries(careerPaths), careerVolume: { seriesPerSeason: distribution(seasonSeries), mapsPerSeason: distribution(seasonMaps) }, throughput: { elapsedSeconds: Number((process.uptime()).toFixed(1)), careersPerSecond: Number((completeRuns / Math.max(.001, process.uptime())).toFixed(3)), seasonsPerSecond: Number((completeRuns * 12 / Math.max(.001, process.uptime())).toFixed(2)), matchesPerSecond: Number((seasonSeries.reduce((sum, value) => sum + value, 0) / Math.max(.001, process.uptime())).toFixed(2)) }, majorFunnel: Object.fromEntries(funnel.entries()) }, null, 2));
