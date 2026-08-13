import { MAPS } from './maps';
import { TEAMS, TEAM_DATA_SOURCE } from './teams';
import { TOURNAMENTS } from './tournaments';
import { CAREER_EVENTS } from './events';
import { CareerDecision, MapDefinition, Team, Tournament } from '@/types/game';

export interface GameDataSnapshot {
  teams: Team[];
  tournaments: Tournament[];
  maps: MapDefinition[];
  events: CareerDecision[];
  source: string;
  generatedAt: string;
}

export interface GameDataAdapter {
  load(): Promise<GameDataSnapshot>;
}

/**
 * Offline-first adapter. A remote adapter can implement the same interface and
 * fall back to this seed whenever the network is unavailable.
 */
export const localDataAdapter: GameDataAdapter = {
  async load() {
    return {
      teams: TEAMS,
      tournaments: TOURNAMENTS,
      maps: MAPS,
      events: CAREER_EVENTS,
      source: TEAM_DATA_SOURCE,
      generatedAt: '2026-08-03',
    };
  },
};
