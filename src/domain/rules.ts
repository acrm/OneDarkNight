import type { ConsequenceType, TimeOfDay } from './types';

export type RuleId =
  | 'no-scientist-distance'
  | 'no-peephole'
  | 'no-bathroom-mirror-0230'
  | 'no-tv-poweroff-horror'
  | 'door-lock-0200-0300';

export interface WorldRule {
  id: RuleId;
  title: string;
  description: string;
  forbiddenAction: string;
  timeWindow: TimeOfDay[];
  defaultConsequence: ConsequenceType;
}

export interface RulebookPage {
  id: number;
  title: string;
  lines: string[];
}

export const RULES_CATALOG: WorldRule[] = [
  {
    id: 'no-scientist-distance',
    title: 'Дистанция от соседа-учёного',
    description: 'Не подходи к соседу-учёному ближе чем на 15 метров.',
    forbiddenAction: 'Подойти слишком близко к соседу',
    timeWindow: ['morning', 'afternoon', 'evening'],
    defaultConsequence: 'instant-fatal',
  },
  {
    id: 'no-peephole',
    title: 'Запрет на глазок',
    description: 'Нельзя смотреть в глазок ночью.',
    forbiddenAction: 'Посмотреть в глазок',
    timeWindow: ['night', 'latenight'],
    defaultConsequence: 'instant-fatal',
  },
  {
    id: 'no-bathroom-mirror-0230',
    title: 'Зеркало в ванной',
    description: 'Около 02:30 нельзя смотреть в зеркало в ванной.',
    forbiddenAction: 'Смотреть в зеркало в ванной ночью',
    timeWindow: ['latenight'],
    defaultConsequence: 'deferred-fatal',
  },
  {
    id: 'no-tv-poweroff-horror',
    title: 'Телевизор во время хоррор-сигнала',
    description: 'Если телевизор мигает и показывает ужасы, его нельзя выключать.',
    forbiddenAction: 'Пытаться выключить телевизор во время хоррор-события',
    timeWindow: ['night', 'latenight'],
    defaultConsequence: 'escalation',
  },
  {
    id: 'door-lock-0200-0300',
    title: 'Блокировка двери',
    description: 'С 02:00 до 03:00 входная дверь полностью заблокирована.',
    forbiddenAction: 'Пытаться открыть или покинуть дом через входную дверь',
    timeWindow: ['latenight'],
    defaultConsequence: 'escalation',
  },
];

export const WORLD_RULES = RULES_CATALOG.map((rule) => rule.description) as readonly string[];

export const RULEBOOK_PAGES: RulebookPage[] = [
  {
    id: 1,
    title: 'Страница 1',
    lines: [
      'Если хочешь дожить до утра, читай и не спорь.',
      'Нарушение правил не всегда убивает сразу.',
      'Но дом всегда запоминает долг.',
    ],
  },
  {
    id: 2,
    title: 'Страница 2',
    lines: [
      'Правило 1: не подходи к соседу-учёному ближе 15 метров.',
      'Он может выглядеть обычным, но это только издалека.',
    ],
  },
  {
    id: 3,
    title: 'Страница 3',
    lines: [
      'Правило 2: ночью не смотри в глазок.',
      'Даже если слышишь знакомый голос за дверью.',
    ],
  },
  {
    id: 4,
    title: 'Страница 4',
    lines: [
      'Правило 3: около 02:30 не смотри в зеркало в ванной.',
      'Отражение не всегда повторяет тебя.',
    ],
  },
  {
    id: 5,
    title: 'Страница 5',
    lines: [
      'Правило 4: если телевизор мигает и показывает ужас, не выключай его.',
      'Попытка выключить ускоряет их приход.',
    ],
  },
  {
    id: 6,
    title: 'Страница 6',
    lines: [
      'Правило 5: с 02:00 до 03:00 не трогай входную дверь.',
      'Она все равно не откроется, а шум привлечет внимание.',
    ],
  },
  {
    id: 7,
    title: 'Страница 7',
    lines: [
      'Если в 01:00 кто-то стучит: молчи, жди, используй соль.',
      'Главное правило: дожить до рассвета, даже если страшно.',
    ],
  },
];
