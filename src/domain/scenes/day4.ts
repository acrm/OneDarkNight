import type { Scene } from '../types';

export const day4Scenes: Scene[] = [
  {
    id: 'd4_start', day: 4, time: 'morning',
    title: 'День четвёртый.', icon: 'fa-hospital', location: 'Больница',
    text: [
      'Ты приходишь в себя. Белые стены. Капельница.',
      'Мама: — Ты упал в обморок. Мы испугались.',
    ],
    choices: [
      { id: 'c1', text: 'Спросить, что случилось', nextSceneId: 'd4_ask' },
      { id: 'c2', text: 'Притвориться, что всё хорошо', nextSceneId: 'd4_ok' },
    ],
  },
  {
    id: 'd4_ask', day: 4, time: 'morning', icon: 'fa-circle-question', location: 'Больница',
    text: ['— Нашли тебя на полу в прихожей. Рядом была рассыпана соль. Нервное истощение.'],
    choices: [{ id: 'c1', text: 'Кивнуть', nextSceneId: 'd4_room' }],
  },
  {
    id: 'd4_ok', day: 4, time: 'morning', icon: 'fa-face-smile', location: 'Больница',
    text: ['— Всё нормально. Не выспался.'],
    choices: [{ id: 'c1', text: 'Осмотреться', nextSceneId: 'd4_room' }],
  },
  {
    id: 'd4_room', day: 4, time: 'afternoon', icon: 'fa-hospital', location: 'Палата',
    text: [
      'Родители выходят. Входит врач — это тот мужчина с браслетом.',
      '— Ты выдержал третью ночь. Передай этот браслет одному человеку.',
    ],
    choices: [
      { id: 'c1', text: 'Взять браслет', nextSceneId: 'd4_take', addItems: ['браслет'] },
      { id: 'c2', text: 'Отказаться', nextSceneId: 'd4_refuse' },
    ],
  },
  {
    id: 'd4_take', day: 4, time: 'afternoon', icon: 'fa-circle-exclamation', location: 'Палата',
    text: ['Браслет холодный. — Кому передать? — Ты узнаешь.'],
    choices: [
      { id: 'c1', text: 'Надеть браслет', nextSceneId: 'd4_wear' },
      { id: 'c2', text: 'Убрать в карман', nextSceneId: 'd4_keep' },
    ],
  },
  {
    id: 'd4_wear', day: 4, time: 'afternoon',
    title: 'Конец.', icon: 'fa-skull', location: 'Палата',
    text: ['Браслет касается кожи. Резкая боль. Тело не слушается. Темнота.'],
    choices: [], isGameOver: true,
  },
  {
    id: 'd4_keep', day: 4, time: 'afternoon', icon: 'fa-box', location: 'Больница',
    text: ['Убираешь в карман. Родители возвращаются. Тебя отпускают домой.'],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd4_home' }],
  },
  {
    id: 'd4_refuse', day: 4, time: 'afternoon', icon: 'fa-hand', location: 'Палата',
    text: [
      '— Нет. — Тогда будь готов к пятой ночи. Один.',
      'Он уходит без браслета.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd4_home', setFlags: { refused_bracelet: true } }],
  },
  {
    id: 'd4_home', day: 4, time: 'evening', icon: 'fa-house', location: 'Дом',
    text: ['Дом встречает тишиной. Соли больше нет. Завтра — последний день.'],
    choices: [{ id: 'c1', text: 'Лечь спать', nextSceneId: 'd4_night' }],
  },
  {
    id: 'd4_night', day: 4, time: 'night', icon: 'fa-moon', location: 'Спальня',
    text: ['Завтра всё кончится. Так или иначе.'],
    choices: [{ id: 'c1', text: 'Следующий день →', nextSceneId: 'd5_start' }],
  },
];
