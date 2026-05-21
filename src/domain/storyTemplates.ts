import type { GameState, Scene } from './types';
import { allScenes } from './scenes';
import { metroLastTrainScenes } from './scenes/metroLastTrain';

export type StoryTemplateId = 'one-dark-night' | 'metro-last-train';

export interface StoryTemplate {
  id: StoryTemplateId;
  title: string;
  description: string;
  initialState: GameState;
  scenes: Scene[];
  sceneMap: Map<string, Scene>;
}

const createSceneMap = (scenes: Scene[]): Map<string, Scene> => new Map(scenes.map((scene) => [scene.id, scene]));

const cloneChoice = (choice: Scene['choices'][number]): Scene['choices'][number] => ({
  ...choice,
  setFlags: choice.setFlags ? { ...choice.setFlags } : undefined,
  addItems: choice.addItems ? [...choice.addItems] : undefined,
  removeItems: choice.removeItems ? [...choice.removeItems] : undefined,
  clearFlags: choice.clearFlags ? [...choice.clearFlags] : undefined,
});

export const cloneScenes = (scenes: Scene[]): Scene[] => scenes.map((scene) => ({
  ...scene,
  text: [...scene.text],
  choices: scene.choices.map(cloneChoice),
  nearbyRooms: scene.nearbyRooms ? [...scene.nearbyRooms] : undefined,
  tvEvent: scene.tvEvent ? { ...scene.tvEvent } : undefined,
}));

const oneDarkNightInitialState: GameState = {
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

const metroLastTrainInitialState: GameState = {
  day: 1,
  time: 'night',
  alive: true,
  won: false,
  inventory: ['жетон метро', 'наушники'],
  flags: {},
  threatLevel: 0,
  threatStage: 'calm',
  doomCounter: 0,
  currentRoomId: 'hallway',
  consequenceLog: [],
  currentSceneId: 'm1_start',
};

const STORY_TEMPLATES: Record<StoryTemplateId, StoryTemplate> = {
  'one-dark-night': {
    id: 'one-dark-night',
    title: 'One Dark Night',
    description: 'Демо-история о выживании в доме с жесткими правилами.',
    initialState: oneDarkNightInitialState,
    scenes: allScenes,
    sceneMap: createSceneMap(allScenes),
  },
  'metro-last-train': {
    id: 'metro-last-train',
    title: 'Metro: Last Train',
    description: 'Короткая демо-история о ночной поездке в последнем вагоне.',
    initialState: metroLastTrainInitialState,
    scenes: metroLastTrainScenes,
    sceneMap: createSceneMap(metroLastTrainScenes),
  },
};

export const getStoryTemplate = (id: StoryTemplateId): StoryTemplate => STORY_TEMPLATES[id] ?? STORY_TEMPLATES['one-dark-night'];

export const getStoryTemplates = (): StoryTemplate[] => Object.values(STORY_TEMPLATES);
