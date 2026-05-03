export type DayNumber = 1 | 2 | 3 | 4 | 5;
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'latenight';
export type ThreatStage = 'calm' | 'uneasy' | 'hostile' | 'breach';
export type ConsequenceType = 'instant-fatal' | 'deferred-fatal' | 'escalation' | 'reversible';
export type ItemCategory = 'useful' | 'atmospheric' | 'experimental';
export type RoomId =
  | 'living-room'
  | 'kitchen'
  | 'bathroom'
  | 'hallway'
  | 'parents-bedroom'
  | 'kids-bedroom'
  | 'attic';

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  description?: string;
}

export interface GameState {
  day: DayNumber;
  time: TimeOfDay;
  alive: boolean;
  won: boolean;
  inventory: string[];
  flags: Record<string, boolean>;
  threatLevel: number;
  threatStage: ThreatStage;
  doomCounter: number;
  currentRoomId: RoomId;
  consequenceLog: string[];
  currentSceneId: string;
}

export interface Choice {
  id: string;
  text: string;
  nextSceneId: string;
  isDeadly?: boolean;
  consequenceType?: ConsequenceType;
  consequenceNote?: string;
  threatDelta?: number;
  doomDelta?: number;
  clearFlags?: string[];
  moveToRoom?: RoomId;
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
  roomId?: RoomId;
  nearbyRooms?: RoomId[];
  tvEvent?: {
    mode: 'normal' | 'horror' | 'entity-breach';
    message: string;
  };
  text: string[];
  choices: Choice[];
  autoNext?: string;
  isGameOver?: boolean;
  isVictory?: boolean;
}
