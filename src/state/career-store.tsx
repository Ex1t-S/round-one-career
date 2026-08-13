import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getTeam } from '@/data/teams';
import { CareerState, DecisionChoice, PlayerIdentity, TrainingActivity } from '@/types/game';
import { createContract, negotiateContract } from '@/engine/contracts';
import { applyTraining } from '@/engine/progression';
import { advanceUntilAction, advanceWeek, applyDecision, completeOffseason, createCareer, resolvePendingMatch } from '@/engine/season';
import { cloneSerializable } from '@/utils/clone';
import { CAREER_SCHEMA_VERSION, migrateCareerState } from './migrations';
import { prepareMajorMatch } from '@/engine/major';
import { autoSimulateMinigame, createMinigame, MINIGAME_DEFINITIONS, resolveMinigame, shouldRunMinigame } from '@/engine/minigames';
import { purchaseUpgrade, sellUpgrade } from '@/engine/upgrades';
import { purchaseConsumable } from '@/engine/consumables';
import { generateCareerOffers } from '@/engine/rosters';

const STORAGE_KEY = '@round-one/career-v3';
const LEGACY_STORAGE_KEYS = ['@round-one/career-v2', '@round-one/career-v1'];

interface CareerStoreValue {
  career: CareerState | null;
  hydrated: boolean;
  message: string;
  startCareer: (identity: PlayerIdentity, teamId: string) => void;
  advance: () => void;
  advanceToNextAction: () => void;
  resolveMatch: (approach?: 'aggressive' | 'balanced' | 'save') => void;
  choose: (choice: DecisionChoice) => void;
  train: (activity: TrainingActivity) => void;
  transfer: (teamId: string) => void;
  negotiate: (approach: 'salary' | 'role' | 'freedom') => void;
  continueMajor: () => void;
  completeMinigame: (choices: string[]) => void;
  buyUpgrade: (upgradeId: string) => void;
  buyConsumable: (consumableId: string) => void;
  sellOwnedUpgrade: (upgradeId: string) => void;
  setOffseasonStep: (step: number) => void;
  finishOffseason: () => void;
  retire: (path: 'coach' | 'analyst' | 'creator' | 'retired') => void;
  updateSettings: (settings: Partial<CareerState['settings']>) => void;
  setAvatar: (avatarId: string) => void;
  resetCareer: () => Promise<void>;
  exportCareer: () => string;
  importCareer: (serialized: string) => Promise<boolean>;
  clearMessage: () => void;
}

const CareerStoreContext = createContext<CareerStoreValue | null>(null);

export function CareerStoreProvider({ children }: PropsWithChildren) {
  const [career, setCareer] = useState<CareerState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), ...LEGACY_STORAGE_KEYS.map((key) => AsyncStorage.getItem(key))]).then(([current, ...legacy]) => {
      const saved = current ?? legacy.find(Boolean);
      if (saved) {
        try { const parsed: unknown = JSON.parse(saved); const migrated = migrateCareerState(parsed); if (migrated) { setCareer(migrated); if ((parsed as CareerState).schemaVersion < CAREER_SCHEMA_VERSION) setMessage('Carrera anterior migrada al motor de mundo Phase 3.'); } } catch { setMessage('No se pudo leer la partida guardada.'); }
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
    advanceToNextAction: () => {
      if (!career) return;
      const result = advanceUntilAction(career);
      setCareer(result.state);
      setMessage(result.messages.slice(-3).join(' '));
    },
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
    transfer: (teamId) => { if (!career) return; const team = getTeam(teamId); const next = cloneSerializable(career); const offer = next.offers.find((item) => item.teamId === teamId); next.teamId = team.id; next.contract = createContract(team, next.player.identity.role, Math.round(Object.values(next.player.attributes).reduce((a, b) => a + b, 0) / Object.keys(next.player.attributes).length)); if (offer) { next.contract.monthlySalary = offer.monthlySalary; next.contract.monthsRemaining = offer.durationMonths; next.squad.role = offer.squadRole; next.squad.roleSecurity = offer.squadRole === 'star' ? 86 : offer.squadRole === 'starter' ? 74 : offer.squadRole === 'rotation' ? 55 : 40; } next.squad.mapShare = ['star', 'starter'].includes(next.squad.role) ? 100 : next.squad.role === 'rotation' ? 72 : 45; next.squad.seasonsAtTeam = 1; next.squad.competitorName = team.roster.at(-1) ?? 'academy player'; next.squad.lastChangeReason = offer?.rationale ?? 'Nuevo contrato y nueva competencia interna.'; next.offers = generateCareerOffers(next).filter((item) => item.teamId !== team.id); next.chemistry = Math.max(35, team.chemistry - 15); next.player.money += Math.round(next.player.marketValue * 0.08); next.news.unshift(`${next.player.identity.nickname} es presentado como nuevo jugador de ${team.name} con rol ${next.squad.role}.`); next.socialFeed.unshift(`@roundone: HERE WE GO — ${next.player.identity.nickname} firma con ${team.name}.`); next.updatedAt = new Date().toISOString(); setCareer(next); setMessage(`Transferencia completada: ${team.name} · rol ${next.squad.role}.`); },
    negotiate: (approach) => { if (!career) return; const next = cloneSerializable(career); next.contract = negotiateContract(next.contract, approach); next.updatedAt = new Date().toISOString(); setCareer(next); setMessage('La organización aceptó los nuevos términos del contrato.'); },
    continueMajor: () => {
      if (!career?.activeMajorId) return;
      const campaign = career.majorCampaigns.find((item) => item.id === career.activeMajorId);
      if (!campaign) return;
      if (campaign.stage === 'ceremony') { mutate(prepareMajorMatch(career)); return; }
      const definition = MINIGAME_DEFINITIONS[(campaign.playerMatchIds.length + campaign.swissRounds.length) % MINIGAME_DEFINITIONS.length];
      const important = ['quarterfinal', 'semifinal', 'grand-final'].includes(campaign.stage);
      if (shouldRunMinigame(career, true, important)) {
        const prepared = prepareMajorMatch(career);
        const next = cloneSerializable(prepared.state);
        next.pendingMinigame = createMinigame(next, definition.id, `${campaign.tournamentId}:${campaign.stage}`, campaign.id);
        const nextCampaign = next.majorCampaigns.find((item) => item.id === campaign.id);
        if (nextCampaign) nextCampaign.pendingMinigameId = definition.id;
        setCareer(next); setMessage(`${definition.name}: decisión clave antes de la serie.`);
      } else {
        const next = cloneSerializable(career);
        const result = autoSimulateMinigame(next, definition.id, `${campaign.tournamentId}:${campaign.stage}`, campaign.id);
        next.minigameHistory.push(result); next.flags.lastMinigameModifier = result.modifier;
        mutate(prepareMajorMatch(next));
      }
    },
    completeMinigame: (choices) => {
      if (!career?.pendingMinigame) return;
      const next = cloneSerializable(career);
      const game = next.pendingMinigame!;
      const result = resolveMinigame(next, game, choices);
      next.minigameHistory.push(result); next.flags.lastMinigameModifier = result.modifier;
      if (game.definitionId === 'map-veto') next.flags.lastVetoMaps = result.choices.join('|');
      next.careerRecords.minigameHighScore = Math.max(next.careerRecords.minigameHighScore, result.score);
      const campaign = next.majorCampaigns.find((item) => item.id === next.pendingMinigame?.majorCampaignId);
      if (campaign) campaign.pendingMinigameId = undefined;
      next.pendingMinigame = undefined;
      const prepared = next.pendingMatchId ? { state: next, message: 'Serie preparada con el veto aplicado.' } : prepareMajorMatch(next);
      setCareer(prepared.state); setMessage(`${result.explanation} ${prepared.message}`);
    },
    buyUpgrade: (upgradeId) => { if (career) mutate(purchaseUpgrade(career, upgradeId)); },
    buyConsumable: (consumableId) => { if (career) mutate(purchaseConsumable(career, consumableId)); },
    sellOwnedUpgrade: (upgradeId) => { if (career) mutate(sellUpgrade(career, upgradeId)); },
    setOffseasonStep: (step) => { if (!career?.offseasonPending) return; const next = cloneSerializable(career); next.offseasonStep = Math.max(1, Math.min(12, step)); setCareer(next); },
    finishOffseason: () => { if (career) mutate(completeOffseason(career)); },
    retire: (path) => { if (!career) return; const next = cloneSerializable(career); next.finished = true; next.player.path = path; next.ending = path === 'coach' ? 'El líder continúa desde el banco' : path === 'analyst' ? 'Una nueva lectura del juego' : path === 'creator' ? 'Del servidor a la comunidad' : 'Una carrera para recordar'; next.updatedAt = new Date().toISOString(); setCareer(next); setMessage('Tu carrera profesional llegó a su capítulo final.'); },
    updateSettings: (settings) => { if (!career) return; const next = cloneSerializable(career); next.settings = { ...next.settings, ...settings }; setCareer(next); },
    setAvatar: (avatarId) => { if (!career) return; const next = cloneSerializable(career); next.visualAssets.avatarId = avatarId; setCareer(next); setMessage(`Avatar ${avatarId.replace('avatar-', '')} seleccionado.`); },
    resetCareer: async () => { await Promise.all([AsyncStorage.removeItem(STORAGE_KEY), ...LEGACY_STORAGE_KEYS.map((key) => AsyncStorage.removeItem(key))]); setCareer(null); setMessage('La carrera fue eliminada.'); },
    exportCareer: () => career ? JSON.stringify(career, null, 2) : '',
    importCareer: async (serialized) => { try { const parsed: unknown = JSON.parse(serialized); const migrated = migrateCareerState(parsed); if (!migrated) throw new Error('invalid'); setCareer(migrated); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); setMessage('Carrera importada y migrada correctamente.'); return true; } catch { setMessage('El archivo JSON no contiene una carrera válida.'); return false; } },
    clearMessage: () => setMessage(''),
  }), [career, hydrated, message, mutate]);

  return <CareerStoreContext.Provider value={value}>{children}</CareerStoreContext.Provider>;
}

export function useCareerStore() {
  const context = useContext(CareerStoreContext);
  if (!context) throw new Error('useCareerStore must be used within CareerStoreProvider');
  return context;
}
