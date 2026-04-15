import type { Scene } from '../types';

export const day3Scenes: Scene[] = [
  {
    id: 'd3_start', day: 3, time: 'latenight',
    title: 'День третий. 01:00.', icon: 'fa-clock', location: 'Дом',
    text: [
      'Почти час ночи. Все спят.',
      'Три удара. Медленных. В дверь.',
    ],
    choices: [
      { id: 'c1', text: 'Посмотреть в глазок', nextSceneId: 'd3_peephole' },
      { id: 'c2', text: 'Использовать соль у двери', nextSceneId: 'd3_use_salt', requireItem: 'соль' },
      { id: 'c3', text: 'Разбудить родителей', nextSceneId: 'd3_wake_parents' },
    ],
  },
  {
    id: 'd3_peephole', day: 3, time: 'latenight',
    title: 'Конец.', icon: 'fa-skull', location: 'Прихожая',
    text: [
      'Ты смотришь в глазок. Коридор пуст.',
      'Но что-то смотрит в глазок с той стороны.',
      'Как игла в мозг. Ты падаешь.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd3_wake_parents', day: 3, time: 'latenight', icon: 'fa-person', location: 'Коридор',
    text: ['— Кто-то стучит. — Ночью? Наверное, сосед. Схожу открою. — Папа встаёт.'],
    choices: [
      { id: 'c1', text: 'Остановить — использовать соль', nextSceneId: 'd3_use_salt', requireItem: 'соль' },
      { id: 'c2', text: 'Позволить открыть дверь', nextSceneId: 'd3_dad_opens' },
      { id: 'c3', text: 'Остановить словами', nextSceneId: 'd3_stop_no_salt' },
    ],
  },
  {
    id: 'd3_stop_no_salt', day: 3, time: 'latenight', icon: 'fa-exclamation-triangle', location: 'Коридор',
    text: ['— Папа, не открывай! — Иди спать. Он открывает дверь.'],
    choices: [{ id: 'c1', text: '...', nextSceneId: 'd3_dad_opens' }],
  },
  {
    id: 'd3_dad_opens', day: 3, time: 'latenight',
    title: 'Конец.', icon: 'fa-skull', location: 'Прихожая',
    text: [
      'Папа открывает дверь. Снаружи — темнота.',
      '— Видишь? Никого. — Потом замолкает.',
      'Из темноты выходит что-то. Папа исчезает.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd3_use_salt', day: 3, time: 'latenight', icon: 'fa-shield', location: 'Прихожая',
    text: [
      'Ты рассыпаешь соль вдоль порога.',
      'Стук прекращается мгновенно. Удаляющиеся шаги.',
      'Оно ушло.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться спать', nextSceneId: 'd3_after_salt', removeItems: ['соль'] }],
  },
  {
    id: 'd3_after_salt', day: 3, time: 'night', icon: 'fa-moon', location: 'Спальня',
    text: ['Правила работают. Ты засыпаешь только под утро.'],
    choices: [{ id: 'c1', text: 'Следующий день →', nextSceneId: 'd4_start' }],
  },
];
