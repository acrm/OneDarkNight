import type { Scene } from '../types';

export const day2Scenes: Scene[] = [
  {
    id: 'd2_start', day: 2, time: 'morning',
    title: 'День второй.', icon: 'fa-cloud', location: 'Дом',
    text: [
      'Брат сидит на полу и смотрит в одну точку у окна. Не реагирует на имя.',
    ],
    choices: [
      { id: 'c1', text: 'Потрясти его', nextSceneId: 'd2_shake_brother' },
      { id: 'c2', text: 'Позвать родителей', nextSceneId: 'd2_call_parents' },
      { id: 'c3', text: 'Наблюдать молча', nextSceneId: 'd2_observe' },
    ],
  },
  {
    id: 'd2_observe', day: 2, time: 'morning', icon: 'fa-eye', location: 'Детская',
    text: [
      'Брат поворачивает голову. Глаза пустые.',
      '— Он приходил. Ночью. Стоял здесь.',
      'После этого брат засыпает прямо на полу.',
    ],
    choices: [{ id: 'c1', text: 'Отнести в кровать', nextSceneId: 'd2_normal_morning', setFlags: { brother_warned: true } }],
  },
  {
    id: 'd2_shake_brother', day: 2, time: 'morning', icon: 'fa-baby', location: 'Детская',
    text: ['Брат истерит. Прибегают родители. Папа смотрит на тебя: — Не надо его пугать.'],
    choices: [{ id: 'c1', text: 'Уйти', nextSceneId: 'd2_normal_morning' }],
  },
  {
    id: 'd2_call_parents', day: 2, time: 'morning', icon: 'fa-person', location: 'Дом',
    text: ['Когда родители приходят — брат уже нормально играет. — Ты перегрелся? — говорит папа.'],
    choices: [{ id: 'c1', text: 'Продолжить день', nextSceneId: 'd2_normal_morning' }],
  },
  {
    id: 'd2_normal_morning', day: 2, time: 'afternoon', icon: 'fa-house', location: 'Дом',
    text: ['Снова нет молока. Мама просит сходить в магазин.'],
    choices: [{ id: 'c1', text: 'Пойти в магазин', nextSceneId: 'd2_shop' }],
  },
  {
    id: 'd2_shop', day: 2, time: 'afternoon', icon: 'fa-store', location: 'Магазин',
    text: [
      'В магазине снова тот мужчина с браслетом.',
      '— Сегодня ночью будет стук. Помни: соль.',
    ],
    choices: [
      { id: 'c1', text: 'Купить молоко и соль', nextSceneId: 'd2_buy_both', addItems: ['молоко', 'соль'] },
      { id: 'c2', text: 'Купить только молоко', nextSceneId: 'd2_buy_milk_only', addItems: ['молоко'] },
    ],
  },
  {
    id: 'd2_buy_both', day: 2, time: 'afternoon', icon: 'fa-bag-shopping', location: 'Магазин',
    text: ['Ты берёшь молоко и пачку соли.'],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd2_evening', setFlags: { has_salt: true } }],
  },
  {
    id: 'd2_buy_milk_only', day: 2, time: 'afternoon', icon: 'fa-bag-shopping', location: 'Магазин',
    text: ['Ты берёшь только молоко.'],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd2_evening' }],
  },
  {
    id: 'd2_evening', day: 2, time: 'evening', icon: 'fa-house', location: 'Дом',
    text: ['Вечер. Тихо. Слишком тихо.'],
    choices: [{ id: 'c1', text: 'Лечь спать', nextSceneId: 'd2_night' }],
  },
  {
    id: 'd2_night', day: 2, time: 'night', icon: 'fa-moon', location: 'Спальня',
    text: ['Ночь тянется медленно.'],
    choices: [{ id: 'c1', text: 'Следующий день →', nextSceneId: 'd3_start' }],
  },
];
