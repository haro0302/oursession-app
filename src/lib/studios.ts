// スタジオ枠提案②のスタジオ候補データ(Step1・静的定数)。
// docs/specs/chat-spec.md: 「関西圏のみ・大手チェーン×主要エリア・数十件でよい」
//
// 掲載チェーン: BASS ON TOP / スタジオラグ / 音楽スタジオ246 / 島村楽器(スタジオ併設店)。
// 各チェーンの公式サイトの店舗一覧ページを基に、関西圏(大阪・京都・神戸・奈良・和歌山)に
// 実在する店舗のみを掲載している。店舗の新設・閉店・移転などで最新状況とズレる可能性が
// あるため、定期的な見直しが必要。リストに無い店舗は「その他(自分で入力)」で対応する。

export interface StudioEntry {
  name: string;
  note: string; // 最寄り駅
  url: string; // 店舗ページ・予約ページ等の外部リンク
}

export const STUDIO_AREAS: Record<string, Record<string, StudioEntry[]>> = {
  大阪: {
    梅田: [
      { name: "BASS ON TOP 大阪梅田店", note: "大阪梅田駅", url: "https://www.bassontop.co.jp/band/umeda/" },
      { name: "音楽スタジオ246 OSAKA", note: "中崎町駅・大阪駅", url: "https://www.studio246.net/reserve/?si=08" },
      { name: "島村楽器 梅田茶屋町店", note: "梅田駅", url: "https://www.shimamura.co.jp/shop/umeda" },
      { name: "島村楽器 グランフロント大阪店", note: "大阪駅", url: "https://www.shimamura.co.jp/shop/osaka-classic" },
    ],
    "心斎橋・なんば": [
      { name: "BASS ON TOP 心斎橋店", note: "心斎橋駅", url: "https://www.bassontop.co.jp/band/shinsaibashi/" },
      { name: "BASS ON TOP 東心斎橋店", note: "心斎橋駅", url: "https://www.bassontop.co.jp/band/higashishinsaibashi/" },
      { name: "BASS ON TOP アメ村店", note: "心斎橋駅周辺", url: "https://www.bassontop.co.jp/band/amemura/" },
      { name: "BASS ON TOP なんば店", note: "難波駅", url: "https://www.bassontop.co.jp/band/namba/" },
      { name: "音楽スタジオ246 NAMBA", note: "なんば駅", url: "https://www.studio246.net/reserve/?si=09" },
    ],
    "天王寺・あべの": [
      { name: "BASS ON TOP 天王寺店", note: "JR天王寺駅", url: "https://www.bassontop.co.jp/band/tennoji/" },
      { name: "島村楽器 あべのand店", note: "天王寺駅", url: "https://www.shimamura.co.jp/shop/abeno" },
    ],
    十三: [
      { name: "音楽スタジオ246 JUSO", note: "十三駅", url: "https://www.studio246.net/reserve/?si=11" },
    ],
    天六: [
      { name: "音楽スタジオ246 GEN", note: "天神橋筋六丁目駅", url: "https://www.studio246.net/reserve/?si=10" },
    ],
    京橋: [
      { name: "BASS ON TOP 京橋店", note: "京橋駅", url: "https://www.bassontop.co.jp/band/kyobashi/" },
    ],
    堺: [
      { name: "BASS ON TOP 堺 深井駅前店", note: "深井駅", url: "https://www.bassontop.co.jp/band/fukai/" },
      { name: "島村楽器 イオンモール堺北花田店", note: "北花田駅", url: "https://www.shimamura.co.jp/shop/sakaikitahanada" },
    ],
    "門真・大日": [
      { name: "島村楽器 ららぽーと門真店", note: "古川橋駅", url: "https://www.shimamura.co.jp/shop/l-kadoma" },
      { name: "島村楽器 イオンモール大日店", note: "大日駅", url: "https://www.shimamura.co.jp/shop/dainichi" },
    ],
    "万博・吹田": [
      { name: "島村楽器 ららぽーとEXPOCITY店", note: "万博記念公園駅", url: "https://www.shimamura.co.jp/shop/expocity" },
    ],
    枚方: [
      { name: "島村楽器 くずはモール店", note: "樟葉駅", url: "https://www.shimamura.co.jp/shop/kuzuha" },
    ],
  },
  京都: {
    河原町: [
      { name: "スタジオラグ 河原町店", note: "河原町三条", url: "https://www.ragnet.co.jp/studiorag/kawaramachiten/index.html" },
    ],
    大宮: [
      { name: "音楽スタジオ246 KYOTO", note: "大宮駅", url: "https://www.studio246.net/reserve/?si=06" },
    ],
    洛北: [
      { name: "島村楽器 洛北阪急スクエア店", note: "北大路駅周辺", url: "https://www.shimamura.co.jp/shop/kyoto" },
    ],
    桂川: [
      { name: "島村楽器 イオンモール京都桂川店", note: "桂川駅", url: "https://www.shimamura.co.jp/shop/kyotokatsuragawa" },
    ],
  },
  神戸: {
    三宮: [
      { name: "BASS ON TOP 神戸三宮店", note: "三ノ宮駅", url: "https://www.bassontop.co.jp/band/sannomiya/" },
      { name: "音楽スタジオ246 WEST", note: "三宮駅", url: "https://www.studio246.net/reserve/?si=05" },
      { name: "島村楽器 三宮オーパ店", note: "三宮駅", url: "https://www.shimamura.co.jp/shop/koube" },
    ],
    尼崎: [
      { name: "BASS ON TOP 尼崎店", note: "尼崎駅", url: "https://www.bassontop.co.jp/band/amagasaki/" },
    ],
    西宮: [
      { name: "BASS ON TOP 西宮甲東園店", note: "甲東園駅", url: "https://www.bassontop.co.jp/band/kotoen/" },
      { name: "島村楽器 ららぽーと甲子園店", note: "甲子園駅", url: "https://www.shimamura.co.jp/shop/koshien" },
    ],
    神戸北: [
      { name: "島村楽器 イオンモール神戸北店", note: "谷上駅", url: "https://www.shimamura.co.jp/shop/kobe-k" },
    ],
  },
  奈良: {
    奈良: [
      { name: "島村楽器 ミ・ナーラ奈良店", note: "近鉄奈良駅", url: "https://www.shimamura.co.jp/shop/nara" },
    ],
  },
  和歌山: {
    和歌山: [
      { name: "島村楽器 イオンモール和歌山店", note: "和歌山駅", url: "https://www.shimamura.co.jp/shop/wakayama" },
    ],
  },
};

export const STUDIO_PREFECTURES = Object.keys(STUDIO_AREAS);
