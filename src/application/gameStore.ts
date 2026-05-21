import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, ThreatStage } from '../domain/types';
import type { StoryTemplateId } from '../domain/storyTemplates';
import { getStoryTemplate } from '../domain/storyTemplates';

interface GameStore extends GameState {
  activeStoryId: string;
  activeTemplateId: StoryTemplateId;
  storySnapshots: Record<string, GameState>;
  activateStory: (storyId: string, templateId: StoryTemplateId) => void;
  startGame: () => void;
  makeChoice: (choiceId: string) => void;
  restart: () => void;
}

const normalizeInventory = (items: string[]): string[] => [...new Set(items)];

const clampThreatLevel = (value: number): number => Math.max(0, Math.min(3, value));

const toThreatStage = (threatLevel: number): ThreatStage => {
  if (threatLevel >= 3) return 'breach';
  if (threatLevel >= 2) return 'hostile';
  if (threatLevel >= 1) return 'uneasy';
  return 'calm';
};

const DEFAULT_STORY_ID = 'story-one-dark-night';
const DEFAULT_TEMPLATE_ID: StoryTemplateId = 'one-dark-night';

const cloneGameState = (state: GameState): GameState => ({
  ...state,
  inventory: [...state.inventory],
  flags: { ...state.flags },
  consequenceLog: [...state.consequenceLog],
});

const createInitialState = (templateId: StoryTemplateId): GameState => {
  const { initialState } = getStoryTemplate(templateId);
  return cloneGameState(initialState);
};

const toGameStateSnapshot = (state: GameStore): GameState => ({
  day: state.day,
  time: state.time,
  alive: state.alive,
  won: state.won,
  inventory: [...state.inventory],
  flags: { ...state.flags },
  threatLevel: state.threatLevel,
  threatStage: state.threatStage,
  doomCounter: state.doomCounter,
  currentRoomId: state.currentRoomId,
  consequenceLog: [...state.consequenceLog],
  currentSceneId: state.currentSceneId,
});

const defaultState = createInitialState(DEFAULT_TEMPLATE_ID);

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      activeStoryId: DEFAULT_STORY_ID,
      activeTemplateId: DEFAULT_TEMPLATE_ID,
      storySnapshots: { [DEFAULT_STORY_ID]: defaultState },
      activateStory: (storyId: string, templateId: StoryTemplateId) => {
        set((state) => {
          const currentSnapshot = toGameStateSnapshot(state);
          const snapshots = {
            ...state.storySnapshots,
            [state.activeStoryId]: currentSnapshot,
          };

          const targetSnapshot = snapshots[storyId] ?? createInitialState(templateId);
          snapshots[storyId] = cloneGameState(targetSnapshot);

          return {
            ...cloneGameState(targetSnapshot),
            activeStoryId: storyId,
            activeTemplateId: templateId,
            storySnapshots: snapshots,
          };
        });
      },
      startGame: () => set((state) => {
        const resetState = createInitialState(state.activeTemplateId);
        return {
          ...resetState,
          storySnapshots: {
            ...state.storySnapshots,
            [state.activeStoryId]: resetState,
          },
        };
      }),
      makeChoice: (choiceId: string) => {
        const state = get();
        const sceneMap = getStoryTemplate(state.activeTemplateId).sceneMap;
        const scene = sceneMap.get(state.currentSceneId);
        if (!scene) return;
        const choice = scene.choices.find((c) => c.id === choiceId);
        if (!choice) return;
        const normalizedInventory = normalizeInventory(state.inventory);
        if (choice.requireItem && !normalizedInventory.includes(choice.requireItem)) return;
        if (choice.requireFlag && !state.flags[choice.requireFlag]) return;
        if (choice.requireNotFlag && state.flags[choice.requireNotFlag]) return;
        let newInventory = [...normalizedInventory];
        if (choice.addItems) newInventory = normalizeInventory([...newInventory, ...choice.addItems]);
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

        const nextGameState: GameState = {
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
        };

        set((previousState) => ({
          ...nextGameState,
          storySnapshots: {
            ...previousState.storySnapshots,
            [previousState.activeStoryId]: cloneGameState(nextGameState),
          },
        }));
      },
      restart: () => set((state) => {
        const resetState = createInitialState(state.activeTemplateId);
        return {
          ...resetState,
          storySnapshots: {
            ...state.storySnapshots,
            [state.activeStoryId]: resetState,
          },
        };
      }),
    }),
    {
      name: 'play-my-story-save',
      version: 3,
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<GameStore>;

        const legacyLooksLikeGameState = typeof persisted?.currentSceneId === 'string';
        if (legacyLooksLikeGameState) {
          const legacySnapshot: GameState = {
            ...defaultState,
            ...(persisted as Partial<GameState>),
          };
          return {
            ...legacySnapshot,
            activeStoryId: DEFAULT_STORY_ID,
            activeTemplateId: DEFAULT_TEMPLATE_ID,
            storySnapshots: {
              [DEFAULT_STORY_ID]: cloneGameState(legacySnapshot),
            },
          } as Partial<GameStore>;
        }

        const activeStoryId = persisted.activeStoryId || DEFAULT_STORY_ID;
        const activeTemplateId = persisted.activeTemplateId || DEFAULT_TEMPLATE_ID;
        const snapshots = persisted.storySnapshots ?? { [DEFAULT_STORY_ID]: defaultState };
        const activeSnapshot = snapshots[activeStoryId] ?? createInitialState(activeTemplateId);

        return {
          ...cloneGameState(activeSnapshot),
          activeStoryId,
          activeTemplateId,
          storySnapshots: snapshots,
        } as Partial<GameStore>;
      },
    }
  )
);
