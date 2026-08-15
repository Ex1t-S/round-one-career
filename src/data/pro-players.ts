import { TEAMS } from './teams';
import { PlayerRole } from '@/types/game';
import { hashString } from '@/engine/random';

export interface ProPlayerProfile {
  id: string;
  nickname: string;
  teamId: string;
  role: PlayerRole;
  age: number;
  seedRank?: number;
  baseScore: number;
  potential: number;
}

// Base editorial: Top 20 de 2025, usado solamente como punto de partida.
// El motor no fija ganadores: edad, forma, equipo, irrupciones y RNG cambian cada año.
const ELITE_SEED = [
  'ZywOo', 'donk', 'm0NESY', 'sh1ro', 'ropz', 'molodoy', 'flameZ', 'frozen', 'KSCERATO', 'Spinx',
  'Twistzz', 'mezii', 'Senzu', 'XANTARES', 'YEKINDAR', 'xertioN', 'torzsi', 'NiKo', 'iM', 'b1t',
  'HeavyGod', 'Jimpphat', 'NertZ', 'w0nderful', '910', 'Techno', 'device', 'malbsMd', 'EliGE', 'jks',
  'NAF', 'insani', 'nilo', 'Brollan', 'blameF', 'sjuush', 'stavn', 'FalleN', 'yuurih', 'woxic',
] as const;

const KNOWN_AGES: Record<string, number> = {
  ZywOo: 25, donk: 19, m0NESY: 21, sh1ro: 25, ropz: 26, molodoy: 21, flameZ: 23, frozen: 24,
  KSCERATO: 26, Spinx: 25, Twistzz: 26, mezii: 27, Senzu: 23, XANTARES: 31, YEKINDAR: 26,
  xertioN: 22, torzsi: 24, NiKo: 29, iM: 27, b1t: 23, HeavyGod: 24, Jimpphat: 20,
  NertZ: 27, w0nderful: 21, Techno: 21, device: 30, malbsMd: 23, EliGE: 29,
  FalleN: 34, jks: 29, NAF: 28, insani: 21, nilo: 20, Brollan: 23,
  sjuush: 26, stavn: 23, woxic: 27,
  kyousuke: 20, karrigan: 35, Snappi: 35, apEX: 32, KRIMZ: 31, Boombl4: 26,
  vsm: 25, biguzera: 24, makazze: 19, meyern: 23,
};

function idFor(nickname: string) {
  return nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function roleFor(nickname: string, team: (typeof TEAMS)[number]): PlayerRole {
  if (nickname === team.igl) return 'IGL';
  if (nickname === team.awper) return 'AWPer';
  if (nickname === team.star) return 'Rifler';
  const roll = hashString(`${team.id}|${nickname}|role`) % 4;
  return (['Rifler', 'Entry', 'Lurker', 'Support'] as PlayerRole[])[roll];
}

const bestTeamByNickname = new Map<string, (typeof TEAMS)[number]>();
for (const team of [...TEAMS].sort((a, b) => a.initialRanking - b.initialRanking)) {
  for (const nickname of team.roster) if (!bestTeamByNickname.has(nickname.toLowerCase())) bestTeamByNickname.set(nickname.toLowerCase(), team);
}

export const PRO_PLAYER_POOL: ProPlayerProfile[] = [...bestTeamByNickname.entries()].map(([normalized, team]) => {
  const nickname = team.roster.find((item) => item.toLowerCase() === normalized) ?? normalized;
  const seedIndex = ELITE_SEED.findIndex((item) => item.toLowerCase() === normalized);
  const seedRank = seedIndex >= 0 ? seedIndex + 1 : undefined;
  const randomBase = hashString(`${nickname}|base`) % 500 / 100;
  const teamBase = 60 + Math.max(0, 20 - team.initialRanking * .14);
  const roleBonus = nickname === team.star ? 3.5 : nickname === team.awper ? 2 : 0;
  return {
    id: `pro-${idFor(nickname)}`,
    nickname,
    teamId: team.id,
    role: roleFor(nickname, team),
    age: KNOWN_AGES[nickname] ?? 18 + hashString(`${nickname}|age`) % 12,
    seedRank,
    baseScore: seedRank ? 100 - Math.min(20, seedRank) * .55 - Math.max(0, seedRank - 20) * .32 : teamBase + roleBonus + randomBase,
    potential: 45 + hashString(`${nickname}|potential`) % 51,
  };
});
