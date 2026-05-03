import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, ThreatStage } from '../domain/types';
import { sceneMap } from '../domain/scenes';

interface GameStore extends GameState {
  startGame: () => void;
  makeChoice: (choiceId: string) => void;
  restart: () => void;
}

const clampThreatLevel = (value: number): number => Math.max(0, Math.min(3, value));

const toThreatStage = (threatLevel: number): ThreatStage => {
  if (threatLevel >= 3) return 'breach';
  if (threatLevel >= 2) return 'hostile';
  if (threatLevel >= 1) return 'uneasy';
  return 'calm';
};

const initialState: GameState = {
  day: 1,
  time: 'morning',
  alive: true,
  won: false,
  inventory: ['деньги (500р)', 'тетрадь с правилами'],
  flags: {},
  threatLevel: 0,
  threatStage: 'calm',
  doomCounter: 0,
  currentRoomId: 'kitchen',
  consequenceLog: [],
  currentSceneId: 'd1_start',
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      startGame: () => set({ ...initialState }),
      makeChoice: (choiceId: string) => {
        const state = get();
        const scene = sceneMap.get(state.currentSceneId);
        if (!scene) return;
        const choice = scene.choices.find((c) => c.id === choiceId);
        if (!choice) return;
        if (choice.requireItem && !state.inventory.includes(choice.requireItem)) return;
        if (choice.requireFlag && !state.flags[choice.requireFlag]) return;
        if (choice.requireNotFlag && state.flags[choice.requireNotFlag]) return;
        let newInventory = [...state.inventory];
        if (choice.addItems) newInventory = [...newInventory, ...choice.addItems];
        if (choice.removeItems) newInventory = newInventory.filter((i) => !choice.removeItems!.includes(i));

        const newFlags = { ...state.flags, ...(choice.setFlags ?? {}) };
        if (choice.clearFlags) {
          for (const flag of choice.clearFlags) {
            delete newFlags[flag];
          }
        }

        const calculatedThreatDelta = choice.threatDelta ?? (choice.consequenceType === 'escalation' ? 1 : 0);
        const nextThreatLevel = clampThreatLevel(state.threatLevel + calculatedThreatDelta);
        const nextThreatStage = toThreatStage(nextThreatLevel);
        const nextDoomCounter = Math.max(0, state.doomCounter + (choice.doomDelta ?? 0));

        const nextConsequenceLog = choice.consequenceNote
          ? [...state.consequenceLog, choice.consequenceNote].slice(-12)
          : state.consequenceLog;

        let nextSceneId = choice.nextSceneId;
        if (newFlags.mirror_rule_broken && choice.nextSceneId === 'd5_start' && sceneMap.has('d5_mirror_payoff')) {
          nextSceneId = 'd5_mirror_payoff';
        }

        const nextScene = sceneMap.get(nextSceneId);
        const forcedFatal = choice.consequenceType === 'instant-fatal' && !nextScene?.isGameOver;
        const deferredFatal = nextDoomCounter >= 3 && sceneMap.has('d5_mirror_payoff') && !nextScene?.isGameOver;

        const resolvedSceneId = deferredFatal ? 'd5_mirror_payoff' : nextSceneId;
        const resolvedScene = sceneMap.get(resolvedSceneId);

        set({
          inventory: newInventory,
          flags: newFlags,
          threatLevel: nextThreatLevel,
          threatStage: nextThreatStage,
          doomCounter: nextDoomCounter,
          consequenceLog: nextConsequenceLog,
          currentSceneId: resolvedSceneId,
          day: resolvedScene?.day ?? state.day,
          time: resolvedScene?.time ?? state.time,
          currentRoomId: choice.moveToRoom ?? resolvedScene?.roomId ?? state.currentRoomId,
          alive: forcedFatal ? false : resolvedScene?.isGameOver ? false : true,
          won: resolvedScene?.isVictory ?? false,
        });
      },
      restart: () => set({ ...initialState }),
    }),
    {
      name: 'one-dark-night-save',
      version: 2,
      migrate: (persistedState) => ({ ...initialState, ...(persistedState as Partial<GameStore>) }),
    }
  )
);
