import assert from 'node:assert/strict';

import { CAREER_EVENTS } from '../src/data/events';
import { MAPS } from '../src/data/maps';
import { STARTER_TEAMS, TEAMS } from '../src/data/teams';
import { MAJORS, TOURNAMENTS } from '../src/data/tournaments';
import { advanceWeek, applyDecision, createCareer, resolvePendingMatch } from '../src/engine/season';
import { getCareerEvent } from '../src/data/events';
import { PlayerIdentity } from '../src/types/game';
import { SCREEN_IDS } from '../src/constants/routes';

assert.equal(TEAMS.length, 100, 'The VRS seed must contain exactly the global top 100');
assert.equal(new Set(TEAMS.map((team) => team.id)).size, 100, 'Team ids must be unique');
assert.equal(TEAMS[0].name, 'Spirit');
assert.equal(TEAMS[99].name, 'Leo');
assert.ok(new Set(TEAMS.map((team) => team.region)).size >= 8, 'Multiple regions are required');
assert.ok(new Set(TEAMS.map((team) => team.tier)).size >= 4, 'Multiple competitive tiers are required');
assert.equal(MAJORS.length, 2, 'Every season must have exactly two Majors');
assert.ok(TOURNAMENTS.length >= 25, 'The calendar needs a dense tournament circuit');
assert.ok(CAREER_EVENTS.length >= 200, 'Decision engine must expose hundreds of reusable events');
assert.ok(MAPS.filter((map) => map.active).length >= 7, 'Active map pool is incomplete');
assert.equal(SCREEN_IDS.length, 24, 'The career shell must expose 24 screens plus player creation');

const identity: PlayerIdentity = { fullName: 'Test Player', nickname: 'TEST', nationality: 'Argentina', region: 'Argentina', city: 'Buenos Aires', age: 17, primaryLanguage: 'Español', secondaryLanguages: ['Inglés'], handedness: 'Diestro', personality: 'Analítico', ambition: 85, riskTolerance: 60, priority: 'Títulos', role: 'Rifler', style: 'Mechanical' };
let career = createCareer(identity, STARTER_TEAMS[0]);
let resolvedMatches = 0;
let resolvedDecisions = 0;

function assertFiniteDeep(value: unknown, path = 'state') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} contains a non-finite number`);
  else if (Array.isArray(value)) value.forEach((item, index) => assertFiniteDeep(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => assertFiniteDeep(item, `${path}.${key}`));
}

for (let guard = 0; guard < 2000 && !career.finished; guard += 1) {
  if (career.pendingDecisionId) {
    const event = getCareerEvent(career.pendingDecisionId);
    assert.ok(event, 'Pending decision must resolve to a valid event');
    career = applyDecision(career, event!.choices[guard % event!.choices.length]).state;
    resolvedDecisions += 1;
  } else if (career.pendingMatchId) {
    career = resolvePendingMatch(career).state;
    resolvedMatches += 1;
  } else {
    career = advanceWeek(career).state;
  }
  assertFiniteDeep(career);
  for (const attribute of Object.values(career.player.attributes)) assert.ok(attribute >= 1 && attribute <= 100, 'Attribute outside 1..100');
  assert.ok(career.player.fatigue >= 0 && career.player.fatigue <= 100);
  assert.ok(career.chemistry >= 0 && career.chemistry <= 100);
}

assert.ok(career.finished, 'Automated career must reach an ending');
assert.ok(resolvedMatches > 10, 'Career must include a meaningful number of matches');
assert.ok(resolvedDecisions > 20, 'Career must include recurring decisions');
assert.ok(Boolean(career.ending), 'Finished career must have an ending');
assert.ok(career.matches.every((match) => match.aggregate.rating >= 0.35 && match.aggregate.rating <= 2.1), 'Match ratings outside valid bounds');

console.log(JSON.stringify({ teams: TEAMS.length, tournaments: TOURNAMENTS.length, majors: MAJORS.length, events: CAREER_EVENTS.length, maps: MAPS.length, simulatedSeasons: career.season, matches: resolvedMatches, decisions: resolvedDecisions, ending: career.ending }, null, 2));
