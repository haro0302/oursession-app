// セッションアシスト「お題デッキ」の固定定義。
// 順番・文言は docs/specs/chat-spec.md の通り(1〜4が温め、5〜6が段取り)。変更しない。

export interface ProfileCard {
  type: "profile";
  question: string;
  hint: string;
  parts: string[];
  years: string[];
}

export interface TextCard {
  type: "text";
  question: string;
  hint: string;
}

export interface MultiCard {
  type: "multi";
  question: string;
  hint: string;
  options: string[];
}

export type AssistCard = ProfileCard | TextCard | MultiCard;

export const ASSIST_DECK: AssistCard[] = [
  {
    type: "profile",
    question: "パートと音楽歴を教えて",
    hint: "パートは複数選べます",
    parts: ["Vo", "Gt", "Ba", "Dr", "Key", "その他"],
    years: ["はじめたばかり", "1〜3年", "3年以上", "だいぶ長い"],
  },
  {
    type: "text",
    question: "この曲のどこが好き？",
    hint: "ひとことでも大丈夫です",
  },
  {
    type: "text",
    question: "セッションへの意気込みは？",
    hint: "気負わずどうぞ",
  },
  {
    type: "text",
    question: "他にセッションしてみたい曲は？",
    hint: "何曲でも",
  },
  {
    type: "text",
    question: "スタジオ使ったことある？どのへん？",
    hint: "駅名だけでもOK",
  },
  {
    type: "multi",
    question: "動きやすいのはどのへん？",
    hint: "複数えらべます",
    options: ["平日夜", "週末昼", "週末夜"],
  },
];

export const ASSIST_DECK_LENGTH = ASSIST_DECK.length;

// カード6(index 5)だけは選択式なので、時間帯の一致を集合演算で確実に出せる。
// 「機械が言い切ってよいのは、絶対に外さないことだけ」の唯一の例外。
export function timeOverlap(mine: string[], partner: string[]): string[] {
  return mine.filter((v) => partner.includes(v));
}
