import { ATTRIBUTE_LABELS } from '@/data/roles';
import { AttributeKey, CareerState, PlayerAttributes, TrainingActivity } from '@/types/game';
import { cloneSerializable } from '@/utils/clone';

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
export const clampAttributes = (attributes: PlayerAttributes) => Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, clamp(value, 1, 100)])) as PlayerAttributes;

export function overallRating(attributes: PlayerAttributes) {
  const core: AttributeKey[] = ['aim', 'reaction', 'gameSense', 'positioning', 'consistency', 'mentalStrength', 'communication', 'teamChemistry'];
  return Math.round(core.reduce((sum, key) => sum + attributes[key], 0) / core.length);
}

export function xpForLevel(level: number) { return 450 + level * 175; }

export function addXp(state: CareerState, amount: number): CareerState {
  const next = cloneSerializable(state);
  next.player.xp += Math.max(0, amount);
  return processLevelUps(next);
}

export function processLevelUps(state: CareerState): CareerState {
  const next = cloneSerializable(state);
  while (next.player.xp >= xpForLevel(next.player.level)) {
    next.player.xp -= xpForLevel(next.player.level);
    next.player.level += 1;
    next.player.trainingPoints += 3;
  }
  return next;
}

export function calculateFatigue(hours: number, travel = 0, restQuality = 50) {
  return clamp(Math.round(hours * 1.8 + travel * 0.8 - restQuality * 0.18), -20, 35);
}

export function calculateChemistry(communication: number, teamChemistry: number, roleFit: number, rosterStability: number, conflictPenalty = 0) {
  return clamp(Math.round(communication * 0.25 + teamChemistry * 0.3 + roleFit * 0.2 + rosterStability * 0.25 - conflictPenalty));
}

export function calculateMarketValue(state: CareerState) {
  const rating = overallRating(state.player.attributes);
  const ageFactor = state.player.identity.age <= 25 ? 1.2 : Math.max(0.55, 1.15 - (state.player.identity.age - 25) * 0.07);
  const performance = state.matches.slice(-12).reduce((sum, match) => sum + match.aggregate.rating, 0) / Math.max(1, state.matches.slice(-12).length);
  const titles = state.trophies.length * 90000;
  return Math.round(Math.max(15000, (rating ** 2 * 110 + performance * 180000 + state.player.reputation * 5500 + titles) * ageFactor));
}

export function trainingAvailability(state: CareerState, activity: TrainingActivity) {
  const missingPoints = Math.max(0, activity.pointCost - state.player.trainingPoints);
  const missingMoney = Math.max(0, activity.moneyCost - state.player.money);
  const saturation = state.player.fatigue > 80 || state.player.burnout > 75 ? 0.45 : state.player.fatigue > 60 ? 0.7 : 1;
  const projectedGain = Math.max(1, Math.round(activity.gains * saturation));
  const available = !state.finished && missingPoints === 0 && missingMoney === 0;
  const reason = state.finished
    ? 'La carrera ya terminó.'
    : missingPoints > 0
      ? `Faltan ${missingPoints} TP.`
      : missingMoney > 0
        ? `Faltan $${missingMoney.toLocaleString('en-US')}.`
        : `Usar ${activity.pointCost} TP${activity.moneyCost ? ` + $${activity.moneyCost.toLocaleString('en-US')}` : ''}`;
  return { available, missingPoints, missingMoney, projectedGain, saturation, reason };
}

export function applyTraining(state: CareerState, activity: TrainingActivity): { state: CareerState; message: string } {
  const availability = trainingAvailability(state, activity);
  if (!availability.available) return { state, message: availability.reason };
  const next = cloneSerializable(state);
  next.player.trainingPoints -= activity.pointCost;
  next.player.money -= activity.moneyCost;
  next.player.fatigue = clamp(next.player.fatigue + activity.fatigue);
  next.player.burnout = clamp(next.player.burnout + activity.burnout);
  for (const key of activity.attributes) next.player.attributes[key] = clamp(next.player.attributes[key] + availability.projectedGain, 1, 100);
  next.player.xp += 80 + activity.attributes.length * 20;
  next.updatedAt = new Date().toISOString();
  return { state: processLevelUps(next), message: `${activity.name}: -${activity.pointCost} TP${activity.moneyCost ? ` · -$${activity.moneyCost.toLocaleString('en-US')}` : ''}. Mejoraste ${activity.attributes.map((key) => ATTRIBUTE_LABELS[key]).join(', ')}.` };
}
