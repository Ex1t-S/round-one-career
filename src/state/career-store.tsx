import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getTeam } from '@/data/teams';
import { CareerState, DecisionChoice, PlayerIdentity, TrainingActivity } from '@/types/game';
import { createContract, negotiateContract } from '@/engine/contracts';
import { applyTraining } from '@/engine/progression';
import { advanceWeek, applyDecision, createCareer, resolvePendingMatch } from '@/engine/season';
import { cloneSerializable } from '@/utils/clone';

const STORAGE_KEY = '@round-one/career-v1';

interface CareerStoreValue {
  career: CareerState | null;
  hydrated: boolean;
  message: string;
  startCareer: (identity: PlayerIdentity, teamId: string) => void;
  advance: () => void;
  resolveMatch: (approach?: 'aggressive' | 'balanced' | 'save') => void;
  choose: (choice: DecisionChoice) => void;
  train: (activity: TrainingActivity) => void;
  transfer: (teamId: string) => void;
  negotiate: (approach: 'salary' | 'role' | 'freedom') => void;
  retire: (path: 'coach' | 'analyst' | 'creator' | 'retired') => void;
  updateSettings: (settings: Partial<CareerState['settings']>) => void;
  resetCareer: () => Promise<void>;
  exportCareer: () => string;
  importCareer: (serialized: string) => Promise<boolean>;
  clearMessage: () => void;
}

const CareerStoreContext = createContext<CareerStoreValue | null>(null);

function isCareerState(value: unknown): value is CareerState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CareerState>;
  return candidate.schemaVersion === 1 && Boolean(candidate.player?.identity?.nickname) && Array.isArray(candidate.matches) && Array.isArray(candidate.rankings);
}

export function CareerStoreProvider({ children }: PropsWithChildren) {
  const [career, setCareer] = useState<CareerState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try { const parsed: unknown = JSON.parse(saved); if (isCareerState(parsed)) setCareer(parsed); } catch { setMessage('No se pudo leer la partida guardada.'); }
      }
    }).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated && career?.settings.autosave) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(career));
  }, [career, hydrated]);

  const mutate = useCallback((result: { state: CareerState; message: string }) => { setCareer(result.state); setMessage(result.message); }, []);

  const value = useMemo<CareerStoreValue>(() => ({
    career, hydrated, message,
    startCareer: (identity, teamId) => { const team = getTeam(teamId); const next = createCareer(identity, team); setCareer(next); setMessage(`Contrato firmado con ${team.name}. Tu carrera empieza ahora.`); },
    advance: () => { if (!career) return; const result = advanceWeek(career); setCareer(result.state); setMessage(result.messages.join(' ')); },
    resolveMatch: (approach = 'balanced') => {
      if (!career) return;
      const prepared = cloneSerializable(career);
      if (approach === 'aggressive') { prepared.player.attributes.entryImpact = Math.min(100, prepared.player.attributes.entryImpact + 4); prepared.player.attributes.discipline = Math.max(1, prepared.player.attributes.discipline - 2); prepared.player.fatigue = Math.min(100, prepared.player.fatigue + 4); }
      if (approach === 'save') { prepared.player.attributes.discipline = Math.min(100, prepared.player.attributes.discipline + 4); prepared.player.attributes.entryImpact = Math.max(1, prepared.player.attributes.entryImpact - 2); prepared.player.fatigue = Math.max(0, prepared.player.fatigue - 2); }
      prepared.flags.lastMatchApproach = approach;
      mutate(resolvePendingMatch(prepared));
    },
    choose: (choice) => { if (career) mutate(applyDecision(career, choice)); },
    train: (activity) => { if (career) mutate(applyTraining(career, activity)); },
    transfer: (teamId) => { if (!career) return; const team = getTeam(teamId); const next = cloneSerializable(career); next.teamId = team.id; next.contract = createContract(team, next.player.identity.role, Math.round(Object.values(next.player.attributes).reduce((a, b) => a + b, 0) / Object.keys(next.player.attributes).length)); next.chemistry = Math.max(35, team.chemistry - 15); next.player.money += Math.round(next.player.marketValue * 0.08); next.news.unshift(`${next.player.identity.nickname} es presentado como nuevo jugador de ${team.name}.`); next.socialFeed.unshift(`@roundone: HERE WE GO — ${next.player.identity.nickname} firma con ${team.name}.`); next.updatedAt = new Date().toISOString(); setCareer(next); setMessage(`Transferencia completada: ahora jugás para ${team.name}.`); },
    negotiate: (approach) => { if (!career) return; const next = cloneSerializable(career); next.contract = negotiateContract(next.contract, approach); next.updatedAt = new Date().toISOString(); setCareer(next); setMessage('La organización aceptó los nuevos términos del contrato.'); },
    retire: (path) => { if (!career) return; const next = cloneSerializable(career); next.finished = true; next.player.path = path; next.ending = path === 'coach' ? 'El líder continúa desde el banco' : path === 'analyst' ? 'Una nueva lectura del juego' : path === 'creator' ? 'Del servidor a la comunidad' : 'Una carrera para recordar'; next.updatedAt = new Date().toISOString(); setCareer(next); setMessage('Tu carrera profesional llegó a su capítulo final.'); },
    updateSettings: (settings) => { if (!career) return; const next = cloneSerializable(career); next.settings = { ...next.settings, ...settings }; setCareer(next); },
    resetCareer: async () => { await AsyncStorage.removeItem(STORAGE_KEY); setCareer(null); setMessage('La carrera fue eliminada.'); },
    exportCareer: () => career ? JSON.stringify(career, null, 2) : '',
    importCareer: async (serialized) => { try { const parsed: unknown = JSON.parse(serialized); if (!isCareerState(parsed)) throw new Error('invalid'); setCareer(parsed); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); setMessage('Carrera importada correctamente.'); return true; } catch { setMessage('El archivo JSON no contiene una carrera válida.'); return false; } },
    clearMessage: () => setMessage(''),
  }), [career, hydrated, message, mutate]);

  return <CareerStoreContext.Provider value={value}>{children}</CareerStoreContext.Provider>;
}

export function useCareerStore() {
  const context = useContext(CareerStoreContext);
  if (!context) throw new Error('useCareerStore must be used within CareerStoreProvider');
  return context;
}
