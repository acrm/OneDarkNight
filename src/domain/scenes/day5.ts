import type { Scene } from '../types';

export const day5Scenes: Scene[] = [
  {
    id: 'd5_start', day: 5, time: 'evening',
    title: 'День пятый. Финал.', icon: 'fa-moon', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['kitchen', 'hallway', 'bathroom'],
    text: ['Пятая ночь. Последняя. Дом скрипит. В 23:45 начинается.'],
    choices: [
      { id: 'c1', text: 'Подготовить семью к ночи', nextSceneId: 'd5_knocking' },
      { id: 'c2', text: 'Проверить зеркало в ванной ещё раз', nextSceneId: 'd5_mirror_payoff', requireFlag: 'mirror_rule_broken' },
    ],
  },
  {
    id: 'd5_mirror_payoff', day: 5, time: 'evening', icon: 'fa-skull', location: 'Ванная',
    roomId: 'bathroom', nearbyRooms: [],
    text: [
      'Зеркало запотело само. На нём проступает твое имя, перечёркнутое три раза.',
      'Ладонь из отражения касается стекла изнутри. Секундой позже ты перестаёшь дышать.',
      'Нарушение ночью вернулось за долгом на следующем витке.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd5_knocking', day: 5, time: 'latenight', icon: 'fa-door-closed', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: ['living-room', 'parents-bedroom', 'kids-bedroom'],
    text: [
      'Стук в дверь. Скрежет по окну. Одновременно.',
      'Свет не включать.',
    ],
    choices: [
      { id: 'c1', text: 'Посмотреть в глазок', nextSceneId: 'd5_peephole_death' },
      { id: 'c2', text: 'Закрыть шторы и спрятаться', nextSceneId: 'd5_hide' },
      { id: 'c3', text: 'Разбудить семью и спрятаться вместе', nextSceneId: 'd5_hide_together' },
      { id: 'c4', text: 'Проверить телевизор в гостиной', nextSceneId: 'd5_tv_final' },
    ],
  },
  {
    id: 'd5_peephole_death', day: 5, time: 'latenight',
    title: 'Конец.', icon: 'fa-skull', location: 'Прихожая',
    roomId: 'hallway', nearbyRooms: [],
    text: [
      'По ту сторону — белое лицо. Без глаз. Без носа.',
      'Только огромный рот. Он улыбается.',
      'Темнота.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd5_tv_final', day: 5, time: 'latenight', icon: 'fa-tv', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['hallway'],
    tvEvent: {
      mode: 'entity-breach',
      message: 'Из экрана выходят две фигуры и ползут к порогу комнаты.',
    },
    text: [
      'Телевизор уже включен. На экране пустая гостиная и камера, направленная на тебя.',
      'Помехи отступают, и из стекла выходят сущности в человеческий рост.',
      'Теперь только тишина и укрытие.',
    ],
    choices: [
      { id: 'c1', text: 'Быстро уйти и спрятаться с семьёй', nextSceneId: 'd5_hide_together' },
      {
        id: 'c2',
        text: 'Выключить телевизор',
        nextSceneId: 'd5_tv_final_death',
        consequenceType: 'instant-fatal',
        consequenceNote: 'Финальная попытка выключить ТВ во время прорыва сущностей.',
      },
    ],
  },
  {
    id: 'd5_tv_final_death', day: 5, time: 'latenight', title: 'Конец.', icon: 'fa-skull', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: [],
    text: [
      'Ты жмёшь кнопку питания.',
      'Фигуры синхронно поворачивают головы и бросаются на тебя, как на сигнал.',
      'Комната замолкает навсегда.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd5_hide', day: 5, time: 'latenight', icon: 'fa-person-shelter', location: 'Комната',
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: [
      'Ты задёргиваешь шторы. Прячешься в шкафу.',
      'Стук усиливается. Скрежет по периметру дома.',
      'В 03:00 всё прекращается.',
    ],
    choices: [{ id: 'c1', text: 'Выйти из укрытия', nextSceneId: 'd5_survive_alone' }],
  },
  {
    id: 'd5_hide_together', day: 5, time: 'latenight', icon: 'fa-people-roof', location: 'Комната',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway', 'kids-bedroom'],
    text: [
      'Ты будишь семью. — Всем спрятаться. Молчать. Не открывать.',
      'Снаружи — стук, скрежет, шёпот. В 03:00 — тишина.',
    ],
    choices: [{ id: 'c1', text: 'Выглянуть', nextSceneId: 'd5_survive_together' }],
  },
  {
    id: 'd5_survive_alone', day: 5, time: 'morning', icon: 'fa-sun', location: 'Дом',
    roomId: 'kitchen', nearbyRooms: ['living-room'],
    text: [
      'Рассвет. Всё тихо. Родители пьют кофе.',
      'Брат смотрит на тебя: — Ты защитил нас?',
      'Ты киваешь. Он улыбается.',
    ],
    choices: [{ id: 'c1', text: 'Финал', nextSceneId: 'd5_victory' }],
  },
  {
    id: 'd5_survive_together', day: 5, time: 'morning', icon: 'fa-sun', location: 'Дом',
    roomId: 'kitchen', nearbyRooms: ['living-room'],
    text: [
      'Рассвет. Семья рядом.',
      'Сосед-учёный идёт по улице. Останавливается. Кивает тебе.',
    ],
    choices: [{ id: 'c1', text: 'Финал', nextSceneId: 'd5_victory' }],
  },
  {
    id: 'd5_victory', day: 5, time: 'morning',
    title: 'Вы выжили.', icon: 'fa-star', location: '',
    roomId: 'living-room', nearbyRooms: [],
    text: [
      'Пять дней.',
      'Дом испытывал вас. Вы прошли.',
      'Правила больше не нужны — угроза ушла.',
      '',
      '«One Dark Night» — завершено.',
    ],
    choices: [], isVictory: true,
  },
];
