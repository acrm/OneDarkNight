import type { RoomId } from './types';

export interface RoomNode {
  id: RoomId;
  label: string;
  floor: 1 | 2 | 3;
  adjacent: RoomId[];
}

export const HOUSE_MAP: RoomNode[] = [
  {
    id: 'living-room',
    label: 'Гостиная',
    floor: 1,
    adjacent: ['kitchen', 'hallway'],
  },
  {
    id: 'kitchen',
    label: 'Кухня',
    floor: 1,
    adjacent: ['living-room', 'hallway'],
  },
  {
    id: 'bathroom',
    label: 'Ванная',
    floor: 1,
    adjacent: ['hallway'],
  },
  {
    id: 'hallway',
    label: 'Прихожая',
    floor: 1,
    adjacent: ['living-room', 'kitchen', 'bathroom', 'parents-bedroom', 'kids-bedroom', 'attic'],
  },
  {
    id: 'parents-bedroom',
    label: 'Спальня родителей',
    floor: 2,
    adjacent: ['hallway', 'kids-bedroom'],
  },
  {
    id: 'kids-bedroom',
    label: 'Детская',
    floor: 2,
    adjacent: ['hallway', 'parents-bedroom'],
  },
  {
    id: 'attic',
    label: 'Чердак',
    floor: 3,
    adjacent: ['hallway'],
  },
];

export const ROOM_LABELS: Record<RoomId, string> = HOUSE_MAP.reduce(
  (acc, room) => {
    acc[room.id] = room.label;
    return acc;
  },
  {} as Record<RoomId, string>
);
