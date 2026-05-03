import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AtlasGridConfig, BackgroundRemovalConfig, SpriteDefinition } from './devtoolsTypes';
import { createDefaultSprite } from './spriteAtlasUtils';

export interface DevtoolsState {
  atlasDataUrl: string | null;
  atlasFileName: string;
  imageWidth: number;
  imageHeight: number;
  grid: AtlasGridConfig;
  backgroundRemoval: BackgroundRemovalConfig;
  sprites: SpriteDefinition[];
  selectedSpriteId: string | null;
  selectedPreviewSpriteId: string | null;
}

interface DevtoolsStore extends DevtoolsState {
  setAtlasImage: (payload: {
    dataUrl: string;
    fileName: string;
    imageWidth: number;
    imageHeight: number;
  }) => void;
  updateGrid: (patch: Partial<AtlasGridConfig>) => void;
  updateBackgroundRemoval: (patch: Partial<BackgroundRemovalConfig>) => void;
  regenerateDefaultSprites: () => void;
  addSprite: () => void;
  updateSprite: (id: string, patch: Partial<Omit<SpriteDefinition, 'id'>>) => void;
  deleteSprite: (id: string) => void;
  selectSprite: (id: string | null) => void;
  selectPreviewSprite: (id: string | null) => void;
  importDocument: (payload: {
    atlasFileName: string;
    imageWidth: number;
    imageHeight: number;
    grid: AtlasGridConfig;
    backgroundRemoval: BackgroundRemovalConfig;
    sprites: SpriteDefinition[];
  }) => void;
  reset: () => void;
}

const defaultGrid: AtlasGridConfig = {
  cellWidth: 48,
  cellHeight: 48,
  offsetX: 0,
  offsetY: 0,
  gapX: 0,
  gapY: 0,
  columns: 4,
  rows: 4,
};

const defaultBgRemoval: BackgroundRemovalConfig = {
  enabled: true,
  tolerance: 26,
};

const createDefaultSpritesList = (count: number): SpriteDefinition[] => {
  return Array.from({ length: count }, (_, idx) => createDefaultSprite(idx + 1));
};

const initialState: DevtoolsState = {
  atlasDataUrl: null,
  atlasFileName: '',
  imageWidth: 0,
  imageHeight: 0,
  grid: defaultGrid,
  backgroundRemoval: defaultBgRemoval,
  sprites: [],
  selectedSpriteId: null,
  selectedPreviewSpriteId: null,
};

export const useDevtoolsStore = create<DevtoolsStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setAtlasImage: ({ dataUrl, fileName, imageWidth, imageHeight }) => {
        set({ atlasDataUrl: dataUrl, atlasFileName: fileName, imageWidth, imageHeight });
      },
      updateGrid: (patch) => set((state) => ({ grid: { ...state.grid, ...patch } })),
      updateBackgroundRemoval: (patch) =>
        set((state) => ({ backgroundRemoval: { ...state.backgroundRemoval, ...patch } })),
      regenerateDefaultSprites: () => {
        const total = get().grid.columns * get().grid.rows;
        const sprites = createDefaultSpritesList(total);
        set({
          sprites,
          selectedSpriteId: sprites[0]?.id ?? null,
          selectedPreviewSpriteId: sprites[0]?.id ?? null,
        });
      },
      addSprite: () => {
        const state = get();
        const nextIndex = state.sprites.length + 1;
        const nextSprite: SpriteDefinition = {
          id: `custom-${crypto.randomUUID()}`,
          name: `custom_${nextIndex}`,
          frameCount: 1,
          frameWidth: state.grid.cellWidth,
          frameHeight: state.grid.cellHeight,
          anchors: [],
          confirmed: false,
          frameSpec: '1',
          fps: 8,
          loop: true,
        };
        set({
          sprites: [...state.sprites, nextSprite],
          selectedSpriteId: nextSprite.id,
          selectedPreviewSpriteId: nextSprite.id,
        });
      },
      updateSprite: (id, patch) => {
        set((state) => ({
          sprites: state.sprites.map((sprite) => (sprite.id === id ? { ...sprite, ...patch } : sprite)),
        }));
      },
      deleteSprite: (id) => {
        const state = get();
        const sprites = state.sprites.filter((sprite) => sprite.id !== id);
        set({
          sprites,
          selectedSpriteId: sprites[0]?.id ?? null,
          selectedPreviewSpriteId: sprites[0]?.id ?? null,
        });
      },
      selectSprite: (id) => set({ selectedSpriteId: id }),
      selectPreviewSprite: (id) => set({ selectedPreviewSpriteId: id }),
      importDocument: ({ atlasFileName, imageWidth, imageHeight, grid, backgroundRemoval, sprites }) => {
        set({
          atlasFileName,
          imageWidth,
          imageHeight,
          grid,
          backgroundRemoval,
          sprites,
          selectedSpriteId: sprites[0]?.id ?? null,
          selectedPreviewSpriteId: sprites[0]?.id ?? null,
        });
      },
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'one-dark-night-devtools-sprite-atlas',
      version: 1,
      partialize: (state) => ({
        atlasDataUrl: state.atlasDataUrl,
        atlasFileName: state.atlasFileName,
        imageWidth: state.imageWidth,
        imageHeight: state.imageHeight,
        grid: state.grid,
        backgroundRemoval: state.backgroundRemoval,
        sprites: state.sprites,
        selectedSpriteId: state.selectedSpriteId,
        selectedPreviewSpriteId: state.selectedPreviewSpriteId,
      }),
      migrate: (persistedState) => ({
        ...initialState,
        ...(persistedState as Partial<DevtoolsState>),
      }),
    }
  )
);