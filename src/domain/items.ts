import type { ItemDefinition } from './types';

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    id: 'salt',
    name: 'соль',
    category: 'useful',
    description: 'Защитный ресурс против ночных угроз.',
  },
  {
    id: 'food',
    name: 'еда',
    category: 'useful',
    description: 'Ресурс на ночь для сохранения сил.',
  },
  {
    id: 'milk',
    name: 'молоко',
    category: 'useful',
    description: 'Базовая бытовая потребность семьи.',
  },
  {
    id: 'rulebook',
    name: 'тетрадь с правилами',
    category: 'useful',
    description: 'Тетрадь с буквальным текстом правил выживания в доме.',
  },
  {
    id: 'bracelet',
    name: 'браслет',
    category: 'experimental',
    description: 'Странный предмет с неясным эффектом.',
  },
  {
    id: 'old-book',
    name: 'старая книга',
    category: 'atmospheric',
    description: 'Атмосферный предмет с намёками на прошлое дома.',
  },
  {
    id: 'flesh-gun-hint',
    name: 'подсказка о живом пистолете',
    category: 'atmospheric',
    description: 'Нарративный след к скрытому оружию в ванной трубе.',
  },
];

export const ITEM_CATEGORY_LABELS = {
  useful: 'Полезное',
  atmospheric: 'Атмосферное',
  experimental: 'Экспериментальное',
} as const;
