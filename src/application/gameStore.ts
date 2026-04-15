import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState } from '../domain/types';
import { sceneMap } from '../domain/scenes';

interface GameStore extends GameState {
  startGame: () => void;
  makeChoice: (choiceId: string) => void;
  restart: () => void;
}

const initialState: GameState = {
  day: 1,
  time: 'morning',
  alive: true,
  won: false,
  inventory: ['деньги (500р)'],
  flags: {},
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
        const nextScene = sceneMap.get(choice.nextSceneId);
        set({
          inventory: newInventory,
          flags: newFlags,
          currentSceneId: choice.nextSceneId,
          day: nextScene?.day ?? state.day,
          time: nextScene?.time ?? state.time,
          alive: nextScene?.isGameOver ? false : true,
          won: nextScene?.isVictory ?? false,
        });
      },
      restart: () => set({ ...initialState }),
    }),
    { name: 'one-dark-night-save' }
  )
);
