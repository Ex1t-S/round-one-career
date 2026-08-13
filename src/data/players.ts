import { PlayerRole } from '@/types/game';

export interface HistoricalPlayer {
  nickname: string;
  role: PlayerRole;
  country: string;
  peak: number;
  majors: number;
  legacy: string;
}

/** Curated all-time reference list for the in-game Hall of Fame. */
export const HALL_OF_FAME_PLAYERS: HistoricalPlayer[] = [
  { nickname: 's1mple', role: 'AWPer', country: 'Ukraine', peak: 99, majors: 1, legacy: 'Mecánica y dominio individual' },
  { nickname: 'device', role: 'AWPer', country: 'Denmark', peak: 96, majors: 4, legacy: 'Consistencia dinástica' },
  { nickname: 'ZywOo', role: 'Hybrid', country: 'France', peak: 99, majors: 2, legacy: 'Eficiencia total' },
  { nickname: 'FalleN', role: 'IGL', country: 'Brazil', peak: 94, majors: 2, legacy: 'Liderazgo de una región' },
  { nickname: 'dupreeh', role: 'Entry', country: 'Denmark', peak: 91, majors: 5, legacy: 'Impacto y longevidad' },
  { nickname: 'GeT_RiGhT', role: 'Lurker', country: 'Sweden', peak: 96, majors: 1, legacy: 'El lurk hecho arte' },
  { nickname: 'NiKo', role: 'Rifler', country: 'Bosnia', peak: 98, majors: 0, legacy: 'Rifle de precisión histórica' },
  { nickname: 'gla1ve', role: 'IGL', country: 'Denmark', peak: 92, majors: 4, legacy: 'Arquitecto de una era' },
  { nickname: 'coldzera', role: 'Rifler', country: 'Brazil', peak: 98, majors: 2, legacy: 'Clutches y pico absoluto' },
  { nickname: 'olofmeister', role: 'Hybrid', country: 'Sweden', peak: 96, majors: 2, legacy: 'Versatilidad de campeón' },
];
