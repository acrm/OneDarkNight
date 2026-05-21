import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scene } from '../domain/types';
import { cloneScenes, getStoryTemplate, type StoryTemplateId } from '../domain/storyTemplates';

export interface StoryLibraryEntry {
  id: string;
  title: string;
  templateId: StoryTemplateId;
  isBuiltIn: boolean;
  createdAt: number;
}

interface StoryLibraryStore {
  stories: StoryLibraryEntry[];
  activeStoryId: string;
  customScenesByStoryId: Record<string, Scene[]>;
  revisionByStoryId: Record<string, number>;
  worldNotesByStoryId: Record<string, string>;
  setActiveStoryId: (id: string) => void;
  createStory: (title: string, templateId?: StoryTemplateId) => string;
  renameStory: (id: string, title: string) => void;
  deleteStory: (id: string) => void;
  updateStoryScenes: (storyId: string, scenes: Scene[]) => void;
  resetStoryScenes: (storyId: string) => void;
  updateWorldNotes: (storyId: string, notes: string) => void;
}

const BUILTIN_STORIES: StoryLibraryEntry[] = [
  {
    id: 'story-one-dark-night',
    title: 'One Dark Night',
    templateId: 'one-dark-night',
    isBuiltIn: true,
    createdAt: 0,
  },
  {
    id: 'story-metro-last-train',
    title: 'Metro: Last Train',
    templateId: 'metro-last-train',
    isBuiltIn: true,
    createdAt: 0,
  },
];

const normalizeTitle = (title: string): string => title.trim().slice(0, 80);

const ensureBuiltInStories = (stories: StoryLibraryEntry[]): StoryLibraryEntry[] => {
  const map = new Map(stories.map((story) => [story.id, story]));
  for (const builtIn of BUILTIN_STORIES) {
    if (!map.has(builtIn.id)) {
      map.set(builtIn.id, builtIn);
    }
  }
  return [...map.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
};

export const useStoryLibraryStore = create<StoryLibraryStore>()(
  persist(
    (set, get) => ({
      stories: BUILTIN_STORIES,
      activeStoryId: 'story-one-dark-night',
      customScenesByStoryId: {
        'story-one-dark-night': cloneScenes(getStoryTemplate('one-dark-night').scenes),
        'story-metro-last-train': cloneScenes(getStoryTemplate('metro-last-train').scenes),
      },
      revisionByStoryId: {
        'story-one-dark-night': 1,
        'story-metro-last-train': 1,
      },
      worldNotesByStoryId: {
        'story-one-dark-night': '',
        'story-metro-last-train': '',
      },
      setActiveStoryId: (id: string) => {
        const exists = get().stories.some((story) => story.id === id);
        if (!exists) return;
        set({ activeStoryId: id });
      },
      createStory: (title: string, templateId: StoryTemplateId = 'one-dark-night') => {
        const normalizedTitle = normalizeTitle(title);
        const safeTitle = normalizedTitle || 'Новая история';
        const id = `story-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const createdStory: StoryLibraryEntry = {
          id,
          title: safeTitle,
          templateId,
          isBuiltIn: false,
          createdAt: Date.now(),
        };
        const initialScenes = cloneScenes(getStoryTemplate(templateId).scenes);
        set((state) => ({
          stories: [...state.stories, createdStory],
          activeStoryId: id,
          customScenesByStoryId: {
            ...state.customScenesByStoryId,
            [id]: initialScenes,
          },
          revisionByStoryId: {
            ...state.revisionByStoryId,
            [id]: 1,
          },
          worldNotesByStoryId: {
            ...state.worldNotesByStoryId,
            [id]: '',
          },
        }));
        return id;
      },
      renameStory: (id: string, title: string) => {
        const normalizedTitle = normalizeTitle(title);
        if (!normalizedTitle) return;
        set((state) => ({
          stories: state.stories.map((story) => {
            if (story.id !== id || story.isBuiltIn) return story;
            return { ...story, title: normalizedTitle };
          }),
        }));
      },
      deleteStory: (id: string) => {
        const state = get();
        const story = state.stories.find((item) => item.id === id);
        if (!story || story.isBuiltIn) return;
        const nextStories = state.stories.filter((item) => item.id !== id);
        const fallbackStory = nextStories[0] ?? BUILTIN_STORIES[0];
        const nextCustomScenesByStoryId = { ...state.customScenesByStoryId };
        const nextRevisionByStoryId = { ...state.revisionByStoryId };
        const nextWorldNotesByStoryId = { ...state.worldNotesByStoryId };
        delete nextCustomScenesByStoryId[id];
        delete nextRevisionByStoryId[id];
        delete nextWorldNotesByStoryId[id];

        set({
          stories: ensureBuiltInStories(nextStories),
          activeStoryId: state.activeStoryId === id ? fallbackStory.id : state.activeStoryId,
          customScenesByStoryId: nextCustomScenesByStoryId,
          revisionByStoryId: nextRevisionByStoryId,
          worldNotesByStoryId: nextWorldNotesByStoryId,
        });
      },
      updateStoryScenes: (storyId: string, scenes: Scene[]) => {
        set((state) => ({
          customScenesByStoryId: {
            ...state.customScenesByStoryId,
            [storyId]: cloneScenes(scenes),
          },
          revisionByStoryId: {
            ...state.revisionByStoryId,
            [storyId]: (state.revisionByStoryId[storyId] ?? 0) + 1,
          },
        }));
      },
      resetStoryScenes: (storyId: string) => {
        set((state) => {
          const story = state.stories.find((item) => item.id === storyId);
          if (!story) return state;
          const resetScenes = cloneScenes(getStoryTemplate(story.templateId).scenes);
          return {
            customScenesByStoryId: {
              ...state.customScenesByStoryId,
              [storyId]: resetScenes,
            },
            revisionByStoryId: {
              ...state.revisionByStoryId,
              [storyId]: (state.revisionByStoryId[storyId] ?? 0) + 1,
            },
          };
        });
      },
      updateWorldNotes: (storyId: string, notes: string) => {
        set((state) => ({
          worldNotesByStoryId: {
            ...state.worldNotesByStoryId,
            [storyId]: notes.slice(0, 8000),
          },
        }));
      },
    }),
    {
      name: 'play-my-story-library',
      version: 3,
      migrate: (persistedState) => {
        const incoming = persistedState as Partial<StoryLibraryStore> | undefined;
        const stories = ensureBuiltInStories(incoming?.stories ?? BUILTIN_STORIES);
        const activeStoryId = stories.some((story) => story.id === incoming?.activeStoryId)
          ? (incoming?.activeStoryId as string)
          : 'story-one-dark-night';

        const incomingScenes = incoming?.customScenesByStoryId ?? {};
        const customScenesByStoryId: Record<string, Scene[]> = {};
        const revisionByStoryId: Record<string, number> = {};
        const worldNotesByStoryId: Record<string, string> = {};

        for (const story of stories) {
          const fallbackScenes = cloneScenes(getStoryTemplate(story.templateId).scenes);
          customScenesByStoryId[story.id] = cloneScenes(incomingScenes[story.id] ?? fallbackScenes);
          revisionByStoryId[story.id] = incoming?.revisionByStoryId?.[story.id] ?? 1;
          worldNotesByStoryId[story.id] = incoming?.worldNotesByStoryId?.[story.id] ?? '';
        }

        return {
          stories,
          activeStoryId,
          customScenesByStoryId,
          revisionByStoryId,
          worldNotesByStoryId,
        } as Partial<StoryLibraryStore>;
      },
    }
  )
);
