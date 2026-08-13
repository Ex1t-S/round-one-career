import { Contract, PlayerRole, Team } from '@/types/game';
import { clamp, overallRating } from './progression';

export function createContract(team: Team, role: PlayerRole, playerRating = 50): Contract {
  const multiplier = 0.55 + playerRating / 110;
  return { teamId: team.id, monthlySalary: Math.round(team.averageSalary * multiplier), monthsRemaining: 24, prizeShare: 12, winBonus: Math.round(team.averageSalary * 0.35), majorBonus: Math.round(team.averageSalary * 5), mvpBonus: Math.round(team.averageSalary * 3), buyout: Math.round(team.budget * 0.08 * multiplier), guaranteedRole: role, streamingAllowed: true, decisionInfluence: clamp(Math.round(playerRating - 35), 5, 80), vacationWeeks: 3, personalStaff: false };
}

export function negotiateContract(contract: Contract, approach: 'salary' | 'role' | 'freedom'): Contract {
  const next = { ...contract };
  if (approach === 'salary') { next.monthlySalary = Math.round(next.monthlySalary * 1.15); next.buyout = Math.round(next.buyout * 1.2); next.monthsRemaining += 6; }
  if (approach === 'role') { next.decisionInfluence = clamp(next.decisionInfluence + 15); next.monthlySalary = Math.round(next.monthlySalary * 0.95); }
  if (approach === 'freedom') { next.streamingAllowed = true; next.vacationWeeks += 1; next.prizeShare = Math.max(5, next.prizeShare - 2); }
  return next;
}

export function monthlyFinances(contract: Contract, money: number, lifestyle = 900) {
  const gross = contract.monthlySalary;
  const taxes = Math.round(gross * 0.22);
  const agent = Math.round(gross * 0.05);
  return { balance: money + gross - taxes - agent - lifestyle, gross, taxes, agent, lifestyle };
}

export function contractValue(contract: Contract, attributes: Parameters<typeof overallRating>[0]) {
  return Math.round(contract.monthlySalary * contract.monthsRemaining + contract.buyout * (overallRating(attributes) / 100));
}
