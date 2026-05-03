import type { Scene } from '../types';

export const day2Scenes: Scene[] = [
  {
    id: 'd2_start', day: 2, time: 'morning',
    title: 'День второй.', icon: 'fa-cloud', location: 'Детская',
    roomId: 'kids-bedroom', nearbyRooms: ['parents-bedroom', 'hallway'],
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
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: [
      'Брат поворачивает голову. Глаза пустые.',
      '— Он приходил. Ночью. Стоял здесь.',
      'После этого брат засыпает прямо на полу.',
    ],
    choices: [{ id: 'c1', text: 'Отнести в кровать', nextSceneId: 'd2_normal_morning', setFlags: { brother_warned: true } }],
  },
  {
    id: 'd2_shake_brother', day: 2, time: 'morning', icon: 'fa-baby', location: 'Детская',
    roomId: 'kids-bedroom', nearbyRooms: ['hallway'],
    text: ['Брат истерит. Прибегают родители. Папа смотрит на тебя: — Не надо его пугать.'],
    choices: [{ id: 'c1', text: 'Уйти', nextSceneId: 'd2_normal_morning' }],
  },
  {
    id: 'd2_call_parents', day: 2, time: 'morning', icon: 'fa-person', location: 'Коридор',
    roomId: 'hallway', nearbyRooms: ['kids-bedroom', 'parents-bedroom'],
    text: ['Когда родители приходят — брат уже нормально играет. — Ты перегрелся? — говорит папа.'],
    choices: [{ id: 'c1', text: 'Продолжить день', nextSceneId: 'd2_normal_morning' }],
  },
  {
    id: 'd2_normal_morning', day: 2, time: 'afternoon', icon: 'fa-house', location: 'Кухня',
    roomId: 'kitchen', nearbyRooms: ['living-room', 'hallway'],
    text: ['Снова нет молока. Мама просит сходить в магазин. До вечера есть время подготовиться к ночи.'],
    choices: [
      { id: 'c1', text: 'Пойти в магазин', nextSceneId: 'd2_shop' },
      { id: 'c2', text: 'Осмотреть чердак в поисках полезного', nextSceneId: 'd2_attic_search' },
    ],
  },
  {
    id: 'd2_attic_search', day: 2, time: 'afternoon', icon: 'fa-box-open', location: 'Чердак',
    roomId: 'attic', nearbyRooms: ['hallway'],
    text: [
      'На чердаке пыль и старые коробки. В одной из них ты находишь банку соли и консерву.',
      'Этого должно хватить на одну тяжёлую ночь.',
    ],
    choices: [
      {
        id: 'c1',
        text: 'Взять находки и идти в магазин',
        nextSceneId: 'd2_shop',
        addItems: ['соль', 'еда'],
      },
    ],
  },
  {
    id: 'd2_shop', day: 2, time: 'afternoon', icon: 'fa-store', location: 'Магазин',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: [
      'В магазине снова тот мужчина с браслетом.',
      '— Сегодня ночью будет не только стук. Помни: соль. И не трогай телевизор, если он начнёт мигать.',
    ],
    choices: [
      { id: 'c1', text: 'Купить молоко, соль и еду', nextSceneId: 'd2_buy_both', addItems: ['молоко', 'соль', 'еда'] },
      { id: 'c2', text: 'Купить только молоко', nextSceneId: 'd2_buy_milk_only', addItems: ['молоко'] },
      { id: 'c3', text: 'Взять молоко и странный хлам с полки уценки', nextSceneId: 'd2_buy_random', addItems: ['молоко', 'случайный предмет'] },
    ],
  },
  {
    id: 'd2_buy_both', day: 2, time: 'afternoon', icon: 'fa-bag-shopping', location: 'Магазин',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: ['Ты берёшь молоко, соль и немного еды на ночь.'],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd2_evening', setFlags: { prepared_resources: true } }],
  },
  {
    id: 'd2_buy_milk_only', day: 2, time: 'afternoon', icon: 'fa-bag-shopping', location: 'Магазин',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: ['Ты берёшь только молоко.'],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd2_evening' }],
  },
  {
    id: 'd2_buy_random', day: 2, time: 'afternoon', icon: 'fa-puzzle-piece', location: 'Магазин',
    roomId: 'hallway', nearbyRooms: ['kitchen'],
    text: [
      'Ты хватаешь молоко и странный пакет с барахлом: батарейки, гвозди, старый брелок.',
      'Пользы может и не быть, но нервы это почему-то успокаивает.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd2_evening' }],
  },
  {
    id: 'd2_evening', day: 2, time: 'evening', icon: 'fa-house', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['kitchen', 'hallway'],
    text: ['Вечер. Тихо. Слишком тихо. Телевизор выключен, но от него идёт слабый треск.'],
    choices: [
      { id: 'c1', text: 'Лечь спать заранее', nextSceneId: 'd2_night' },
      { id: 'c2', text: 'Остаться в гостиной и наблюдать за телевизором', nextSceneId: 'd2_tv_horror_start' },
    ],
  },
  {
    id: 'd2_tv_horror_start', day: 2, time: 'night', icon: 'fa-tv', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['hallway'],
    tvEvent: {
      mode: 'horror',
      message: 'Экран мигает. На помехах проступает лицо, которого не может быть в кадре.',
    },
    text: [
      'В 00:40 телевизор включается сам.',
      'Помехи превращаются в рваные кадры чьей-то квартиры. Камера как будто медленно движется по твоему дому.',
      'Правило всплывает в голове: не выключать телевизор во время хоррор-сигнала.',
    ],
    choices: [
      {
        id: 'c1',
        text: 'Не трогать телевизор и переждать',
        nextSceneId: 'd2_tv_survive',
        setFlags: { tv_waited_once: true },
      },
      {
        id: 'c2',
        text: 'Выключить телевизор',
        nextSceneId: 'd2_tv_break_rule',
        setFlags: { tv_rule_broken: true },
        consequenceType: 'escalation',
        consequenceNote: 'Нарушение ТВ-правила усилило угрозу в доме.',
        threatDelta: 1,
        doomDelta: 1,
      },
    ],
  },
  {
    id: 'd2_tv_survive', day: 2, time: 'night', icon: 'fa-hourglass-half', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['hallway'],
    tvEvent: {
      mode: 'normal',
      message: 'К 01:00 экран гаснет сам. Тишина возвращается.',
    },
    text: [
      'Ты сидишь, не двигаясь, пока экран захлёбывается помехами.',
      'Ровно через несколько минут телевизор выключается сам.',
    ],
    choices: [{ id: 'c1', text: 'Уйти спать', nextSceneId: 'd2_night' }],
  },
  {
    id: 'd2_tv_break_rule', day: 2, time: 'night', icon: 'fa-bolt', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['hallway'],
    tvEvent: {
      mode: 'entity-breach',
      message: 'После щелчка выключения экран загорается кроваво-красным.',
    },
    text: [
      'Кнопка щёлкает, но экран не гаснет.',
      'Из динамиков идёт влажный скрип, будто кто-то ползёт внутри корпуса.',
      'Ты понимаешь, что теперь дом «помнит» ошибку.',
    ],
    choices: [{ id: 'c1', text: 'Отступить и дождаться утра', nextSceneId: 'd2_night' }],
  },
  {
    id: 'd2_night', day: 2, time: 'night', icon: 'fa-moon', location: 'Спальня',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway', 'kids-bedroom'],
    text: ['Ночь тянется медленно.'],
    choices: [{ id: 'c1', text: 'Следующий день →', nextSceneId: 'd3_start' }],
  },
];
