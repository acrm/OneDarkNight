import type { Scene } from '../types';

export const day3Scenes: Scene[] = [
  {
    id: 'd3_start', day: 3, time: 'latenight',
    title: 'День третий. 01:00.', icon: 'fa-clock', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: ['living-room', 'bathroom', 'parents-bedroom'],
    text: [
      'Почти час ночи. Все спят.',
      'Три удара. Медленных. В дверь.',
    ],
    choices: [
      {
        id: 'c1',
        text: 'Посмотреть в глазок',
        nextSceneId: 'd3_peephole',
        consequenceType: 'instant-fatal',
        consequenceNote: 'Ночное правило глазка нарушено.',
      },
      { id: 'c2', text: 'Использовать соль у двери', nextSceneId: 'd3_use_salt', requireItem: 'соль' },
      { id: 'c3', text: 'Разбудить родителей', nextSceneId: 'd3_wake_parents' },
      {
        id: 'c4',
        text: 'Попробовать открыть дверь и выйти',
        nextSceneId: 'd3_blocked_door',
        consequenceType: 'escalation',
        consequenceNote: 'С 02:00 до 03:00 дверь блокируется и это злит сущность.',
        threatDelta: 1,
      },
    ],
  },
  {
    id: 'd3_peephole', day: 3, time: 'latenight',
    title: 'Конец.', icon: 'fa-skull', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: [],
    text: [
      'Ты смотришь в глазок. Коридор пуст.',
      'Но что-то смотрит в глазок с той стороны.',
      'Как игла в мозг. Ты падаешь.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd3_blocked_door', day: 3, time: 'latenight', icon: 'fa-door-closed', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: ['living-room', 'parents-bedroom'],
    text: [
      'Ручка не двигается, будто дверь залили бетоном.',
      'С другой стороны кто-то медленно царапает дерево ногтями.',
      'Ты отдёргиваешь руку. Открывать нельзя. Не в это время.',
    ],
    choices: [
      { id: 'c1', text: 'Отойти и рассыпать соль', nextSceneId: 'd3_use_salt', requireItem: 'соль' },
      { id: 'c2', text: 'Разбудить родителей', nextSceneId: 'd3_wake_parents' },
    ],
  },
  {
    id: 'd3_wake_parents', day: 3, time: 'latenight', icon: 'fa-person', location: 'Коридор',
    roomId: 'hallway', nearbyRooms: ['parents-bedroom', 'living-room'],
    text: ['— Кто-то стучит. — Ночью? Наверное, сосед. Схожу открою. — Папа встаёт.'],
    choices: [
      { id: 'c1', text: 'Остановить — использовать соль', nextSceneId: 'd3_use_salt', requireItem: 'соль' },
      { id: 'c2', text: 'Позволить открыть дверь', nextSceneId: 'd3_dad_opens' },
      { id: 'c3', text: 'Остановить словами', nextSceneId: 'd3_stop_no_salt' },
    ],
  },
  {
    id: 'd3_stop_no_salt', day: 3, time: 'latenight', icon: 'fa-exclamation-triangle', location: 'Коридор',
    roomId: 'hallway', nearbyRooms: ['parents-bedroom'],
    text: ['— Папа, не открывай! — Иди спать. Он открывает дверь.'],
    choices: [{ id: 'c1', text: '...', nextSceneId: 'd3_dad_opens' }],
  },
  {
    id: 'd3_dad_opens', day: 3, time: 'latenight',
    title: 'Конец.', icon: 'fa-skull', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: [],
    text: [
      'Папа открывает дверь. Снаружи — темнота.',
      '— Видишь? Никого. — Потом замолкает.',
      'Из темноты выходит что-то. Папа исчезает.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd3_use_salt', day: 3, time: 'latenight', icon: 'fa-shield', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: ['living-room'],
    text: [
      'Ты рассыпаешь соль вдоль порога.',
      'Стук прекращается мгновенно. Удаляющиеся шаги.',
      'Оно ушло.',
    ],
    choices: [
      { id: 'c1', text: 'Вернуться спать', nextSceneId: 'd3_after_salt', removeItems: ['соль'] },
      { id: 'c2', text: 'Проверить гостиную и телевизор', nextSceneId: 'd3_tv_breach_intro', setFlags: { checked_tv_after_knock: true } },
    ],
  },
  {
    id: 'd3_tv_breach_intro', day: 3, time: 'latenight', icon: 'fa-tv', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['hallway'],
    tvEvent: {
      mode: 'entity-breach',
      message: 'Экран вспучивается, будто стекло стало жидким.',
    },
    text: [
      'Телевизор сам включается. Помехи становятся чёрным тоннелем.',
      'Из экрана вытягивается длинная рука и опирается на тумбу.',
      'Сущность пытается прорваться в комнату.',
    ],
    choices: [
      {
        id: 'c1',
        text: 'Спрятаться и переждать, не трогая телевизор',
        nextSceneId: 'd3_tv_breach_survive',
        setFlags: { survived_entity_breach: true },
      },
      {
        id: 'c2',
        text: 'Попытаться выключить телевизор',
        nextSceneId: 'd3_tv_breach_fail',
        consequenceType: 'instant-fatal',
        consequenceNote: 'Повторное нарушение ТВ-правила во время прорыва сущности.',
      },
    ],
  },
  {
    id: 'd3_tv_breach_fail', day: 3, time: 'latenight', title: 'Конец.', icon: 'fa-skull', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: [],
    text: [
      'Ты тянешься к кнопке питания.',
      'Рука из экрана хватает тебя за запястье и дёргает внутрь света.',
      'Комната пустеет за секунду.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd3_tv_breach_survive', day: 3, time: 'night', icon: 'fa-person-shelter', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['parents-bedroom'],
    tvEvent: {
      mode: 'normal',
      message: 'После 03:00 экран гаснет, сущность отступает.',
    },
    text: [
      'Ты не двигаешься, пока рука шарит по полу и втягивается назад.',
      'Под утро экран гаснет сам.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться спать', nextSceneId: 'd3_after_salt' }],
  },
  {
    id: 'd3_after_salt', day: 3, time: 'night', icon: 'fa-moon', location: 'Спальня',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: ['Правила работают. Ты засыпаешь только под утро.'],
    choices: [{ id: 'c1', text: 'Следующий день →', nextSceneId: 'd4_start' }],
  },
];
