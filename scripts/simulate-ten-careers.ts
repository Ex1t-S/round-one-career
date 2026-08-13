import { getCareerEvent } from '../src/data/events';
import { STARTER_TEAMS } from '../src/data/teams';
import { prepareMajorMatch } from '../src/engine/major';
import { advanceWeek, applyDecision, completeOffseason, createCareer, resolvePendingMatch } from '../src/engine/season';
import { PlayerIdentity } from '../src/types/game';

const identity: PlayerIdentity = { fullName: 'Simulation Player', nickname: 'SIM', nationality: 'Argentina', region: 'Argentina', city: 'Buenos Aires', age: 17, primaryLanguage: 'Español', secondaryLanguages: ['Inglés'], handedness: 'Diestro', personality: 'Analítico', ambition: 85, riskTolerance: 60, priority: 'Títulos', role: 'Rifler', style: 'Mechanical' };

const reports = [];
for (let run = 0; run < 10; run += 1) {
  const seed = 20260813 + run * 7919;
  let career = createCareer({ ...identity, nickname: `SIM${run + 1}` }, STARTER_TEAMS[run % STARTER_TEAMS.length], 2026, seed);
  career.settings.minigames = false; career.settings.minigameMode = 'auto';
  for (let guard = 0; guard < 6500 && !career.finished; guard += 1) {
    if (career.pendingDecisionId) {
      const event = getCareerEvent(career.pendingDecisionId);
      if (!event) throw new Error(`Missing decision ${career.pendingDecisionId}`);
      career = applyDecision(career, event.choices[(run + guard) % event.choices.length]).state;
    } else if (career.pendingMatchId) career = resolvePendingMatch(career).state;
    else if (career.activeMajorId) career = prepareMajorMatch(career).state;
    else if (career.offseasonPending) { career.offseasonStep = 12; career = completeOffseason(career).state; }
    else career = advanceWeek(career).state;
  }
  const maps = career.matches.reduce((sum, match) => sum + match.maps.length, 0);
  const rating = career.matches.reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, career.matches.length);
  const bestRank = career.playerRankingHistory.flatMap((board) => board.entries).filter((entry) => entry.isUser).sort((a, b) => a.rank - b.rank)[0]?.rank;
  reports.push({
    run: run + 1, seed, team: STARTER_TEAMS[run % STARTER_TEAMS.length].name, ending: career.ending,
    series: career.matches.length, maps, rating: Number(rating.toFixed(2)), bestRank: bestRank ?? 'fuera',
    majorEntries: career.majorCampaigns.filter((campaign) => campaign.qualified).length,
    majorPlayoffs: career.majorCampaigns.filter((campaign) => Boolean(campaign.bracket)).length,
    majorWins: career.careerRecords.majorWins, earnings: career.careerRecords.earnings, netWorth: career.netWorth,
    worldNumberOnes: career.playerRankingHistory.map((board) => board.entries[0]?.nickname),
  });
}

console.log(JSON.stringify(reports, null, 2));
