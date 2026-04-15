import type { Scene } from '../types';

export const day5Scenes: Scene[] = [
  {
    id: 'd5_start', day: 5, time: 'evening',
    title: 'День пятый. Финал.', icon: 'fa-moon', location: 'Дом',
    text: ['Пятая ночь. Последняя. Дом скрипит. В 23:45 начинается.'],
    choices: [{ id: 'c1', text: 'Продолжить', nextSceneId: 'd5_knocking' }],
  },
  {
    id: 'd5_knocking', day: 5, time: 'latenight', icon: 'fa-door-closed', location: 'Прихожая',
    text: [
      'Стук в дверь. Скрежет по окну. Одновременно.',
      'Свет не включать.',
    ],
    choices: [
      { id: 'c1', text: 'Посмотреть в глазок', nextSceneId: 'd5_peephole_death' },
      { id: 'c2', text: 'Закрыть шторы и спрятаться', nextSceneId: 'd5_hide' },
      { id: 'c3', text: 'Разбудить семью и спрятаться вместе', nextSceneId: 'd5_hide_together' },
    ],
  },
  {
    id: 'd5_peephole_death', day: 5, time: 'latenight',
    title: 'Конец.', icon: 'fa-skull', location: 'Прихожая',
    text: [
      'По ту сторону — белое лицо. Без глаз. Без носа.',
      'Только огромный рот. Он улыбается.',
      'Темнота.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd5_hide', day: 5, time: 'latenight', icon: 'fa-person-shelter', location: 'Комната',
    text: [
      'Ты задёргиваешь шторы. Прячешься в шкафу.',
      'Стук усиливается. Скрежет по периметру дома.',
      'В 03:00 всё прекращается.',
    ],
    choices: [{ id: 'c1', text: 'Выйти из укрытия', nextSceneId: 'd5_survive_alone' }],
  },
  {
    id: 'd5_hide_together', day: 5, time: 'latenight', icon: 'fa-people-roof', location: 'Комната',
    text: [
      'Ты будишь семью. — Всем спрятаться. Молчать. Не открывать.',
      'Снаружи — стук, скрежет, шёпот. В 03:00 — тишина.',
    ],
    choices: [{ id: 'c1', text: 'Выглянуть', nextSceneId: 'd5_survive_together' }],
  },
  {
    id: 'd5_survive_alone', day: 5, time: 'morning', icon: 'fa-sun', location: 'Дом',
    text: [
      'Рассвет. Всё тихо. Родители пьют кофе.',
      'Брат смотрит на тебя: — Ты защитил нас?',
      'Ты киваешь. Он улыбается.',
    ],
    choices: [{ id: 'c1', text: 'Финал', nextSceneId: 'd5_victory' }],
  },
  {
    id: 'd5_survive_together', day: 5, time: 'morning', icon: 'fa-sun', location: 'Дом',
    text: [
      'Рассвет. Семья рядом.',
      'Сосед-учёный идёт по улице. Останавливается. Кивает тебе.',
    ],
    choices: [{ id: 'c1', text: 'Финал', nextSceneId: 'd5_victory' }],
  },
  {
    id: 'd5_victory', day: 5, time: 'morning',
    title: 'Вы выжили.', icon: 'fa-star', location: '',
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
