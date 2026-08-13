import { MapDefinition } from '@/types/game';

export const MAPS: MapDefinition[] = [
  { id: 'mirage', name: 'Mirage', active: true, ctBias: 2, tBias: 2, modifiers: { Entry: 4, AWPer: 3, Utility: 2, Clutch: 4, IGL: 3, Experience: 2 }, description: 'Duelo, timings de medio y mucha lectura del rival.' },
  { id: 'inferno', name: 'Inferno', active: true, ctBias: 4, tBias: 1, modifiers: { Entry: 2, AWPer: 1, Utility: 6, Clutch: 4, IGL: 5, Experience: 4 }, description: 'Utility, rotaciones cortas y finales cerrados.' },
  { id: 'nuke', name: 'Nuke', active: true, ctBias: 6, tBias: -1, modifiers: { Entry: 1, AWPer: 3, Utility: 4, Clutch: 2, IGL: 7, Experience: 6 }, description: 'El mapa más táctico: niveles, sonido y rotaciones.' },
  { id: 'ancient', name: 'Ancient', active: true, ctBias: 4, tBias: 0, modifiers: { Entry: 5, AWPer: 2, Utility: 5, Clutch: 2, IGL: 4, Experience: 3 }, description: 'Control temprano y entradas explosivas.' },
  { id: 'anubis', name: 'Anubis', active: true, ctBias: 0, tBias: 5, modifiers: { Entry: 4, AWPer: 2, Utility: 4, Clutch: 5, IGL: 3, Experience: 2 }, description: 'Mapa agresivo con gran potencial del lado T.' },
  { id: 'vertigo', name: 'Vertigo', active: false, legacy: true, ctBias: 2, tBias: 2, modifiers: { Entry: 2, AWPer: 0, Utility: 6, Clutch: 3, IGL: 5, Experience: 5 }, description: 'Legacy: presión de rampas y ejecuciones medidas.' },
  { id: 'dust2', name: 'Dust II', active: true, ctBias: 1, tBias: 3, modifiers: { Entry: 5, AWPer: 6, Utility: 1, Clutch: 4, IGL: 1, Experience: 3 }, description: 'Aim puro, AWP y control de espacios largos.' },
  { id: 'cache', name: 'Cache', active: true, legacy: true, ctBias: 1, tBias: 3, modifiers: { Entry: 5, AWPer: 3, Utility: 3, Clutch: 3, IGL: 2, Experience: 1 }, description: 'Mapa legacy reactivado: mecánicas y velocidad.' },
];

export const ACTIVE_MAP_IDS = MAPS.filter((map) => map.active).map((map) => map.id);
export const getMap = (id: string) => MAPS.find((map) => map.id === id) ?? MAPS[0];
