export type DayNumber = 1 | 2 | 3 | 4 | 5;
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'latenight';

export interface GameState {
  day: DayNumber;
  time: TimeOfDay;
  alive: boolean;
  won: boolean;
  inventory: string[];
  flags: Record<string, boolean>;
  currentSceneId: string;
}

export interface Choice {
  id: string;
  text: string;
  nextSceneId: string;
  isDeadly?: boolean;
  requireFlag?: string;
  requireNotFlag?: string;
  requireItem?: string;
  setFlags?: Record<string, boolean>;
  addItems?: string[];
  removeItems?: string[];
}

export interface Scene {
  id: string;
  day: DayNumber;
  time: TimeOfDay;
  title?: string;
  icon?: string;
  location?: string;
  text: string[];
  choices: Choice[];
  autoNext?: string;
  isGameOver?: boolean;
  isVictory?: boolean;
}
