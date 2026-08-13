import { getUpgrade } from '@/data/upgrades';
import { AttributeKey, CareerState, OwnedUpgrade, UpgradeDefinition } from '@/types/game';
import { cloneSerializable } from '@/utils/clone';
import { clamp } from './progression';

export function upgradePrice(definition: UpgradeDefinition, currentLevel: number) {
  return Math.round(definition.basePrice * 1.65 ** currentLevel);
}

export function upgradeRequirement(state: CareerState, definition: UpgradeDefinition) {
  const owned = state.inventory.upgrades.find((item) => item.upgradeId === definition.id);
  const level = owned?.level ?? 0;
  const price = upgradePrice(definition, level);
  if (!state.offseasonPending) return { allowed: false, reason: 'Las compras se habilitan durante el off-season.', price, level };
  if (level >= definition.maxLevel) return { allowed: false, reason: 'Nivel máximo alcanzado.', price, level };
  if (state.player.money < price) return { allowed: false, reason: 'Fondos insuficientes.', price, level };
  if (state.player.reputation < definition.requiredReputation) return { allowed: false, reason: `Requiere ${definition.requiredReputation} de reputación.`, price, level };
  if (state.player.level < definition.requiredLevel) return { allowed: false, reason: `Requiere nivel ${definition.requiredLevel}.`, price, level };
  if (state.trophies.length < definition.requiredTitles) return { allowed: false, reason: `Requiere ${definition.requiredTitles} título(s).`, price, level };
  return { allowed: true, reason: 'Disponible', price, level };
}

export function benefitAtLevel(base: number, level: number) {
  return base / Math.max(1, (level + 1) ** 0.62);
}

export function purchaseUpgrade(state: CareerState, upgradeId: string): { state: CareerState; message: string } {
  const definition = getUpgrade(upgradeId);
  if (!definition) return { state, message: 'La mejora no existe.' };
  const check = upgradeRequirement(state, definition);
  if (!check.allowed) return { state, message: check.reason };
  const next = cloneSerializable(state);
  next.player.money -= check.price;
  let owned = next.inventory.upgrades.find((item) => item.upgradeId === definition.id);
  if (!owned) {
    owned = { upgradeId: definition.id, level: 0, acquiredSeason: next.season, purchasePrice: 0 };
    next.inventory.upgrades.push(owned);
  }
  owned.level += 1;
  owned.purchasePrice += check.price;
  next.inventory.purchaseHistory.push({ id: `purchase-${definition.id}-${next.season}-${next.inventory.purchaseHistory.length + 1}`, upgradeId: definition.id, season: next.season, price: check.price, level: owned.level });
  for (const [key, raw] of Object.entries(definition.benefits)) {
    if (key in next.player.attributes) next.player.attributes[key as AttributeKey] = clamp(next.player.attributes[key as AttributeKey] + benefitAtLevel(raw ?? 0, check.level), 1, 100);
  }
  if (definition.benefits.motivation) next.player.motivation = clamp(next.player.motivation + benefitAtLevel(definition.benefits.motivation, check.level));
  if (definition.benefits.fanbase) next.player.fanbase = clamp(next.player.fanbase + benefitAtLevel(definition.benefits.fanbase, check.level));
  if (definition.category === 'housing' && !next.inventory.properties.some((item) => item.upgradeId === definition.id)) next.inventory.properties.push({ id: `property-${definition.id}-${next.season}`, upgradeId: definition.id, value: check.price, maintenance: definition.maintenance, acquiredSeason: next.season });
  if (definition.category === 'investment') next.inventory.investments.push({ id: `investment-${definition.id}-${next.season}-${owned.level}`, upgradeId: definition.id, principal: check.price, currentValue: check.price, annualReturn: definition.risk <= 8 ? 0.045 : definition.risk <= 22 ? 0.085 : 0.14, risk: definition.risk, acquiredSeason: next.season });
  next.netWorth = calculateNetWorth(next);
  next.updatedAt = new Date().toISOString();
  return { state: next, message: `${definition.name} sube a nivel ${owned.level}. Se descontaron $${check.price.toLocaleString('en-US')}.` };
}

export function sellUpgrade(state: CareerState, upgradeId: string): { state: CareerState; message: string } {
  const definition = getUpgrade(upgradeId);
  const owned = state.inventory.upgrades.find((item) => item.upgradeId === upgradeId);
  if (!definition || !owned || definition.resaleRate <= 0) return { state, message: 'Esta mejora no admite reventa.' };
  const next = cloneSerializable(state);
  const refund = Math.round(upgradePrice(definition, Math.max(0, owned.level - 1)) * definition.resaleRate);
  next.player.money += refund;
  owned.level -= 1;
  if (owned.level <= 0) next.inventory.upgrades = next.inventory.upgrades.filter((item) => item.upgradeId !== upgradeId);
  next.inventory.properties = next.inventory.properties.filter((item) => item.upgradeId !== upgradeId);
  next.netWorth = calculateNetWorth(next);
  return { state: next, message: `${definition.name} se revendió por $${refund.toLocaleString('en-US')}.` };
}

export function annualMaintenance(state: CareerState) {
  return state.inventory.upgrades.reduce((sum, owned) => sum + (getUpgrade(owned.upgradeId)?.maintenance ?? 0) * owned.level, 0);
}

export function totalUpgradeBenefit(state: CareerState, benefit: keyof UpgradeDefinition['benefits']) {
  return state.inventory.upgrades.reduce((total, owned) => {
    const base = getUpgrade(owned.upgradeId)?.benefits[benefit] ?? 0;
    return total + Array.from({ length: owned.level }, (_, index) => benefitAtLevel(base, index)).reduce((sum, value) => sum + value, 0);
  }, 0);
}

export function calculateNetWorth(state: CareerState) {
  const properties = state.inventory.properties.reduce((sum, item) => sum + item.value, 0);
  const investments = state.inventory.investments.reduce((sum, item) => sum + item.currentValue, 0);
  const resale = state.inventory.upgrades.reduce((sum, owned) => {
    const definition = getUpgrade(owned.upgradeId);
    return sum + (definition && !['housing', 'investment'].includes(definition.category) ? owned.purchasePrice * definition.resaleRate : 0);
  }, 0);
  return Math.round(state.player.money + properties + investments + resale);
}

export function safeBudget(state: CareerState) {
  const reserve = annualMaintenance(state) + Math.max(6000, state.contract.monthlySalary * 4);
  return { reserve, spendable: Math.max(0, state.player.money - reserve), safe: state.player.money >= reserve };
}

export function ownedUpgrade(state: CareerState, upgradeId: string): OwnedUpgrade | undefined {
  return state.inventory.upgrades.find((item) => item.upgradeId === upgradeId);
}
