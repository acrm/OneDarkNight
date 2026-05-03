import type { Scene } from '../types';

export const day4Scenes: Scene[] = [
  {
    id: 'd4_start', day: 4, time: 'morning',
    title: 'День четвёртый.', icon: 'fa-hospital', location: 'Больница',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
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
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: ['— Нашли тебя на полу в прихожей. Рядом была рассыпана соль. Нервное истощение.'],
    choices: [{ id: 'c1', text: 'Кивнуть', nextSceneId: 'd4_room' }],
  },
  {
    id: 'd4_ok', day: 4, time: 'morning', icon: 'fa-face-smile', location: 'Больница',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: ['— Всё нормально. Не выспался.'],
    choices: [{ id: 'c1', text: 'Осмотреться', nextSceneId: 'd4_room' }],
  },
  {
    id: 'd4_room', day: 4, time: 'afternoon', icon: 'fa-hospital', location: 'Палата',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
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
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: ['Браслет холодный. — Кому передать? — Ты узнаешь.'],
    choices: [
      { id: 'c1', text: 'Надеть браслет', nextSceneId: 'd4_wear' },
      { id: 'c2', text: 'Убрать в карман', nextSceneId: 'd4_keep' },
    ],
  },
  {
    id: 'd4_wear', day: 4, time: 'afternoon',
    title: 'Конец.', icon: 'fa-skull', location: 'Палата',
    roomId: 'parents-bedroom', nearbyRooms: [],
    text: ['Браслет касается кожи. Резкая боль. Тело не слушается. Темнота.'],
    choices: [], isGameOver: true,
  },
  {
    id: 'd4_keep', day: 4, time: 'afternoon', icon: 'fa-box', location: 'Больница',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: ['Убираешь в карман. Родители возвращаются. Тебя отпускают домой.'],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd4_home' }],
  },
  {
    id: 'd4_refuse', day: 4, time: 'afternoon', icon: 'fa-hand', location: 'Палата',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway'],
    text: [
      '— Нет. — Тогда будь готов к пятой ночи. Один.',
      'Он уходит без браслета.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться домой', nextSceneId: 'd4_home', setFlags: { refused_bracelet: true } }],
  },
  {
    id: 'd4_home', day: 4, time: 'evening', icon: 'fa-house', location: 'Гостиная',
    roomId: 'living-room', nearbyRooms: ['bathroom', 'kitchen', 'hallway'],
    text: ['Дом встречает тишиной. Завтра — последний день. В ванной слышен металлический стук, будто в трубах что-то двигается.'],
    choices: [
      { id: 'c1', text: 'Проверить ванную', nextSceneId: 'd4_bathroom_pipe' },
      { id: 'c2', text: 'Игнорировать и лечь спать', nextSceneId: 'd4_night' },
    ],
  },
  {
    id: 'd4_bathroom_pipe', day: 4, time: 'evening', icon: 'fa-faucet-drip', location: 'Ванная',
    roomId: 'bathroom', nearbyRooms: ['hallway'],
    text: [
      'За экраном трубы что-то застряло в ржавой нише.',
      'Ты видишь свёрток с рисунком: пистолет с зубчатым «живым» стволом и подписью «кормить перед выстрелом».',
      'Похоже на подсказку, а не на оружие. Но кто-то явно оставил это специально.',
    ],
    choices: [
      {
        id: 'c1',
        text: 'Забрать подсказку и вернуться',
        nextSceneId: 'd4_night',
        addItems: ['подсказка о живом пистолете'],
        setFlags: { found_weapon_hint: true },
      },
    ],
  },
  {
    id: 'd4_night', day: 4, time: 'night', icon: 'fa-moon', location: 'Спальня',
    roomId: 'parents-bedroom', nearbyRooms: ['hallway', 'bathroom'],
    text: ['Около 02:30 ты просыпаешься от капающей воды в ванной.'],
    choices: [
      { id: 'c1', text: 'Пойти в ванную', nextSceneId: 'd4_mirror_decision' },
      { id: 'c2', text: 'Остаться в кровати до рассвета', nextSceneId: 'd5_start' },
    ],
  },
  {
    id: 'd4_mirror_decision', day: 4, time: 'latenight', icon: 'fa-moon', location: 'Ванная',
    roomId: 'bathroom', nearbyRooms: ['hallway'],
    text: [
      'Свет мерцает. В зеркале виден только тёмный силуэт у тебя за спиной.',
      'На секунду кажется, что силуэт ждёт именно твоего взгляда.',
    ],
    choices: [
      {
        id: 'c1',
        text: 'Поднять глаза и смотреть в зеркало',
        nextSceneId: 'd4_mirror_marked',
        setFlags: { mirror_rule_broken: true },
        consequenceType: 'deferred-fatal',
        consequenceNote: 'Странная встреча с отражением запускает отложенную расплату.',
        threatDelta: 1,
        doomDelta: 1,
      },
      {
        id: 'c2',
        text: 'Опустить взгляд и уйти',
        nextSceneId: 'd5_start',
      },
      {
        id: 'c3',
        text: 'Посыпать край зеркала солью и отвернуться',
        nextSceneId: 'd4_mirror_cleansed',
        requireItem: 'соль',
        removeItems: ['соль'],
        consequenceType: 'reversible',
        consequenceNote: 'Ты сбиваешь нарастающее напряжение и возвращаешь контроль.',
        clearFlags: ['mirror_rule_broken'],
      },
    ],
  },
  {
    id: 'd4_mirror_marked', day: 4, time: 'latenight', icon: 'fa-eye', location: 'Ванная',
    roomId: 'bathroom', nearbyRooms: ['hallway'],
    text: [
      'В отражении лицо двигается на долю секунды раньше тебя.',
      'Когда ты моргаешь, на стекле остаётся влажный след в форме ладони.',
      'Ничего не происходит сразу, но ты чувствуешь, что дом стал ближе.',
    ],
    choices: [{ id: 'c1', text: 'Дождаться утра', nextSceneId: 'd5_start' }],
  },
  {
    id: 'd4_mirror_cleansed', day: 4, time: 'latenight', icon: 'fa-shield', location: 'Ванная',
    roomId: 'bathroom', nearbyRooms: ['hallway'],
    text: [
      'Соль шипит на стекле. Силуэт в зеркале распадается на рябь.',
      'Воздух становится легче, а дрожь в руках постепенно уходит.',
    ],
    choices: [{ id: 'c1', text: 'Вернуться в кровать', nextSceneId: 'd5_start' }],
  },
];
