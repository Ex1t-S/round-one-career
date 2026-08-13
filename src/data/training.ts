import { TrainingActivity } from '@/types/game';

export const TRAINING_ACTIVITIES: TrainingActivity[] = [
  { id: 'aim-routine', name: 'Aim trainer', description: 'Microajustes, flicks y reacción bajo presión.', attributes: ['aim', 'reaction', 'crosshairPlacement'], pointCost: 2, moneyCost: 0, fatigue: 7, burnout: 3, gains: 2 },
  { id: 'spray-lab', name: 'Spray lab', description: 'Control de rifles y transferencias entre objetivos.', attributes: ['sprayControl', 'aim', 'movement'], pointCost: 2, moneyCost: 0, fatigue: 6, burnout: 2, gains: 2 },
  { id: 'demo-review', name: 'Revisión de demos', description: 'Leé patrones, errores propios y respuestas rivales.', attributes: ['gameSense', 'readingOpponents', 'mapKnowledge'], pointCost: 2, moneyCost: 0, fatigue: 3, burnout: 1, gains: 2 },
  { id: 'utility-server', name: 'Servidor de utility', description: 'Smokes, flashes y granadas con timing de equipo.', attributes: ['utilityUsage', 'smokeLineups', 'grenadeTiming', 'flashAssists'], pointCost: 2, moneyCost: 0, fatigue: 4, burnout: 1, gains: 2 },
  { id: 'coach-session', name: 'Coaching individual', description: 'Sesión privada enfocada en tus debilidades.', attributes: ['positioning', 'adaptability', 'consistency'], pointCost: 1, moneyCost: 900, fatigue: 3, burnout: 0, gains: 3 },
  { id: 'sports-psych', name: 'Psicólogo deportivo', description: 'Herramientas para confianza, presión y resiliencia.', attributes: ['mentalStrength', 'confidence', 'discipline'], pointCost: 1, moneyCost: 650, fatigue: -6, burnout: -9, gains: 2 },
  { id: 'igl-workshop', name: 'Workshop táctico', description: 'Mid-round calls, protocolos y liderazgo.', attributes: ['leadership', 'communication', 'readingOpponents'], pointCost: 2, moneyCost: 400, fatigue: 4, burnout: 1, gains: 2 },
  { id: 'bootcamp', name: 'Bootcamp intensiva', description: 'Semana de práctica integral con el roster.', attributes: ['teamChemistry', 'communication', 'mapKnowledge', 'consistency'], pointCost: 4, moneyCost: 1800, fatigue: 15, burnout: 7, gains: 4 },
  { id: 'rest', name: 'Descanso programado', description: 'Recuperá energía y evitá el burnout.', attributes: ['stamina', 'mentalStrength'], pointCost: 1, moneyCost: 0, fatigue: -22, burnout: -13, gains: 1 },
  { id: 'media-training', name: 'Media training', description: 'Entrevistas, sponsors y presencia pública.', attributes: ['mediaSkill', 'englishCommunication', 'communication'], pointCost: 1, moneyCost: 500, fatigue: 2, burnout: 0, gains: 2 },
];
