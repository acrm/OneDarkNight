import type { Scene } from '../types';
import { day1Scenes } from './day1';
import { day2Scenes } from './day2';
import { day3Scenes } from './day3';
import { day4Scenes } from './day4';
import { day5Scenes } from './day5';

export const allScenes: Scene[] = [
  ...day1Scenes,
  ...day2Scenes,
  ...day3Scenes,
  ...day4Scenes,
  ...day5Scenes,
];

export const sceneMap: Map<string, Scene> = new Map(
  allScenes.map((s) => [s.id, s])
);
