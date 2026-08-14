import { MAJORS } from '../src/data/tournaments';
import { TEAMS } from '../src/data/teams';
import { createMajorCampaign, majorProbabilityBreakdown, prepareMajorMatch } from '../src/engine/major';
import { createCareer, resolvePendingMatch } from '../src/engine/season';
import { PlayerIdentity } from '../src/types/game';

const identity: PlayerIdentity = { fullName: 'Major QA', nickname: 'MAJOR-QA', nationality: 'Argentina', region: 'Argentina', city: 'Buenos Aires', age: 17, primaryLanguage: 'Español', secondaryLanguages: ['Inglés'], handedness: 'Diestro', personality: 'Analítico', ambition: 85, riskTolerance: 60, priority: 'Títulos', role: 'Rifler', style: 'Mechanical' };
const targets = [1, 5, 10, 20, 40, 70, 110];
const runs = Math.max(1, Number.parseInt(process.argv.find((item) => item.startsWith('--runs='))?.split('=')[1] ?? '500', 10));
const nearestTeam = (target: number) => TEAMS.slice().sort((a, b) => Math.abs(a.initialRanking - target) - Math.abs(b.initialRanking - target))[0];
const swissAdvance = (probability: number) => probability ** 3 * (1 + 3 * (1 - probability) + 6 * (1 - probability) ** 2);

const report = targets.map((target) => {
  const team = nearestTeam(target);
  const totals = { rank: target, team: team.name, entryPath: '', attempts: runs, qualified: 0, opening: 0, elimination: 0, playoffs: 0, semifinal: 0, final: 0, champion: 0, blocked: 0, matches: 0, rating: 0, probabilities: 0, probabilitySamples: 0 };
  for (let run = 0; run < runs; run += 1) {
    let state = createCareer({ ...identity, nickname: `MQA-${target}-${run}` }, team, 2026, 2026081301 + target * 100_000 + run);
    state.settings.minigames = false; state.settings.minigameMode = 'auto';
    const campaign = createMajorCampaign(state, MAJORS[0].id); totals.entryPath = campaign.entryPath; state.majorCampaigns.push(campaign); state.activeMajorId = campaign.id;
    let reachedOpening = campaign.stage === 'opening-stage'; let reachedElimination = false; let reachedPlayoffs = false; let reachedSemifinal = false; let reachedFinal = false;
    for (let guard = 0; guard < 40 && state.activeMajorId; guard += 1) {
      if (!state.pendingMatchId) {
        const prepared = prepareMajorMatch(state); state = prepared.state;
        if (!state.pendingMatchId && state.activeMajorId) { totals.blocked += 1; break; }
      }
      const active = state.majorCampaigns.find((item) => item.id === state.activeMajorId);
      if (!active || !state.pendingMatchId) break;
      reachedOpening ||= active.stage === 'opening-stage'; reachedElimination ||= active.stage === 'elimination-stage'; reachedPlayoffs ||= ['playoffs', 'quarterfinal', 'semifinal', 'grand-final', 'ceremony'].includes(active.stage); reachedSemifinal ||= ['semifinal', 'grand-final', 'ceremony'].includes(active.stage); reachedFinal ||= ['grand-final', 'ceremony'].includes(active.stage);
      const opponentId = state.pendingMatchId.split('|')[1]; const estimate = majorProbabilityBreakdown(state, active, opponentId).probability; totals.probabilities += estimate; totals.probabilitySamples += 1;
      state = resolvePendingMatch(state).state;
    }
    const completed = state.majorCampaigns[0]; totals.qualified += completed.qualified ? 1 : 0; totals.opening += reachedOpening ? 1 : 0; totals.elimination += reachedElimination ? 1 : 0; totals.playoffs += reachedPlayoffs || Boolean(completed.bracket) ? 1 : 0; totals.semifinal += reachedSemifinal ? 1 : 0; totals.final += reachedFinal ? 1 : 0; totals.champion += completed.bracket?.championId === team.id ? 1 : 0; totals.matches += completed.playerMatchIds.length; totals.rating += completed.playerRating;
  }
  const representativeSeriesProbability = totals.probabilities / Math.max(1, totals.probabilitySamples) / 100; const qualifierGates = totals.entryPath === 'open-qualifier' ? 3 : totals.entryPath === 'closed-qualifier' ? 2 : totals.entryPath === 'rmr' || totals.entryPath === 'regional-invite' ? 1 : 0;
  return { ...totals, averageMatches: Number((totals.matches / runs).toFixed(2)), averageRating: Number((totals.rating / runs).toFixed(2)), averageWinProbability: Number((representativeSeriesProbability * 100).toFixed(1)), approximatePlayoffProbability: Number((representativeSeriesProbability ** qualifierGates * swissAdvance(representativeSeriesProbability) ** 2 * 100).toFixed(2)), path: `${qualifierGates ? ['Open', 'Closed', 'RMR'].slice(3 - qualifierGates).join(' → ') + ' → ' : ''}Opening Swiss → Elimination Swiss → Playoffs` };
});

console.log(JSON.stringify({ runsPerRank: runs, campaigns: runs * targets.length, report }, null, 2));
