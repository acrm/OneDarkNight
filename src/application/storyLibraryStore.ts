import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoryTemplateId } from '../domain/storyTemplates';

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
  setActiveStoryId: (id: string) => void;
  createStory: (title: string, templateId?: StoryTemplateId) => string;
  renameStory: (id: string, title: string) => void;
  deleteStory: (id: string) => void;
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
        set((state) => ({
          stories: [...state.stories, createdStory],
          activeStoryId: id,
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
        set({
          stories: ensureBuiltInStories(nextStories),
          activeStoryId: state.activeStoryId === id ? fallbackStory.id : state.activeStoryId,
        });
      },
    }),
    {
      name: 'play-my-story-library',
      version: 1,
      migrate: (persistedState) => {
        const incoming = persistedState as Partial<StoryLibraryStore> | undefined;
        const stories = ensureBuiltInStories(incoming?.stories ?? BUILTIN_STORIES);
        const activeStoryId = stories.some((story) => story.id === incoming?.activeStoryId)
          ? (incoming?.activeStoryId as string)
          : 'story-one-dark-night';

        return {
          stories,
          activeStoryId,
        } as Partial<StoryLibraryStore>;
      },
    }
  )
);
