import type { Scene } from '../types';

export const day1Scenes: Scene[] = [
  {
    id: 'd1_start', day: 1, time: 'morning',
    title: 'День первый. Утро.', icon: 'fa-sun', location: 'Дом',
    roomId: 'kitchen', nearbyRooms: ['living-room', 'hallway'],
    text: [
      'Семья переехала в дом, доставшийся от бабушки. Старые стены, скрипящие половицы.',
      'На кухонном столе лежит пожелтевшая тетрадь с правилами. Ты успел прочитать её до того, как родители её выбросили.',
      'Мама заходит в комнату:',
      '— Ты не мог бы посидеть с братом? Нам нужно разобраться с документами.',
    ],
    choices: [
      { id: 'c1', text: 'Согласиться', nextSceneId: 'd1_babysit_yes' },
      { id: 'c2', text: 'Отказаться', nextSceneId: 'd1_babysit_no' },
    ],
  },
  {
    id: 'd1_babysit_no', day: 1, time: 'morning',
    icon: 'fa-person-walking-arrow-right', location: 'Дом',
    roomId: 'kitchen', nearbyRooms: ['kids-bedroom', 'hallway'],
    text: [
      'Ты отказываешься. Мама смотрит разочарованно, но не настаивает.',
      'Брат начинает плакать сам по себе. Плач становится громче — странным, монотонным.',
    ],
    choices: [
      { id: 'c1', text: 'Проверить брата', nextSceneId: 'd1_brother_crying' },
      { id: 'c2', text: 'Игнорировать', nextSceneId: 'd1_ignore_brother' },
    ],
  },
  {
    id: 'd1_ignore_brother', day: 1, time: 'morning',
    title: 'Конец.', icon: 'fa-skull', location: 'Дом',
    roomId: 'kids-bedroom', nearbyRooms: [],
    text: [
      'Плач прекращается. Слишком резко.',
      'Когда ты наконец идёшь проверить — комната брата пуста.',
      'Окно открыто. На подоконнике — маленький ботинок.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd1_babysit_yes', day: 1, time: 'morning',
    icon: 'fa-baby', location: 'Детская',
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: [
      'Ты остаёшься с братом. Через час он начинает плакать. Молока нет.',
    ],
    choices: [
      { id: 'c1', text: 'Идти в магазин за молоком', nextSceneId: 'd1_go_shop' },
      { id: 'c2', text: 'Попробовать успокоить без молока', nextSceneId: 'd1_no_milk_try' },
    ],
  },
  {
    id: 'd1_no_milk_try', day: 1, time: 'morning',
    icon: 'fa-baby', location: 'Детская',
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: ['Ты пытаешься петь колыбельную. Брат ревёт ещё громче. Нужно молоко.'],
    choices: [{ id: 'c1', text: 'Идти в магазин', nextSceneId: 'd1_go_shop' }],
  },
  {
    id: 'd1_go_shop', day: 1, time: 'morning',
    icon: 'fa-store', location: 'Улица',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: [
      'Ты выходишь на улицу. У забора стоит сосед-учёный в белом халате. Он смотрит в твою сторону.',
    ],
    choices: [
      { id: 'c1', text: 'Идти прямо, не приближаясь к нему', nextSceneId: 'd1_shop_arrive' },
      { id: 'c2', text: 'Подойти ближе', nextSceneId: 'd1_scientist_too_close' },
    ],
  },
  {
    id: 'd1_scientist_too_close', day: 1, time: 'morning',
    title: 'Конец.', icon: 'fa-skull', location: 'Улица',
    roomId: 'hallway', nearbyRooms: [],
    text: [
      'На расстоянии пяти метров ты чувствуешь резкую боль в голове.',
      'Последнее, что ты видишь — его улыбка.',
    ],
    choices: [], isGameOver: true,
  },
  {
    id: 'd1_shop_arrive', day: 1, time: 'morning',
    icon: 'fa-store', location: 'Магазин',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: [
      'Ты покупаешь молоко. На выходе замечаешь мужчину с браслетом на запястье — непонятные символы.',
      'Он смотрит прямо на тебя.',
    ],
    choices: [
      { id: 'c1', text: 'Быстро уйти', nextSceneId: 'd1_back_home', addItems: ['молоко'] },
      { id: 'c2', text: 'Спросить, кто он', nextSceneId: 'd1_stranger_intro', addItems: ['молоко'] },
    ],
  },
  {
    id: 'd1_stranger_intro', day: 1, time: 'morning',
    icon: 'fa-circle-question', location: 'Магазин',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: [
      '— Ты в том доме живёшь? — говорит он тихо.',
      '— Слушай правила. Они написаны для тебя. Остальные... не справились.',
      'Он уходит, не оборачиваясь.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd1_back_home' }],
  },
  {
    id: 'd1_back_home', day: 1, time: 'afternoon',
    icon: 'fa-house', location: 'Дом',
    roomId: 'living-room', nearbyRooms: ['kitchen', 'bathroom', 'hallway'],
    text: ['Ты кормишь брата. Он засыпает. Родители возвращаются вечером. Свободное время.'],
    choices: [
      { id: 'c1', text: 'Смотреть телевизор', nextSceneId: 'd1_tv' },
      { id: 'c2', text: 'Принять душ', nextSceneId: 'd1_shower' },
      { id: 'c3', text: 'Почитать книгу', nextSceneId: 'd1_read' },
    ],
  },
  {
    id: 'd1_tv', day: 1, time: 'evening', icon: 'fa-tv', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['hallway'],
    tvEvent: {
      mode: 'normal',
      message: 'Пока это только странные помехи без явной угрозы.',
    },
    text: ['Телевизор, новости, сериал. В 23:00 экран мигает. Кажется, в помехах виден силуэт.'],
    choices: [{ id: 'c1', text: 'Лечь спать', nextSceneId: 'd1_night_ends' }],
  },
  {
    id: 'd1_shower', day: 1, time: 'evening', icon: 'fa-shower', location: 'Ванная',
    roomId: 'bathroom', nearbyRooms: ['hallway'],
    text: [
      'Когда зеркало проясняется, ты видишь на нём слово, написанное пальцем:',
      '«СЛУШАЙ»',
    ],
    choices: [{ id: 'c1', text: 'Лечь спать', nextSceneId: 'd1_night_ends', setFlags: { saw_mirror: true } }],
  },
  {
    id: 'd1_read', day: 1, time: 'evening', icon: 'fa-book', location: 'Комната',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: [
      'Между страницами старой книги — сложенный листок с теми же правилами.',
      'Кто-то жил здесь до вас. И оставил напоминание.',
    ],
    choices: [{ id: 'c1', text: 'Лечь спать', nextSceneId: 'd1_night_ends', setFlags: { found_note: true }, addItems: ['старая книга'] }],
  },
  {
    id: 'd1_night_ends', day: 1, time: 'night', icon: 'fa-moon', location: 'Спальня',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: ['Ночь первая. Тихо. Ты засыпаешь.'],
    choices: [{ id: 'c1', text: 'Следующий день →', nextSceneId: 'd2_start' }],
  },
  {
    id: 'd1_brother_crying', day: 1, time: 'morning', icon: 'fa-baby', location: 'Детская',
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: ['Брат сидит и смотрит в угол. Не реагирует на имя.'],
    choices: [
      { id: 'c1', text: 'Взять его на руки', nextSceneId: 'd1_babysit_yes' },
      { id: 'c2', text: 'Посмотреть в тот угол', nextSceneId: 'd1_corner_look' },
    ],
  },
  {
    id: 'd1_corner_look', day: 1, time: 'morning', icon: 'fa-eye', location: 'Детская',
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: [
      'За обоями нацарапано: «НЕ СМОТРИ В ЕГО СТОРОНУ ПОСЛЕ ЗАКАТА».',
    ],
    choices: [{ id: 'c1', text: 'Взять брата на руки', nextSceneId: 'd1_babysit_yes', setFlags: { saw_corner_warning: true } }],
  },
];
