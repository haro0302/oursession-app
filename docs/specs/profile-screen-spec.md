# プロフィール画面 設計仕様書

> このドキュメントは Claude Code への指示書です。
> `our-session-modern.html` のプロフィール画面を、Next.js + Tailwind で再現するための完全な仕様。
> **この仕様にずれた場合は、ユーザーの指示なくこの仕様に合わせ直すこと。**

## 1. 画面の前提

- **スマホファースト**: iPhone 14 Pro 想定(390px幅)
- **ダークテーマ**: `#15151a` 背景に暖色オーロラ
- **背景効果**: オーロラ(複数の暖色ブロブが24〜34秒周期でゆっくり動く)、カード半透明 + `backdrop-filter: blur(20px)`
- **遷移**: 他人のプロフィールページは**右からスライドイン**するオーバーレイ
- **マイページ**: ボトムナビの「マイページ」項目から表示。ヒーロー右上に「編集」「設定⚙」ボタンあり

---

## 2. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ ← 戻る             ⋯           │  ← ヘッダー (高さ48px、透明背景)
├─────────────────────────────────┤
│      ●●●●●●●●●●●●               │
│      ●         ●                │
│      ● avatar  ●                │  ← ヒーロー(中央寄せ、上下マージン28px)
│      ●         ●                │     アバター 96x96
│      ●●●●●●●●●●●●               │
│        REINA                    │     名前 24px 700
│      📍大阪府  🔰 練習中         │     エリア + 練習中バッジ
├─────────────────────────────────┤
│                                 │
│  パート・楽器                    │  ← 情報カード(margin: 18px、padding: 18px)
│  [Vo.] [Gt.]                    │     カード内をinfo-sectionで縦区切り
│  ─────────────                  │
│  ジャンル                        │
│  [Folk] [Singer-Songwriter]     │
│  [Country]                      │
│  ─────────────                  │
│  好きなアーティスト・曲           │
│  [Katie Melua] [Gabrielle...]   │
│  [aiko] [山下達郎]               │
│  ─────────────                  │
│  自己紹介                        │
│  学生の頃バンドで...             │
│                                 │
├─────────────────────────────────┤
│ REINAさんのプロフィールと          │
│ 似ている人 ※マイページのみ        │  ← サジェストセクション
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ →          │     横スクロール
│ │👤│ │👤│ │👤│ │👤│             │     各カード96px幅
│ │名│ │名│ │名│ │名│             │
│ └──┘ └──┘ └──┘ └──┘             │
├─────────────────────────────────┤
│                                 │
│ SESSION CARDS                   │  ← セクション見出し
│ ┌─────────────────────────┐    │
│ │ セッションカード1          │    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ セッションカード2          │    │
│ └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

## 3. ヘッダー

### マイページの場合
- 左: なし
- 中央: なし
- 右上に2つボタン:
  - 「編集」テキストボタン → プロフィール編集ドロワーを開く
  - 「⚙(歯車)」アイコンボタン → 設定オーバーレイを開く

### 他人のプロフィールの場合
- 左: 「← 戻る」(chevron-left アイコン) → 前画面に戻る
- 中央: なし
- 右: 「⋯(more-horizontal)」アイコン → アクションシート(通報/ブロック)

```css
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  position: relative;
  z-index: 2;
}
.profile-back, .profile-menu {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
}
```

---

## 4. ヒーローセクション

```html
<div class="profile-hero">
  <div class="avatar-ring">
    <div class="avatar-inner">
      <!-- Feather user icon, または実際のアバター画像 -->
    </div>
  </div>
  <div class="hero-name">REINA</div>
  <div class="hero-area">
    <i data-feather="map-pin"></i>
    大阪府
    <span class="beginner-badge">🔰 練習中</span>
  </div>
</div>
```

### スタイル

```css
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 18px 24px;
  position: relative;
  z-index: 1;
}

.avatar-ring {
  width: 96px; height: 96px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, rgba(232,140,90,0.3), rgba(232,74,95,0.2));
  margin-bottom: 14px;
}
.avatar-inner {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
  margin-bottom: 6px;
  font-family: 'Outfit', sans-serif;
}

.hero-area {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text2);
}

/* 練習中バッジ */
.beginner-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%);
  color: #3a2a00;
  padding: 2px 8px;
  border-radius: 8px;
  margin-left: 6px;
  line-height: 1.5;
}
```

---

## 5. 情報カード

```html
<div class="info-card">
  <div class="info-section">
    <div class="info-lbl">パート・楽器</div>
    <div class="tag-row">
      <span class="tag accent">Vo.</span>
      <span class="tag accent">Gt.</span>
    </div>
  </div>
  <div class="info-section">
    <div class="info-lbl">ジャンル</div>
    <div class="tag-row">
      <span class="tag">Folk</span>
      <span class="tag">Singer-Songwriter</span>
      <span class="tag">Country</span>
    </div>
  </div>
  <div class="info-section">
    <div class="info-lbl">好きなアーティスト・曲</div>
    <div class="tag-row">
      <span class="tag">Katie Melua</span>
      <span class="tag">Gabrielle Aplin</span>
      <span class="tag">aiko</span>
      <span class="tag">山下達郎</span>
    </div>
  </div>
  <div class="info-section">
    <div class="info-lbl">自己紹介</div>
    <div class="bio-text">学生の頃バンドでギターをしていましたが...</div>
  </div>
</div>
```

### スタイル

```css
.info-card {
  margin: 0 18px;
  background: var(--card);  /* rgba(26,26,32,0.55) */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 0 18px;
  position: relative;
  z-index: 1;
}

.info-section {
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.info-section:last-child {
  border-bottom: none;
}

.info-lbl {
  font-size: 10px;
  font-weight: 700;
  color: var(--text3);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 9px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 5px 11px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text2);
  font-family: 'Outfit', sans-serif;
}

.tag.accent {
  background: var(--red-bg);  /* rgba(232,74,95,0.10) */
  border-color: var(--red-border);  /* rgba(232,74,95,0.32) */
  color: var(--red2);  /* #ed6a7c */
  font-weight: 600;
}

.bio-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.7;
}
```

---

## 6. サジェストセクション(マイページのみ)

**重要**: 他人のプロフィールページには出さない。マイページのみ。

### 配置
情報カードの**直下**、セッションカードの**直上**

### 構造

```html
<div class="suggest-section">
  <div class="section-title">
    <span><span id="mypageSuggestName">REINA</span>さんのプロフィールと似ている人</span>
  </div>
  <div class="suggest-scroll" id="mypageSuggest">
    <!-- アイテムを動的に挿入 -->
    <div class="suggest-item" onclick="goToProfile('あゆみ')">
      <div class="suggest-avatar">
        <i data-feather="user"></i>
        <div class="suggest-beginner-dot">🔰</div>
      </div>
      <div class="suggest-name">あゆみ</div>
    </div>
    <!-- ... -->
  </div>
</div>
```

### スタイル

```css
.suggest-section {
  margin: 22px 18px 4px;
}

.section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text3);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin: 0 4px 12px;
}

.suggest-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  margin: 0 -18px 0 0;       /* 右側だけ画面端まで広げる */
  padding: 6px 18px 14px 0;  /* 左は0(揃え)、右に余白 */
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}
.suggest-scroll::-webkit-scrollbar { display: none; }

.suggest-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  width: 96px;
  cursor: pointer;
  scroll-snap-align: start;
  padding: 14px 8px 12px;
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 18px;
  transition: transform 0.18s, border-color 0.18s, background 0.18s;
}
.suggest-item:hover {
  transform: translateY(-2px);
  border-color: var(--border2);
  background: var(--card-hl);
}
.suggest-item:active { transform: scale(0.97); }

.suggest-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%);
  border: 1.5px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}

.suggest-beginner-dot {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%);
  border: 2px solid var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  line-height: 1;
}

.suggest-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
```

### 表示ロジック

```typescript
// 共通点スコアリング
function kinshipScore(self: Profile, other: Profile): number {
  let score = 0;
  const overlap = (a: string[], b: string[]) => a.filter(v => b.includes(v)).length;
  score += overlap(self.favoriteArtists, other.favoriteArtists) * 3;
  score += overlap(self.favoriteTracks, other.favoriteTracks) * 3;
  score += overlap(self.genres, other.genres) * 2;
  score += overlap(self.instruments, other.instruments) * 1;
  if (self.area === other.area) score += 1;
  if (self.isPractice && other.isPractice) score += 1;
  return score;
}

// 全ユーザーをスコア順で並べ、自分を除外し、上位8人を表示
const suggested = otherUsers
  .map(u => ({ user: u, score: kinshipScore(me, u) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 8);
```

---

## 7. セッションカードセクション

サジェストセクションの直下に「SESSION CARDS」見出し + その人の投稿カード一覧。

### 見出し

```html
<div class="section-title" style="margin: 22px 22px 12px;">
  <span>SESSION CARDS</span>
</div>
```

### カード(他人のプロフィール上)

カードのレイアウトは別仕様書(`session-card-spec.md`)に従う。  
他人のプロフィール上では:
- 「保存ブックマーク」🔖 はあり
- 「アンサーを送る」ボタンはあり
- 編集ボタンはなし
- 削除ボタンはなし

### カード(自分のマイページ)

- 「保存ブックマーク」🔖 はなし(自分のカードを保存はしない)
- 「アンサーを送る」ボタンはなし(自分にアンサーは送らない)
- 「⋯」メニューあり → 編集 / 削除

---

## 8. デザイントークン(再掲)

すべての色・余白・フォントサイズは `lib/design-tokens.ts` から参照すること。コンポーネントへの直書きは禁止。

```typescript
export const tokens = {
  color: {
    bg: '#15151a',
    bg2: '#1a1a20',
    bg3: '#22222a',
    card: 'rgba(26,26,32,0.55)',
    card2: 'rgba(34,34,42,0.5)',
    cardHl: 'rgba(42,42,50,0.7)',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.12)',
    text: '#f5f5f7',
    text2: '#9a9aa8',
    text3: '#5a5a66',
    red: '#e84a5f',
    red2: '#ed6a7c',
    redBg: 'rgba(232,74,95,0.10)',
    redBorder: 'rgba(232,74,95,0.32)',
    successGreen: '#7ec88a',
    warmAmber: '#e88c5a',
  },
  radius: {
    sm: '12px',
    md: '14px',
    lg: '18px',
    xl: '20px',
    pill: '50%',
  },
  font: {
    family: "'Outfit', system-ui, sans-serif",
    weight: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, black: 800 },
  },
} as const;
```

---

## 9. 受け入れチェックリスト

実装後、以下を確認してプロトと一致しているか確認:

- [ ] 背景: 真っ黒(#15151a)で、オーロラ(暖色ブロブ)がゆっくり動いている
- [ ] ヘッダー高さ約48px、右側のアイコンが円形(34x34px)
- [ ] アバター: 96x96、外側に暖色グラデのリング(3px padding)
- [ ] 名前: 24px / Outfit / 700ウェイト
- [ ] エリア表示の隣に「🔰 練習中」(黄→オレンジのグラデバッジ)
- [ ] 情報カード: margin 18px、内側18px padding、border-radius 20px、半透明 + blur(20px)
- [ ] info-lbl: 10px / UPPERCASE / 文字間隔0.8px / text3カラー
- [ ] パート・楽器のタグが**赤背景・赤ボーダー・赤文字**(他のジャンル・アーティストは通常タグ)
- [ ] サジェストセクション(マイページのみ)が情報カードの直下
- [ ] タイトル「REINAさんのプロフィールと似ている人」(動的にユーザー名が入る)
- [ ] サジェストカード: 96px幅、丸角18px、半透明背景
- [ ] スライダーの**最初のカードの左端**が情報カードの左端と揃っている
- [ ] スライダーの右側は画面端までスクロール可能
- [ ] 練習中ドット(🔰)はアバター右下に小さく配置(20px、暖色グラデ)
- [ ] セッションカードセクションが続く

---

## 10. プロトと比較する時の見方

```
プロト(正解)を開く:
1. our-session-modern.html をブラウザで開く
2. DevTools → デバイスモード → iPhone 14 Pro
3. タイムラインで誰かのサムネをタップ → 他人のプロフィール
4. または下ナビ「マイページ」 → マイページ

実装と並べて見比べる:
- 1pxレベルの完全一致は不要
- ただし「情報の配置順」「色の温度」「角丸の大きさ」「フォントサイズの相対関係」は守る
```
