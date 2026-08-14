import { getTournament } from '@/data/tournaments';
import { CareerState, FinancialSeasonSummary } from '@/types/game';
import { cloneSerializable } from '@/utils/clone';
import { rngFor } from './random';
import { annualMaintenance, calculateNetWorth, totalUpgradeBenefit } from './upgrades';
import { applyPrizeShare } from './contracts';

export function calculateFinancialSummary(state: CareerState): FinancialSeasonSummary {
  const matches = state.matches.filter((match) => match.season === state.season);
  const wins = matches.filter((match) => match.won);
  const majorCampaigns = state.majorCampaigns.filter((campaign) => campaign.season === state.season);
  const salary = state.contract.monthlySalary * 12;
  const prizeMoney = applyPrizeShare(wins.reduce((sum, match) => sum + getTournament(match.tournamentId).winnerPrize / Math.max(5, getTournament(match.tournamentId).teams), 0), state.contract.prizeShare);
  const winBonuses = wins.length * state.contract.winBonus;
  const tournamentBonuses = state.trophies.filter((trophy) => trophy.season === state.season && !trophy.name.includes('Major')).length * state.contract.winBonus * 3;
  const majorBonuses = majorCampaigns.filter((campaign) => campaign.bracket?.championId === state.teamId).length * state.contract.majorBonus;
  const mvpBonuses = majorCampaigns.filter((campaign) => campaign.mvp === state.player.identity.nickname).length * state.contract.mvpBonus;
  const sponsors = Math.round((state.player.reputation * 110 + state.player.fanbase * 75) * (1 + totalUpgradeBenefit(state, 'sponsorIncome') / 100));
  const streaming = state.contract.streamingAllowed ? Math.round(state.player.fanbase * 95 * (1 + totalUpgradeBenefit(state, 'streamingIncome') / 100)) : 0;
  const content = Math.round(state.player.attributes.mediaSkill * state.player.fanbase * 9);
  const otherIncome = Math.round(state.inventory.investments.reduce((sum, item) => sum + Math.max(0, item.currentValue - item.principal), 0));
  const gross = salary + prizeMoney + winBonuses + tournamentBonuses + majorBonuses + mvpBonuses + sponsors + streaming + content + otherIncome;
  const taxes = Math.round(gross * Math.max(0.14, 0.23 - totalUpgradeBenefit(state, 'financialStability') / 500));
  const agentFees = Math.round((salary + prizeMoney + winBonuses) * 0.05);
  const housing = 8400 + state.inventory.properties.reduce((sum, item) => sum + item.maintenance, 0);
  const travel = Math.max(1200, matches.length * 180);
  const health = state.inventory.upgrades.filter((item) => ['gym', 'nutritionist', 'sports-psychologist', 'physio', 'personal-doctor', 'health-insurance', 'sleep-therapy', 'muscle-recovery'].includes(item.upgradeId)).reduce((sum, item) => sum + (item.purchasePrice / Math.max(1, item.level)) * 0.12, 0);
  const training = state.inventory.upgrades.filter((item) => item.upgradeId.includes('coach') || item.upgradeId.includes('trainer') || item.upgradeId.includes('analyst')).reduce((sum, item) => sum + item.purchasePrice * 0.08, 0);
  const maintenance = annualMaintenance(state);
  const purchases = state.inventory.purchaseHistory.filter((item) => item.season === state.season).reduce((sum, item) => sum + item.price, 0);
  // Purchases are paid at the moment of purchase. Include the already-realized
  // cash delta so the annual balance reconciles with the closing cash instead
  // of charging those purchases a second time at settlement.
  const realizedCashAdjustment = state.player.money - state.seasonStartSnapshot.money + purchases;
  const balance = Math.round(gross - taxes - agentFees - housing - travel - health - training - maintenance - purchases + realizedCashAdjustment);
  return { season: state.season, salary, prizeMoney, winBonuses, tournamentBonuses, majorBonuses, mvpBonuses, sponsors, streaming, content, otherIncome, taxes, agentFees, housing, travel, health: Math.round(health), training: Math.round(training), maintenance, purchases, balance, closingCash: state.player.money, netWorth: state.netWorth };
}

export function settleOffseasonFinances(state: CareerState): { state: CareerState; summary: FinancialSeasonSummary } {
  const next = cloneSerializable(state);
  const random = rngFor(next.id, 'investments', next.season);
  for (const investment of next.inventory.investments) {
    const volatility = (random() - 0.45) * investment.risk / 100;
    investment.currentValue = Math.max(0, Math.round(investment.currentValue * (1 + investment.annualReturn + volatility)));
  }
  const preliminary = calculateFinancialSummary(next);
  const deferredIncome = preliminary.salary + preliminary.prizeMoney + preliminary.winBonuses + preliminary.tournamentBonuses + preliminary.majorBonuses + preliminary.mvpBonuses + preliminary.sponsors + preliminary.streaming + preliminary.content + preliminary.otherIncome;
  const deferredExpenses = preliminary.taxes + preliminary.agentFees + preliminary.housing + preliminary.travel + preliminary.health + preliminary.training + preliminary.maintenance;
  // Purchases, training sessions and consumables already changed cash in real
  // time. Only settle income and annual obligations that were deferred.
  next.player.money = Math.round(next.player.money + deferredIncome - deferredExpenses);
  next.netWorth = calculateNetWorth(next);
  const summary = { ...preliminary, balance: Math.round(next.player.money - state.seasonStartSnapshot.money), closingCash: next.player.money, netWorth: next.netWorth };
  next.financialHistory = [...next.financialHistory.filter((item) => item.season !== next.season), summary];
  next.careerRecords.earnings += deferredIncome;
  return { state: next, summary };
}
