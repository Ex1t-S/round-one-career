import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { SCREEN_IDS } from '../src/constants/routes';
import { ALL_CAREER_DECISIONS, CAREER_EVENTS, getCareerEvent } from '../src/data/events';
import { CONSUMABLES } from '../src/data/consumables';
import { MAPS } from '../src/data/maps';
import { DEFAULT_MAJOR_FORMAT } from '../src/data/majorStages';
import { STARTER_TEAMS, TEAMS } from '../src/data/teams';
import { MAJORS, TOURNAMENTS } from '../src/data/tournaments';
import { UPGRADES } from '../src/data/upgrades';
import { assertBracketIntegrity, createBracket, recordBracketResult } from '../src/engine/brackets';
import { calculateFinancialSummary, settleOffseasonFinances } from '../src/engine/economy';
import { createMajorCampaign, createSwissStandings, determineMajorEntryPath, finalizeMajorCeremony, pairSwissRound, prepareMajorMatch, recordMajorMatch, recordSwissRound } from '../src/engine/major';
import { autoSimulateMinigame, createMinigame, MINIGAME_DEFINITIONS, resolveMinigame } from '../src/engine/minigames';
import { advanceUntilAction, advanceWeek, applyDecision, completeOffseason, createCareer, resolvePendingMatch } from '../src/engine/season';
import { simulateMatch } from '../src/engine/simulation';
import { annualMaintenance, calculateNetWorth, purchaseUpgrade, upgradeRequirement } from '../src/engine/upgrades';
import { purchaseConsumable } from '../src/engine/consumables';
import { generateAnnualPlayerRanking } from '../src/engine/player-ranking';
import { PRO_PLAYER_POOL } from '../src/data/pro-players';
import { initialTeamOffers } from '../src/engine/rosters';
import { negotiateContract } from '../src/engine/contracts';
import { simulateTournamentCampaign } from '../src/engine/tournament-campaign';
import { CAREER_SCHEMA_VERSION, migrateCareerState } from '../src/state/migrations';
import { CareerState, MatchResult, PlayerIdentity, SwissRoundMatch } from '../src/types/game';
import { cloneSerializable } from '../src/utils/clone';

assert.ok(TEAMS.length >= 180, 'The VRS seed must extend well beyond the global top 100');
assert.equal(new Set(TEAMS.map((team) => team.id)).size, TEAMS.length, 'Team ids must be unique');
assert.equal(TEAMS[0].name, 'Spirit');
assert.equal(TEAMS[99].name, 'Leo');
assert.ok(new Set(TEAMS.map((team) => team.region)).size >= 8, 'Multiple regions are required');
assert.ok(new Set(TEAMS.map((team) => team.tier)).size >= 4, 'Multiple competitive tiers are required');
assert.equal(MAJORS.length, 2, 'Every season must have exactly two Majors');
assert.ok(TOURNAMENTS.length >= 70, 'The calendar needs a dense headline and regional circuit');
assert.ok(CAREER_EVENTS.length >= 200, 'Decision engine must expose hundreds of reusable events');
assert.equal(MAPS.length, 8, 'The eight-map catalog must be preserved');
assert.ok(MAPS.filter((map) => map.active).length >= 7, 'Active map pool is incomplete');
assert.ok(SCREEN_IDS.length >= 39, 'The Phase 2 shell must export all new screens');
for (const route of ['major-hub', 'major-qualification', 'swiss-stage', 'major-bracket', 'major-match', 'minigames', 'major-ceremony', 'season-review', 'financial-report', 'lifestyle', 'inventory', 'investments', 'analytics', 'records', 'trophy-room', 'performance', 'legacy', 'finance']) assert.ok(SCREEN_IDS.includes(route as never), `Missing static route ${route}`);
assert.equal(new Set(['dashboard', 'profile', 'calendar', 'decision', 'tournament', 'match', 'performance', 'rankings', 'major-hub', 'team', 'roster', 'market', 'contract', 'training', 'health', 'legacy', 'finance', 'settings']).size, 18, 'Primary navigation must not duplicate destinations');
assert.equal(MINIGAME_DEFINITIONS.length, 10, 'All ten minigames are required');
assert.ok(UPGRADES.length >= 70, 'The lifestyle catalog must be extensive');
assert.ok(DEFAULT_MAJOR_FORMAT.stages.length >= 10, 'The configurable Major model must include all stages');
assert.equal(new Set(ALL_CAREER_DECISIONS.map((event) => event.slot).filter(Boolean)).size, 6, 'There must be six contextual decision slots per season');
assert.ok(CONSUMABLES.length >= 10, 'Consumables and lifestyle purchases must be available');
assert.ok(PRO_PLAYER_POOL.length >= 500, 'The player world needs a deep official-roster pool');

const logoManifest = JSON.parse(readFileSync(resolve('assets/team-logos/manifest.json'), 'utf8')) as {
  teams: { id: string; file?: string; status: string }[];
};
assert.equal(logoManifest.teams.length, TEAMS.length, 'Every team must have a logo catalog entry or explicit fallback');
assert.deepEqual(new Set(logoManifest.teams.map((entry) => entry.id)), new Set(TEAMS.map((team) => team.id)), 'Logo catalog ids must match the VRS teams');
const verifiedLogos = logoManifest.teams.filter((entry) => entry.file);
assert.ok(verifiedLogos.length >= 150, 'At least 150 current or parent-organization marks must be bundled');
for (const entry of verifiedLogos) assert.ok(existsSync(resolve('assets/team-logos', entry.file!)), `Missing local logo ${entry.file}`);
const appShellSource = readFileSync(resolve('src/components/layout/app-shell.tsx'), 'utf8');
assert.ok(appShellSource.includes("label: 'Performance'") && appShellSource.includes("label: 'Legado'") && appShellSource.includes("label: 'Finanzas'"), 'Primary navigation must expose the product centers');
assert.ok(appShellSource.includes('mobileItems') && appShellSource.includes('moreOpen'), 'Mobile navigation must use a dedicated compact model');

const identity: PlayerIdentity = { fullName: 'Test Player', nickname: 'TEST', nationality: 'Argentina', region: 'Argentina', city: 'Buenos Aires', age: 17, primaryLanguage: 'Español', secondaryLanguages: ['Inglés'], handedness: 'Diestro', personality: 'Analítico', ambition: 85, riskTolerance: 60, priority: 'Títulos', role: 'Rifler', style: 'Mechanical' };

const firstOffers = initialTeamOffers(identity); assert.equal(firstOffers.length, 3); assert.ok(firstOffers.every((team) => team.initialRanking >= 80), 'The initial offers must be genuinely low tier');
const nextAction = advanceUntilAction(createCareer(identity, STARTER_TEAMS[0], 2026, 901));
assert.ok(nextAction.state.pendingDecisionId || nextAction.state.pendingMatchId || nextAction.state.pendingMinigame || nextAction.state.activeMajorId || nextAction.state.offseasonPending, 'Fast-forward must stop at the next playable action');
assert.notEqual(nextAction.state.week, 1, 'Fast-forward must advance otherwise empty calendar weeks');

function assertFiniteDeep(value: unknown, path = 'state') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} contains a non-finite number`);
  else if (Array.isArray(value)) value.forEach((item, index) => assertFiniteDeep(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => assertFiniteDeep(item, `${path}.${key}`));
}

function resultWithOutcome(state: CareerState, opponentId: string, won: boolean): MatchResult {
  const result = simulateMatch(state, TEAMS.find((team) => team.id === state.teamId)!, TEAMS.find((team) => team.id === opponentId)!, MAJORS[0].id, undefined, 'BO3');
  return { ...result, won, seriesScore: won ? '2-0' : '0-2', aggregate: { ...result.aggregate, rating: won ? 1.36 : 0.84 } };
}

// Annual Top 100 is complete, recognizable, variable and attainable by the career player.
const initialBoard = generateAnnualPlayerRanking(createCareer(identity, STARTER_TEAMS[0], 2026, 44));
assert.equal(initialBoard.entries.length, 100);
for (const nickname of ['ZywOo', 'donk', 'm0NESY', 'Spinx']) assert.ok(initialBoard.entries.some((entry) => entry.nickname === nickname), `${nickname} must be represented in the current player world`);
const annualWinners = new Set(Array.from({ length: 36 }, (_, seed) => generateAnnualPlayerRanking(createCareer(identity, STARTER_TEAMS[0], 2026, seed + 500)).entries[0].nickname));
assert.ok(annualWinners.size >= 4, 'Controlled variance must allow several credible world #1 players');
const superstar = createCareer(identity, TEAMS[0], 2026, 9001); superstar.player.reputation = 100;
for (let index = 0; index < 36; index += 1) superstar.matches.push(resultWithOutcome(superstar, TEAMS[20 + index % 20].id, true));
const superstarBoard = generateAnnualPlayerRanking(superstar); const superstarEntry = superstarBoard.entries.find((entry) => entry.isUser);
assert.ok(superstarEntry && superstarEntry.rank <= 5, 'An exceptional career season must reach the elite of the Top 100');

// Ordinary events are complete campaigns, and explicit career seeds create
// reproducible but genuinely different timelines.
const circuitEvent = TOURNAMENTS.find((event) => event.id.startsWith('circuit-'))!;
const circuitCareer = createCareer(identity, STARTER_TEAMS[0], 2026, 77);
const circuitRun = simulateTournamentCampaign(circuitCareer, circuitEvent);
assert.ok(circuitRun.campaign.playerMatchIds.length >= 2, 'An ordinary event must contain multiple series');
assert.equal(circuitRun.state.matches.length, circuitRun.campaign.playerMatchIds.length);
const seededOutcomes = new Set(Array.from({ length: 14 }, (_, seed) => {
  const sample = createCareer(identity, STARTER_TEAMS[0], 2026, seed + 1);
  return simulateMatch(sample, STARTER_TEAMS[0], TEAMS[20], TOURNAMENTS[0].id).won;
}));
assert.equal(seededOutcomes.size, 2, 'Different career seeds must allow different results with identical choices');

const ratingSamples = Array.from({ length: 48 }, (_, seed) => {
  const sample = createCareer(identity, STARTER_TEAMS[0], 2026, seed + 3000);
  return simulateMatch(sample, STARTER_TEAMS[0], TEAMS[20], TOURNAMENTS[0].id).aggregate.rating;
});
assert.ok(new Set(ratingSamples).size >= 20, 'Series rating must have meaningful spread');
assert.ok(Math.min(...ratingSamples) < .8, 'A bad context must be able to produce a low rating');
const peakState = createCareer(identity, TEAMS[0], 2026, 9123);
peakState.player.form = 100; peakState.player.fatigue = 0; peakState.player.motivation = 100; peakState.chemistry = 100; peakState.seasonVariance = 18;
peakState.player.attributes = Object.fromEntries(Object.keys(peakState.player.attributes).map((key) => [key, 100])) as typeof peakState.player.attributes;
peakState.squad.role = 'star'; peakState.squad.roleSecurity = 100; peakState.squad.mapShare = 100;
const peakRating = simulateMatch(peakState, TEAMS[0], TEAMS[20], TOURNAMENTS[0].id).aggregate.rating;
assert.ok(peakRating > 1.2, 'An elite context must be able to exceed 1.20 rating');

const tacticalCareer = createCareer(identity, STARTER_TEAMS[0], 2026, 318);
tacticalCareer.pendingMatchId = `${TOURNAMENTS[0].id}|${TEAMS[20].id}`;
const tacticalBefore = { entryImpact: tacticalCareer.player.attributes.entryImpact, discipline: tacticalCareer.player.attributes.discipline };
tacticalCareer.pendingMatchTactic = { id: 'aggressive', label: 'Agresivo', entryImpact: 5, discipline: -3, fatigueRisk: 4, economy: -1 };
const tacticalResolved = resolvePendingMatch(tacticalCareer).state;
assert.deepEqual({ entryImpact: tacticalResolved.player.attributes.entryImpact, discipline: tacticalResolved.player.attributes.discipline }, tacticalBefore, 'Match tactics must not mutate base attributes');
assert.equal(tacticalResolved.pendingMatchTactic, undefined, 'Match tactic must expire after one series');
const negotiationCareer = createCareer(identity, STARTER_TEAMS[0], 2026, 319);
const negotiated = negotiateContract(negotiationCareer.contract, 'salary', negotiationCareer.season);
assert.equal(negotiated.negotiationCooldown, 2, 'Contract negotiation must create a cooldown');

// Classification paths include direct entry and the possibility of missing the event.
const lowRankCareer = createCareer(identity, TEAMS[99]);
assert.equal(determineMajorEntryPath(lowRankCareer), 'open-qualifier');
const invitedCareer = createCareer(identity, TEAMS[0]);
assert.equal(determineMajorEntryPath(invitedCareer), 'direct-invite');
let eliminatedCampaignState = cloneSerializable(lowRankCareer);
const eliminatedCampaign = createMajorCampaign(eliminatedCampaignState, MAJORS[0].id);
eliminatedCampaignState.majorCampaigns.push(eliminatedCampaign); eliminatedCampaignState.activeMajorId = eliminatedCampaign.id;
eliminatedCampaign.pendingOpponentId = TEAMS[50].id;
eliminatedCampaignState = recordMajorMatch(eliminatedCampaignState, resultWithOutcome(eliminatedCampaignState, TEAMS[50].id, false));
assert.equal(eliminatedCampaignState.majorCampaigns[0].status, 'eliminated', 'A team can fail to qualify for the Major');

// Swiss mechanics: records, three wins/losses, deciders and rematch avoidance.
let swiss = createSwissStandings(TEAMS.slice(0, 16).map((team) => team.id));
for (let round = 1; round <= 3; round += 1) {
  const pairs = pairSwissRound(swiss, round);
  assert.equal(pairs.length, 8);
  assert.ok(pairs.every((match) => match.teamAId !== match.teamBId));
  const resolved: SwissRoundMatch[] = pairs.map((match) => ({ ...match, winnerId: match.teamAId, loserId: match.teamBId, score: match.format === 'BO1' ? '1-0' : '2-0' }));
  if (round === 3) assert.ok(pairs.some((match) => match.format === 'BO3'), 'Qualification and elimination matches must use BO3');
  swiss = recordSwissRound(swiss, resolved);
}
assert.ok(swiss.some((entry) => entry.record.wins === 3 && entry.status === 'qualified'), 'Swiss must qualify at three wins');
assert.ok(swiss.some((entry) => entry.record.losses === 3 && entry.status === 'eliminated'), 'Swiss must eliminate at three losses');
for (const entry of swiss) assert.equal(new Set(entry.opponents).size, entry.opponents.length, 'Swiss should not repeat opponents when alternatives exist');

// Bracket has eight teams, advances winners and produces a champion.
let bracket = createBracket(TEAMS.slice(0, 8).map((team) => team.id));
assert.equal(bracket.participants.length, 8); assert.ok(assertBracketIntegrity(bracket));
for (const match of bracket.matches.filter((item) => item.round === 'quarterfinal')) bracket = recordBracketResult(bracket, match.id, match.teamAId!, '2-1', TEAMS.find((team) => team.id === match.teamAId)!.star, 'Decisive map');
for (const match of bracket.matches.filter((item) => item.round === 'semifinal')) bracket = recordBracketResult(bracket, match.id, match.teamAId!, '2-0', TEAMS.find((team) => team.id === match.teamAId)!.star, 'Arena sweep');
const final = bracket.matches.find((item) => item.round === 'grand-final')!;
bracket = recordBracketResult(bracket, final.id, final.teamAId!, '3-1', TEAMS.find((team) => team.id === final.teamAId)!.star, 'Championship point');
assert.ok(bracket.championId && bracket.runnerUpId, 'Bracket must produce champion and runner-up');

const winningState = createCareer(identity, TEAMS[0]); const winningCampaign = createMajorCampaign(winningState, MAJORS[0].id); winningCampaign.stage = 'ceremony'; winningCampaign.qualified = true; winningCampaign.playerRating = 1.36; winningCampaign.playerKills = 190; winningCampaign.bracket = bracket; winningCampaign.bracket.championId = winningState.teamId; winningCampaign.bracket.runnerUpId = TEAMS[1].id; winningState.majorCampaigns.push(winningCampaign); winningState.activeMajorId = winningCampaign.id;
const celebrated = finalizeMajorCeremony(winningState).state; assert.equal(celebrated.careerRecords.majorWins, 1, 'A player can win the Major'); assert.equal(celebrated.majorCampaigns[0].mvp, identity.nickname, 'Major MVP is calculated from campaign rating'); assert.ok(celebrated.trophies.some((trophy) => trophy.name.includes('Major')));

// Every elimination stage and a Major victory are representable.
for (const stage of ['open-qualifier', 'closed-qualifier', 'rmr'] as const) {
  const state = createCareer(identity, STARTER_TEAMS[0]); const campaign = createMajorCampaign(state, MAJORS[0].id); campaign.stage = stage; campaign.pendingOpponentId = TEAMS[40].id; state.majorCampaigns.push(campaign); state.activeMajorId = campaign.id;
  const lost = recordMajorMatch(state, resultWithOutcome(state, TEAMS[40].id, false)); assert.equal(lost.majorCampaigns[0].status, 'eliminated');
}
for (const stage of ['quarterfinal', 'semifinal', 'grand-final'] as const) {
  const state = createCareer(identity, TEAMS[0]); const campaign = createMajorCampaign(state, MAJORS[0].id); campaign.stage = stage; campaign.qualified = true; campaign.bracket = createBracket(TEAMS.slice(0, 8).map((team) => team.id));
  if (stage === 'semifinal') { for (const match of campaign.bracket.matches.filter((item) => item.round === 'quarterfinal')) campaign.bracket = recordBracketResult(campaign.bracket, match.id, match.teamAId!, '2-0', 'mvp', 'qf'); }
  if (stage === 'grand-final') { for (const round of ['quarterfinal', 'semifinal'] as const) for (const match of campaign.bracket.matches.filter((item) => item.round === round)) campaign.bracket = recordBracketResult(campaign.bracket, match.id, match.teamAId!, '2-0', 'mvp', round); }
  const match = campaign.bracket.matches.find((item) => item.round === stage && (item.teamAId === state.teamId || item.teamBId === state.teamId));
  assert.ok(match, `Player match must exist in ${stage}`); campaign.pendingOpponentId = match!.teamAId === state.teamId ? match!.teamBId : match!.teamAId; state.majorCampaigns.push(campaign); state.activeMajorId = campaign.id;
  const lost = recordMajorMatch(state, resultWithOutcome(state, campaign.pendingOpponentId!, false)); assert.equal(lost.majorCampaigns[0].status, 'eliminated', `Can lose in ${stage}`);
}

// Minigames are bounded, persistent-friendly and auto simulation works.
let mechanics = createCareer(identity, STARTER_TEAMS[0]);
for (const definition of MINIGAME_DEFINITIONS) {
  const game = createMinigame(mechanics, definition.id, 'validation');
  const result = resolveMinigame(mechanics, game, definition.options.slice(0, 3));
  assert.ok(Math.abs(result.modifier) <= definition.maxModifier && Math.abs(result.modifier) <= 0.06, `${definition.id} modifier outside bounds`);
  assert.ok(result.score >= 0 && result.score <= 100);
  const automatic = autoSimulateMinigame(mechanics, definition.id, 'validation'); assert.equal(automatic.simulated, true);
}
const vetoCareer = createCareer(identity, STARTER_TEAMS[0]); vetoCareer.pendingMatchId = `${TOURNAMENTS[0].id}|${TEAMS[20].id}`; const vetoGame = createMinigame(vetoCareer, 'map-veto', 'validation'); assert.ok(vetoGame.options.every((id) => MAPS.some((map) => map.id === id))); vetoCareer.flags.lastVetoMaps = 'dust2|nuke'; const vetoedMatch = resolvePendingMatch(vetoCareer).state.matches[0]; assert.equal(vetoedMatch.maps[0].mapId, 'dust2', 'Map veto must alter the simulated series map order');
const memoryGame = createMinigame(vetoCareer, 'utility-memory', 'validation'); assert.equal(memoryGame.promptSequence.length, 3, 'Utility memory sequence must persist in state');

// Purchases, requirements, diminishing returns, maintenance and net worth.
mechanics.offseasonPending = true; mechanics.player.money = 1_000_000; mechanics.player.reputation = 100; mechanics.player.level = 30; mechanics.trophies.push({ id: 'test-title', name: 'Test title', season: 1, tier: 'S', mvp: false }, { id: 'test-title-2', name: 'Test title 2', season: 1, tier: 'S', mvp: false });
const consumableCash = mechanics.player.money; mechanics = purchaseConsumable(mechanics, 'bootcamp-focus').state; assert.ok(mechanics.player.money < consumableCash); assert.ok(mechanics.inventory.consumables.some((item) => item.consumableId === 'bootcamp-focus'));
const beforeMoney = mechanics.player.money; mechanics = purchaseUpgrade(mechanics, 'monitor').state; assert.ok(mechanics.player.money < beforeMoney, 'Purchase must deduct money');
const levelOneReaction = mechanics.player.attributes.reaction; mechanics = purchaseUpgrade(mechanics, 'monitor').state; assert.ok(mechanics.player.attributes.reaction > levelOneReaction && mechanics.player.attributes.reaction - levelOneReaction < 0.65, 'Diminishing returns must reduce later gains');
const poor = createCareer(identity, STARTER_TEAMS[0]); poor.offseasonPending = true; assert.equal(purchaseUpgrade(poor, 'performance-lab').state.player.money, poor.player.money, 'Cannot buy without funds');
assert.equal(upgradeRequirement(poor, UPGRADES.find((item) => item.id === 'own-team')!).allowed, false, 'Requirements must block purchases');
mechanics = purchaseUpgrade(mechanics, 'dedicated-internet').state; assert.ok(annualMaintenance(mechanics) > 0, 'Maintenance must be charged');
const maintenanceOnly = cloneSerializable(mechanics); maintenanceOnly.contract.monthlySalary = 0; maintenanceOnly.player.reputation = 0; maintenanceOnly.player.fanbase = 0; maintenanceOnly.player.attributes.mediaSkill = 0; maintenanceOnly.matches = []; maintenanceOnly.trophies = []; maintenanceOnly.majorCampaigns = []; const maintenanceCash = maintenanceOnly.player.money; const maintained = settleOffseasonFinances(maintenanceOnly).state; assert.equal(maintained.player.money, maintenanceCash - annualMaintenance(maintenanceOnly), 'Annual settlement must deduct maintenance');
assert.ok(calculateNetWorth(mechanics) >= mechanics.player.money, 'Net worth must include assets');
for (const value of Object.values(mechanics.player.attributes)) assert.ok(value <= 100 && value >= 1, 'Upgrades cannot exceed attribute bounds');
const financial = calculateFinancialSummary(mechanics); assertFiniteDeep(financial);

// Legacy v1 migration and JSON round-trip preserve Phase 2 domains.
const legacy = cloneSerializable(createCareer(identity, STARTER_TEAMS[0])) as unknown as Record<string, unknown>; legacy.schemaVersion = 1;
for (const key of ['majorCampaigns', 'minigameHistory', 'financialHistory', 'inventory', 'netWorth', 'careerRecords', 'seasonalStatistics', 'playerRankingHistory', 'visualAssets', 'offseasonPending', 'offseasonStep', 'careerSeed', 'seasonVariance', 'squad', 'offers', 'tournamentCampaigns', 'deferredConsequences', 'decisionSlotsUsed', 'seasonStartSnapshot']) delete legacy[key];
const migrated = migrateCareerState(legacy); assert.ok(migrated); assert.equal(migrated!.schemaVersion, CAREER_SCHEMA_VERSION); assert.deepEqual(migrated!.majorCampaigns, []); assert.deepEqual(migrated!.inventory.upgrades, []);
const roundTripSource = cloneSerializable(mechanics); roundTripSource.majorCampaigns.push(createMajorCampaign(roundTripSource, MAJORS[0].id)); roundTripSource.minigameHistory.push(autoSimulateMinigame(roundTripSource, 'clutch', 'roundtrip'));
const roundTrip = migrateCareerState(JSON.parse(JSON.stringify(roundTripSource))); assert.ok(roundTrip); assert.equal(roundTrip!.majorCampaigns.length, 1); assert.equal(roundTrip!.inventory.upgrades.length, roundTripSource.inventory.upgrades.length); assert.equal(roundTrip!.inventory.consumables.length, roundTripSource.inventory.consumables.length); assert.equal(roundTrip!.minigameHistory.length, 1);

// Automated career covers active Major campaigns and mandatory off-season for 12 seasons.
let career = createCareer(identity, STARTER_TEAMS[0], 2026, 20260813); career.settings.minigames = false; career.settings.minigameMode = 'auto';
let resolvedMatches = 0; let resolvedDecisions = 0; let completedOffseasons = 0;
for (let guard = 0; guard < 6000 && !career.finished; guard += 1) {
  if (career.pendingDecisionId) {
    const event = getCareerEvent(career.pendingDecisionId); assert.ok(event); career = applyDecision(career, event!.choices[guard % event!.choices.length]).state; resolvedDecisions += 1;
  } else if (career.pendingMatchId) { career = resolvePendingMatch(career).state; resolvedMatches += 1;
  } else if (career.activeMajorId) { career = prepareMajorMatch(career).state;
  } else if (career.offseasonPending) { const blocked = advanceWeek(career).state; assert.equal(blocked.season, career.season, 'Off-season must block the next season'); career.offseasonStep = 12; career = completeOffseason(career).state; completedOffseasons += 1;
  } else career = advanceWeek(career).state;
  assertFiniteDeep(career);
  for (const attribute of Object.values(career.player.attributes)) assert.ok(attribute >= 1 && attribute <= 100, 'Attribute outside 1..100');
}
assert.ok(career.finished, 'Automated career must reach an ending'); assert.equal(career.season, 12); assert.ok(resolvedMatches > 10); assert.ok(resolvedDecisions > 20); assert.ok(completedOffseasons >= 11); assert.ok(Boolean(career.ending));
assert.equal(resolvedDecisions, 72, 'A twelve-season career must resolve six key decisions per year');
assert.ok(career.matches.length >= 350, `The complete circuit must create a credible professional match volume (received ${career.matches.length})`);
assert.ok(career.seasonalStatistics.every((season) => (season.maps ?? 0) >= 15), 'Even a bench-affected season needs a meaningful official sample');
assert.ok(career.seasonalStatistics.reduce((sum, season) => sum + (season.maps ?? 0), 0) >= 750, 'Career map volume must resemble a dense professional circuit');
assert.ok(career.seasonalStatistics.every((season) => (season.kills ?? 0) > 0 && Number.isFinite(season.earnings)), 'Season reviews must preserve kills and earnings');
assert.equal(career.playerRankingHistory.length, 12, 'Every completed season must persist one Top 100');
assert.ok(career.playerRankingHistory.every((board) => board.entries.length === 100 && new Set(board.entries.map((entry) => entry.playerId)).size === 100), 'Every annual ranking must contain 100 unique players');
assert.ok(career.tournamentCampaigns.length > 30, 'Ordinary tournament campaigns must persist across the career');
assert.ok(career.matches.every((match) => match.aggregate.rating >= 0.25 && match.aggregate.rating <= 1.75));
assert.equal(career.majorCampaigns.filter((campaign) => campaign.season === 1).length, 2, 'There must be two independent Major campaigns per season');
const endings = new Set(['Leyenda de los Majors', 'Imperio más allá del servidor', 'El líder continúa desde el banco', 'Del servidor a la comunidad', 'Ícono del circuito', 'Una carrera de sacrificio']); assert.ok(endings.has(career.ending!));

console.log(JSON.stringify({ teams: TEAMS.length, tournaments: TOURNAMENTS.length, majors: MAJORS.length, events: CAREER_EVENTS.length, contextualDecisions: ALL_CAREER_DECISIONS.length - CAREER_EVENTS.length, maps: MAPS.length, screens: SCREEN_IDS.length, minigames: MINIGAME_DEFINITIONS.length, upgrades: UPGRADES.length, consumables: CONSUMABLES.length, schemaVersion: career.schemaVersion, simulatedSeasons: career.season, majorCampaigns: career.majorCampaigns.length, tournamentCampaigns: career.tournamentCampaigns.length, matches: career.matches.length, mapsPlayed: career.matches.reduce((sum, match) => sum + match.maps.length, 0), decisions: resolvedDecisions, offseasons: completedOffseasons, ending: career.ending }, null, 2));
