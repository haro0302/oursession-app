export const INSTRUMENTS = [
  'ボーカル', 'ギター', 'ベース', 'ドラム', 'ピアノ', 'キーボード', 'ウクレレ',
  'サックス', 'トランペット', 'バイオリン', '管楽器', '弦楽器', '和楽器', 'その他',
] as const;

export type Instrument = typeof INSTRUMENTS[number];
