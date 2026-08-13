import { CareerState, MinigameDefinition, MinigameId, MinigameResult, MinigameState } from '@/types/game';
import { clamp } from './progression';
import { pick, rngFor } from './random';

export const MINIGAME_DEFINITIONS: MinigameDefinition[] = [
  { id: 'clutch', name: 'Clutch 1vX', description: 'Leé la pista, elegí posición y encadená una decisión de cierre.', attributeKeys: ['clutch', 'gameSense', 'aim', 'mentalStrength'], timeLimitSeconds: 18, options: ['peek', 'fake', 'plant', 'tap', 'save'], maxModifier: 0.06 },
  { id: 'map-veto', name: 'Map Veto', description: 'Baneá la fortaleza rival y llevá la serie a tu map pool.', attributeKeys: ['mapKnowledge', 'readingOpponents', 'leadership'], options: ['ban-rival', 'pick-comfort', 'pick-counter', 'side-ct', 'side-t'], maxModifier: 0.055 },
  { id: 'round-buy', name: 'Compra de ronda', description: 'Equilibrá economía, armas, utility y drops.', attributeKeys: ['gameSense', 'discipline', 'teamChemistry'], timeLimitSeconds: 16, options: ['full-buy', 'force', 'eco', 'half-buy', 'awp', 'utility', 'drop', 'save'], maxModifier: 0.04 },
  { id: 'tactical-timeout', name: 'Timeout táctico', description: 'Diagnosticá el problema y cambiá el ritmo de la serie.', attributeKeys: ['leadership', 'communication', 'readingOpponents'], options: ['fix-defense', 'change-pace', 'attack-site', 'give-confidence', 'calm-down', 'change-roles'], maxModifier: 0.045 },
  { id: 'retake-save', name: 'Retake o Save', description: 'Decidí con tiempo, utility, economía y jugadores vivos.', attributeKeys: ['gameSense', 'discipline', 'clutch'], timeLimitSeconds: 14, options: ['retake-fast', 'retake-contact', 'save', 'exit-frags'], maxModifier: 0.04 },
  { id: 'peek-timing', name: 'Timing de Peek', description: 'Presioná dentro de la ventana perfecta sin regalar el duelo.', attributeKeys: ['reaction', 'aim', 'movement'], timeLimitSeconds: 8, options: ['early', 'perfect', 'late'], maxModifier: 0.05 },
  { id: 'utility-memory', name: 'Utility Memory', description: 'Recordá la secuencia correcta de smokes, flashes y molotovs.', attributeKeys: ['utilityUsage', 'smokeLineups', 'grenadeTiming'], timeLimitSeconds: 20, options: ['smoke', 'flash', 'molotov', 'he'], maxModifier: 0.04 },
  { id: 'minimap-read', name: 'Lectura de minimapa', description: 'Reconstruí posiciones y elegí la rotación correcta.', attributeKeys: ['gameSense', 'mapKnowledge', 'leadership'], timeLimitSeconds: 16, options: ['rotate', 'stack', 'fake', 'hold'], maxModifier: 0.045 },
  { id: 'spray-control', name: 'Spray Control', description: 'Seguí el patrón táctil y controlá la transferencia.', attributeKeys: ['sprayControl', 'aim', 'movement'], timeLimitSeconds: 10, options: ['pull-down', 'counter-left', 'counter-right', 'burst-reset'], maxModifier: 0.05 },
  { id: 'overtime-decision', name: 'Overtime Decision', description: 'Definí plan, economía y jugador clave para el overtime.', attributeKeys: ['mentalStrength', 'leadership', 'consistency'], timeLimitSeconds: 22, options: ['ct-aggressive', 'ct-passive', 't-contact', 't-execute', 'save-awp', 'back-star'], maxModifier: 0.06 },
];

export const getMinigameDefinition = (id: MinigameId) => MINIGAME_DEFINITIONS.find((item) => item.id === id) ?? MINIGAME_DEFINITIONS[0];

export function shouldRunMinigame(state: CareerState, isMajor: boolean, important: boolean) {
  if (!state.settings.minigames || state.settings.minigameMode === 'auto') return false;
  if (state.settings.minigameMode === 'majors') return isMajor;
  if (state.settings.minigameMode === 'important') return important;
  if (state.settings.minigameMode === 'key-decisions') return isMajor || important;
  return true;
}

export function createMinigame(state: CareerState, definitionId: MinigameId, matchContext: string, majorCampaignId?: string): MinigameState {
  return { id: `mini-${state.season}-${state.minigameHistory.length + 1}`, definitionId, majorCampaignId, matchContext, difficulty: state.settings.minigameDifficulty, step: 0, choices: [], score: 0, startedAt: new Date().toISOString() };
}

function expectedChoices(game: MinigameState, count: number) {
  const definition = getMinigameDefinition(game.definitionId);
  const random = rngFor(game.id, game.matchContext, game.difficulty);
  return Array.from({ length: count }, () => pick(random, definition.options));
}

export function resolveMinigame(state: CareerState, game: MinigameState, choices: string[], simulated = false): MinigameResult {
  const definition = getMinigameDefinition(game.definitionId);
  const steps = game.definitionId === 'clutch' || game.definitionId === 'overtime-decision' || game.definitionId === 'utility-memory' || game.definitionId === 'spray-control' ? 3 : 2;
  const selected = choices.slice(0, steps);
  const expected = expectedChoices(game, steps);
  const accuracy = selected.reduce((score, choice, index) => score + (choice === expected[index] ? 1 : definition.options.indexOf(choice) % 3 === definition.options.indexOf(expected[index]) % 3 ? 0.55 : 0.2), 0) / steps;
  const attribute = definition.attributeKeys.reduce((sum, key) => sum + state.player.attributes[key], 0) / definition.attributeKeys.length;
  const difficultyPenalty = game.difficulty === 'hard' ? 12 : game.difficulty === 'easy' ? -8 : 0;
  const condition = state.player.attributes.confidence * 0.08 - state.player.pressure * 0.07 - state.player.fatigue * 0.06;
  const score = Math.round(clamp(accuracy * 70 + attribute * 0.28 + condition - difficultyPenalty, 0, 100));
  const normalized = (score - 50) / 50;
  const modifier = Math.round(clamp(normalized * definition.maxModifier, -definition.maxModifier, definition.maxModifier) * 1000) / 1000;
  return { id: game.id, definitionId: game.definitionId, season: state.season, score, success: score >= 58, modifier, choices: selected, explanation: `${definition.name}: ${score}/100. ${score >= 75 ? 'Lectura excelente' : score >= 58 ? 'Decisión favorable' : score >= 40 ? 'Impacto neutro' : 'La ejecución cedió una ventaja moderada'}. Modificador ${(modifier * 100).toFixed(1)}%.`, simulated, createdAt: new Date().toISOString() };
}

export function autoSimulateMinigame(state: CareerState, definitionId: MinigameId, matchContext: string, majorCampaignId?: string) {
  const game = createMinigame(state, definitionId, matchContext, majorCampaignId);
  const steps = definitionId === 'clutch' || definitionId === 'overtime-decision' || definitionId === 'utility-memory' || definitionId === 'spray-control' ? 3 : 2;
  const random = rngFor(game.id, 'auto');
  const definition = getMinigameDefinition(definitionId);
  const choices = Array.from({ length: steps }, () => pick(random, definition.options));
  return resolveMinigame(state, game, choices, true);
}

export function minigameStatistics(history: MinigameResult[]) {
  const played = history.length;
  return {
    played,
    successRate: played ? history.filter((item) => item.success).length / played * 100 : 0,
    bestScore: played ? Math.max(...history.map((item) => item.score)) : 0,
    historicalScore: history.reduce((sum, item) => sum + item.score, 0),
    clutches: history.filter((item) => item.definitionId === 'clutch' && item.success).length,
    vetos: history.filter((item) => item.definitionId === 'map-veto' && item.success).length,
    economy: history.filter((item) => item.definitionId === 'round-buy' && item.success).length,
    timeouts: history.filter((item) => item.definitionId === 'tactical-timeout' && item.success).length,
  };
}
