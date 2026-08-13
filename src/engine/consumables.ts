import { getConsumable } from '@/data/consumables';
import { CareerState } from '@/types/game';
import { cloneSerializable } from '@/utils/clone';
import { clamp } from './progression';

export function activeConsumableModifier(state: CareerState) {
  return state.inventory.consumables.reduce((total, owned) => {
    const item = getConsumable(owned.consumableId);
    return total + (owned.remainingWeeks > 0 ? item?.performanceModifier ?? 0 : 0);
  }, 0);
}

export function purchaseConsumable(state: CareerState, consumableId: string) {
  const item = getConsumable(consumableId);
  if (!item) return { state, message: 'Consumible inexistente.' };
  if (!state.offseasonPending) return { state, message: 'Los consumibles se planifican durante el off-season.' };
  if (state.player.money < item.price) return { state, message: 'Fondos insuficientes para esta compra.' };
  const next = cloneSerializable(state);
  next.player.money -= item.price;
  next.player.reputation = clamp(next.player.reputation + item.reputation);
  next.player.fanbase = clamp(next.player.fanbase + item.fanbase);
  next.player.motivation = clamp(next.player.motivation + item.motivation);
  next.player.fatigue = clamp(next.player.fatigue - item.fatigueRecovery);
  next.inventory.consumables.push({ id: `${consumableId}-${next.season}-${next.inventory.consumables.length + 1}`, consumableId, purchasedSeason: next.season, remainingWeeks: item.durationWeeks });
  next.news.unshift(`${next.player.identity.nickname} incorpora ${item.name} a su plan personal.`);
  return { state: next, message: `${item.name} comprado por $${item.price.toLocaleString('en-US')}.` };
}

export function tickConsumables(state: CareerState) {
  const next = cloneSerializable(state);
  next.inventory.consumables = next.inventory.consumables.map((owned) => ({ ...owned, remainingWeeks: Math.max(0, owned.remainingWeeks - 1) }));
  return next;
}

