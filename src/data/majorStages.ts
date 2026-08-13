import { MajorStage } from '@/types/game';

export interface MajorStageDefinition {
  id: MajorStage;
  label: string;
  format: 'BO1' | 'BO3' | 'BO5' | 'Swiss' | 'Ceremony';
  winsToAdvance?: number;
  lossesToEliminate?: number;
  participants?: number;
  description: string;
}

export interface MajorFormatDefinition {
  id: string;
  label: string;
  swissInitialFormat: 'BO1' | 'BO3';
  swissDeciderFormat: 'BO3';
  playoffFormat: 'BO3' | 'BO5';
  grandFinalFormat: 'BO3' | 'BO5';
  avoidRematches: boolean;
  tiebreaker: 'buchholz' | 'ranking' | 'round-difference';
  directInviteRank: number;
  stages: MajorStageDefinition[];
}

export const DEFAULT_MAJOR_FORMAT: MajorFormatDefinition = {
  id: 'round-one-major-v2',
  label: 'Modelo configurable ROUND/ONE',
  swissInitialFormat: 'BO1',
  swissDeciderFormat: 'BO3',
  playoffFormat: 'BO3',
  grandFinalFormat: 'BO5',
  avoidRematches: true,
  tiebreaker: 'buchholz',
  directInviteRank: 8,
  stages: [
    { id: 'open-qualifier', label: 'Open Qualifier', format: 'BO1', participants: 64, description: 'Clasificatorio abierto regional de eliminación acelerada.' },
    { id: 'closed-qualifier', label: 'Closed Qualifier', format: 'BO3', participants: 16, description: 'Serie cerrada contra equipos invitados y clasificados.' },
    { id: 'rmr', label: 'RMR regional', format: 'BO3', participants: 16, description: 'Última instancia regional para asegurar una plaza.' },
    { id: 'opening-stage', label: 'Opening Stage', format: 'Swiss', winsToAdvance: 3, lossesToEliminate: 3, participants: 16, description: 'Swiss: tres victorias clasifican y tres derrotas eliminan.' },
    { id: 'elimination-stage', label: 'Elimination Stage', format: 'Swiss', winsToAdvance: 3, lossesToEliminate: 3, participants: 16, description: 'Segundo Swiss con los mejores equipos del evento.' },
    { id: 'playoffs', label: 'Playoffs', format: 'BO3', participants: 8, description: 'Bracket de eliminación directa para ocho equipos.' },
    { id: 'quarterfinal', label: 'Cuartos de final', format: 'BO3', participants: 8, description: 'Primera serie en arena.' },
    { id: 'semifinal', label: 'Semifinal', format: 'BO3', participants: 4, description: 'Una serie separa al equipo de la gran final.' },
    { id: 'grand-final', label: 'Gran final', format: 'BO5', participants: 2, description: 'Serie definitiva por el campeonato.' },
    { id: 'ceremony', label: 'Ceremonia y premios', format: 'Ceremony', description: 'Trofeo, MVP, all-star team y récords del Major.' },
  ],
};

export const MAJOR_STAGE_ORDER: MajorStage[] = DEFAULT_MAJOR_FORMAT.stages.map((stage) => stage.id);
export const getMajorStageDefinition = (stage: MajorStage) => DEFAULT_MAJOR_FORMAT.stages.find((item) => item.id === stage);
