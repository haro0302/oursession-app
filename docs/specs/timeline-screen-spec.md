# タイムライン画面 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このページの位置づけ

**Our Session のホーム画面**。ボトムナビ最左、アプリ起動時の最初の画面。

**役割**:
- 他のユーザーが投稿したセッションカード(=募集)を眺める
- 気になる音源を聴く → 投稿者のプロフィールを見る → アンサーを送る、の起点
- 検索・フィルタで楽器・ジャンル・エリアから絞り込み
- 通知の入口(右上ベル)

**思想**:
- CLAUDE.md §4「**聴く → こっそり気になる → ひとりじゃないと知る → 投稿**」の最初の入口
- 数字での競争を排除(再生回数表示なし、いいね数なし)
- 「いま○人が聴いています」で**沈黙への配慮**

---

## 1. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ タイムライン         🔔 🔍       │  ← tl-topbar (sticky)
├─────────────────────────────────┤
│ (検索パネル: 開閉式)              │  ← search-panel
│ [🔍 アーティスト名・曲名で検索]    │
│ [楽器▼][ジャンル▼][エリア▼]      │
├─────────────────────────────────┤
│ ┌─────────────────────────┐    │
│ │ 06/21                    │    │  ← sc-date
│ │ 山下達郎「Sparkle」コピー   │    │  ← sc-title
│ │ 一緒にセッションしませ...   │    │  ← sc-msg (1行折りたたみ、タップで展開)
│ │ ┌─────────────────────┐ │    │
│ │ │ [▶] ▮▮▮▮ 0:00/1:30  │ │    │  ← mp-row (波形プレイヤー)
│ │ └─────────────────────┘ │    │
│ │ 🟢 いま5人が聴いています  │    │  ← listening-now
│ │ ─────────                │    │
│ │ セッションアンサー希望    │    │  ← tl-tags-lbl
│ │ [Vo.] [大阪] [Folk]      │    │  ← sc-tag
│ │ ─────────                │    │
│ │ 👤 REINA 🔰練習中 🔖 ⋯ [アンサー]│  ← tl-foot
│ └─────────────────────────┘    │
│                                 │
│ ┌─────────────────────────┐    │
│ │ (2枚目のカード)            │    │
│ └─────────────────────────┘    │
│                                 │
│ ...続く                          │
├─────────────────────────────────┤
│ [🏠 タイムライン] [➕] [💬] [👤] │  ← フローティングナビ
└─────────────────────────────────┘
```

---

## 2. トップバー(`tl-topbar`)

### 2-1. 構造

```html
<div class="tl-topbar">
  <div class="tl-title">タイムライン</div>
  <div class="tl-topbar-actions">
    <button class="tl-icon-btn" onclick="openNotifications()" aria-label="通知">
      <i data-feather="bell"></i>
      <span class="tl-icon-badge">3</span>
    </button>
    <button class="tl-icon-btn tl-search-btn" onclick="toggleSearch()" aria-label="検索">
      <i data-feather="search"></i>
    </button>
  </div>
</div>
```

### 2-2. スタイル

```css
.tl-topbar {
  position: sticky; top: 0;
  background: rgba(21,21,26,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 14px 18px 12px;
  z-index: 5;
  display: flex; align-items: center; justify-content: space-between;
}
.tl-title {
  font-size: 22px; font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
}
.tl-topbar-actions {
  display: flex; gap: 8px;
}
.tl-icon-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  cursor: pointer;
  transition: background 0.18s, transform 0.15s;
}
.tl-icon-btn:hover { background: var(--card-hl); }
.tl-icon-btn:active { transform: scale(0.95); }
.tl-icon-btn.active {
  background: var(--red);
  border-color: var(--red);
}
.tl-icon-btn.active svg { stroke: white !important; }

.tl-icon-badge {
  position: absolute;
  top: -2px; right: -2px;
  min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 8px;
  background: var(--red);
  color: white;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--bg);
}
```

### 2-3. 挙動

- **🔔 通知ボタン**: 未読数を赤バッジで表示。タップで通知オーバーレイ(右からスライドイン)
- **🔍 検索ボタン**: タップで下に検索パネルが開閉(`toggleSearch()`)。開いている時はボタンが赤に変わる
- **タイトル「タイムライン」**: タップ反応なし、ただのラベル
- 未ログイン時に通知をタップ → 認証ドロワーへ

---

## 3. 検索パネル(`search-panel`)

### 3-1. 構造

```html
<div class="search-panel" id="searchPanel">
  <div class="search-pill">
    <i data-feather="search"></i>
    <input type="text" placeholder="アーティスト名・曲名で検索">
  </div>
  <div class="filter-row">
    <div class="f-chip" data-filter="instrument" onclick="openFilterSheet('instrument')">
      楽器 <i data-feather="chevron-down"></i>
    </div>
    <div class="f-chip" data-filter="genre" onclick="openFilterSheet('genre')">
      ジャンル <i data-feather="chevron-down"></i>
    </div>
    <div class="f-chip" data-filter="area" onclick="openFilterSheet('area')">
      エリア <i data-feather="chevron-down"></i>
    </div>
  </div>
</div>
```

### 3-2. スタイル

```css
.search-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: 0 18px;
  background: var(--bg);
}
.search-panel.open {
  max-height: 200px;
  padding: 14px 18px;
}
.search-pill {
  display: flex; align-items: center; gap: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 11px 14px;
  margin-bottom: 10px;
}
.search-pill input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text); font-family: 'Outfit', sans-serif; font-size: 14px;
}
.search-pill input::placeholder { color: var(--text3); }

.filter-row {
  display: flex; gap: 8px;
}
.f-chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 7px 12px;
  font-size: 12px; font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  transition: all 0.18s;
}
.f-chip:hover { background: var(--card-hl); }
.f-chip.active {
  background: var(--red);
  border-color: var(--red);
  color: white;
}
```

### 3-3. 挙動

- 検索ボタンタップで `max-height` トランジションで開閉
- フィルタチップは**選択中だと赤背景**(アクティブ状態)
- フィルタチップタップで**フィルタシート(Sheet)**が下からスライドイン(楽器・ジャンル・エリアの複数選択)
- 入力中はリアルタイムでカードを絞り込み(MVP段階では擬似的にOK)

---

## 4. セッションカード(`session-card`)

### 4-1. カード全体

```html
<div class="session-card">
  <!-- ⋯メニュー(右上、絶対配置) -->
  <button class="sc-edit" onclick="openOtherCardAction('REINA','タイトル')">
    <i data-feather="more-horizontal"></i>
  </button>
  
  <!-- カード本体(内側パディング) -->
  <div class="sc-inner">
    <div class="sc-date">06/21</div>
    <div class="sc-title">山下達郎「Sparkle」コピー</div>
    <div class="sc-msg">一緒にセッションしませんか?...</div>
    <div class="mp-row"><!-- 波形プレイヤー --></div>
    <div class="listening-now"><!-- いま○人が聴いています --></div>
  </div>
  
  <!-- タグ部分(横区切り線で隔離) -->
  <div class="tl-tags-wrap">
    <div class="tl-tags-lbl">セッションアンサー希望</div>
    <div class="tag-row">
      <span class="sc-tag">Vo.</span>
      <span class="sc-tag">大阪</span>
      <span class="sc-tag">Folk</span>
    </div>
  </div>
  
  <!-- フッター(横区切り線で隔離) -->
  <div class="tl-foot">
    <div class="tl-avatar"><i data-feather="user"></i></div>
    <div class="tl-username-row">
      <span class="tl-username">REINA</span>
      <span class="beginner-badge-mini">🔰 練習中</span>
    </div>
    <button class="tl-heart"><!-- 🔖 ブックマーク --></button>
    <button class="tl-cta"><i data-feather="send"></i><span>アンサー</span></button>
  </div>
</div>
```

### 4-2. カード本体のスタイル

```css
.session-card {
  position: relative;
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 20px;
  margin: 14px 18px;
  overflow: hidden;
}

.sc-inner {
  padding: 16px 18px 14px;
}

.sc-date {
  font-size: 11px; font-weight: 500;
  color: var(--text3);
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.sc-title {
  font-size: 16px; font-weight: 700;
  color: var(--text);
  line-height: 1.4;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}

.sc-msg {
  font-size: 12px;
  color: var(--text2);
  line-height: 1.6;
  margin-bottom: 11px;
  display: -webkit-box;
  -webkit-line-clamp: 1;       /* ←重要: 初期は1行クランプ */
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.15s;
}
.sc-msg:hover { color: var(--text); }
.sc-msg.expanded {
  -webkit-line-clamp: unset;
  display: block;
}
```

**重要**: 本文は**初期1行表示**、タップで展開、再タップで折りたたみ。CLAUDE.md「視線を音源・アクションに集中させる」を守る。

### 4-3. ⋯メニュー(右上、絶対配置)

```css
.sc-edit {
  position: absolute;
  top: 12px; right: 12px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.18s;
}
.sc-edit:hover { background: var(--card-hl); }
```

**挙動**:
- **他人のカード**: タップで「通報する / ブロックする」のアクションシート
- **自分のカード**: タップで「編集 / 削除」のアクションシート

### 4-4. 波形プレイヤー(`mp-row`)

```html
<div class="mp-row">
  <button class="mp-btn" onclick="toggleMP('tl1')">
    <div class="mp-tri"></div>  <!-- 三角の再生アイコン -->
  </button>
  <div class="mp-bars" id="mpbars-tl1"></div>  <!-- 波形バー -->
  <div class="mp-time">0:00 / 1:29</div>
</div>
```

```css
.mp-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 14px;
}
.mp-btn {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--red);
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(232,74,95,0.4);
  flex-shrink: 0;
}
.mp-tri {
  width: 0; height: 0;
  border-left: 10px solid white;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  margin-left: 3px;
}
.mp-bars {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 2.5px;
  height: 28px;
  cursor: pointer;
}
.mp-bar {
  width: 2.5px;
  background: var(--text3);
  border-radius: 1.5px;
  transition: background 0.1s;
}
.mp-bar.played {
  background: var(--red);
}
.mp-time {
  font-size: 10px;
  color: var(--text3);
  white-space: nowrap;
  font-weight: 500;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
```

**挙動**:
- 波形バーは**ランダムな高さ**(seed をカードIDで固定して毎回同じ波形)
- 再生中はバーが**左から赤くなっていく**(playedクラス)
- 一時停止アイコン: `mp-tri` が pause クラスで「‖」二本線に切り替え
- 1枚再生中に他の再生を押すと**前のが止まる**

### 4-5. いま○人が聴いています(`listening-now`)

```html
<div class="listening-now">
  <span class="listening-dot"></span>
  <span>いま<span class="listening-count">5人</span>が聴いています</span>
</div>
```

```css
.listening-now {
  display: flex; align-items: center; gap: 6px;
  margin-top: 7px;
  padding: 0 4px;
  font-size: 10.5px;
  color: var(--text3);
  font-weight: 500;
  letter-spacing: 0.1px;
}
.listening-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #7ec88a;
  flex-shrink: 0;
  animation: listeningPulse 2.2s ease-in-out infinite;
}
@keyframes listeningPulse {
  0%, 100% { opacity: 0.5; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 8px rgba(126,200,138,0.6); }
}
.listening-count {
  color: var(--text2);
  font-weight: 600;
}
```

**重要**:
- 緑のドットが**2.2秒周期で呼吸**するように脈打つ
- 0人の場合は**表示しない**(無反応を強調しないため)
- 「**いま○人が聴いています**」現在進行形(CLAUDE.md §2 で確定)

### 4-6. タグセクション(`tl-tags-wrap`)

```html
<div class="tl-tags-wrap">
  <div class="tl-tags-lbl">セッションアンサー希望</div>
  <div class="tag-row">
    <span class="sc-tag">Vo.</span>
    <span class="sc-tag">大阪</span>
    <span class="sc-tag">Folk</span>
  </div>
</div>
```

```css
.tl-tags-wrap {
  padding: 0 16px 10px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
  margin: 0 16px;
}
.tl-tags-lbl {
  font-size: 10px;
  color: var(--text3);
  margin-bottom: 5px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.tag-row {
  display: flex; flex-wrap: wrap; gap: 5px;
}
.sc-tag {
  display: inline-block;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px 9px;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text2);
  font-family: 'Outfit', sans-serif;
}
```

**重要**:
- タグの**上に「セッションアンサー希望」ラベル**が必ず付く
- タグ自体は**コンパクトサイズ**(角丸10px、padding小さめ、文字10.5px)
- 何のタグかというと「**この曲をやりたい人へ向けたアンサー募集の条件**」

### 4-7. フッター(`tl-foot`)

```html
<div class="tl-foot">
  <!-- 投稿者のアバター(タップでプロフィールへ) -->
  <div class="tl-avatar" onclick="goToProfile('REINA')">
    <i data-feather="user"></i>
  </div>
  <!-- 投稿者名 + 練習中バッジ(練習中ONの場合のみ) -->
  <div class="tl-username-row">
    <span class="tl-username" onclick="goToProfile('REINA')">REINA</span>
    <span class="beginner-badge-mini">🔰 練習中</span>
  </div>
  <!-- 保存ブックマーク -->
  <button class="tl-heart" onclick="toggleHeart(this)">
    <svg><!-- ブックマーク形のSVG --></svg>
  </button>
  <!-- アンサーボタン -->
  <button class="tl-cta" onclick="openAnswerDrawer('タイトル','REINA')">
    <i data-feather="send"></i>
    <span>アンサー</span>
  </button>
</div>
```

```css
.tl-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid var(--border);
  margin: 0 16px;
}
.tl-avatar {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.18s;
}
.tl-avatar:hover { border-color: var(--red); }
.tl-username {
  font-size: 12px; font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  flex: 0 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.tl-username:hover { color: var(--text); }
.tl-username-row {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 6px;
}
.beginner-badge-mini {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%);
  color: #3a2a00;
  padding: 1px 6px;
  border-radius: 6px;
  flex-shrink: 0;
  line-height: 1.4;
}
.tl-heart {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--card2);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s;
}
.tl-heart:hover { background: var(--card-hl); border-color: var(--border2); }
.tl-heart:active { transform: scale(0.92); }
.tl-heart svg path { transition: all 0.18s; }
.tl-heart.on svg path {
  fill: var(--red);
  stroke: var(--red);
}
.tl-cta {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--red);
  border: 1px solid var(--red);
  border-radius: 14px;
  padding: 6px 12px;
  font-size: 11.5px; font-weight: 700;
  color: white;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  box-shadow: 0 3px 10px rgba(232,74,95,0.35);
  transition: transform 0.15s;
  flex-shrink: 0;
}
.tl-cta:hover { transform: scale(1.04); }
```

**重要**:
- アバターと名前は**プロフィールページへの導線**(タップ可)
- 練習中バッジは**ONの場合のみ表示**(その他は出さない)
- 🔖 ブックマーク: タップで保存トグル(数字なし、フィルバージョン)
- 「アンサー」ボタン: 紙飛行機アイコン + テキスト、赤背景の小さな丸ピル

### 4-8. 自分のカード vs 他人のカード

**重要**: タイムラインには **他人のカードだけでなく、自分が投稿したカードも時系列に混ぜて表示する**。

**理由**:
- 投稿直後に「ちゃんと公開された」と確認できる安心感
- 「いま○人が聴いています」を自分のカードでも見られる(沈黙への配慮の主役)
- 他のSNS文化と整合(X、Instagram等も自分の投稿が自分のタイムラインに出る)
- 「タイムライン=他者発見、マイページ=自己管理」ではなく、「**タイムライン=みんなの広場(自分も含む)、マイページ=自分のすべて**」が正解

**表示の違い**(`isOwn` フラグで分岐):

| 要素 | 他人のカード | 自分のカード |
|---|---|---|
| 日付/タイトル/本文/波形 | 表示 | 表示 |
| いま○人が聴いてます | 表示 | **表示**(むしろ重要) |
| タグ + 「セッションアンサー希望」ラベル | 表示 | 表示 |
| アバター | 表示(タップでプロフィールへ) | 表示(自分のマイページへ) |
| 名前 | 表示(タップでプロフィールへ) | 表示 |
| 練習中バッジ | ON時のみ表示 | ON時のみ表示 |
| 🔖 保存ボタン | **表示** | **非表示**(自分のカードを保存しない) |
| アンサーボタン | **表示** | **非表示**(自分にアンサーを送らない) |
| ⋯ メニュー | 通報 / ブロック | **編集 / 削除** |

**実装例**:

```jsx
<SessionCard 
  card={card} 
  isOwn={card.authorId === currentUserId} 
/>

// 内部で isOwn による分岐
<button className="sc-edit" onClick={() => 
  isOwn ? openOwnCardAction(card.id) : openOtherCardAction(card.authorName, card.title)
}>
  <FeatherIcon name="more-horizontal" />
</button>

{/* フッターのアクション部分 */}
{!isOwn && (
  <>
    <BookmarkButton card={card} />
    <AnswerButton card={card} />
  </>
)}
```

**フッターのレイアウト調整**:

自分のカードでは保存ボタンとアンサーボタンが消えるので、フッターは「アバター + 名前 + 練習中バッジ」だけになる。**右側に余白ができてしまう**ので、空間処理に注意:

```jsx
<div className="tl-foot">
  <div className="tl-avatar">{/* ... */}</div>
  <div className="tl-username-row">
    <span className="tl-username">{name}</span>
    {isPractice && <span className="beginner-badge-mini">🔰 練習中</span>}
  </div>
  {!isOwn && (
    <>
      <BookmarkButton />
      <AnswerButton />
    </>
  )}
</div>
```

`.tl-username-row` が `flex: 1` で幅を取るので、自分のカードではフッターは「アバター + 名前 + 練習中バッジ」が左寄せで、右側が自然に余白として残る。違和感はない。

**マイページとの違い**:

マイページに表示する自分のカードは、同じ `SessionCard` コンポーネントの `isOwn` バリアントを使い回せばOK。ただしマイページでは「セッションアンサー希望」ラベルや`tl-tags-wrap` ではなく `sc-tags`(シンプル版)を使う**バリアントを別途用意**:

```jsx
<SessionCard variant="timeline" isOwn={true} />  // タイムラインの自分のカード
<SessionCard variant="mypage" />                  // マイページの自分のカード(シンプル版)
<SessionCard variant="timeline" isOwn={false} /> // タイムラインの他人のカード
```

---

## 5. 検索・フィルタ

### 5-1. 検索パネルの開閉

```javascript
function toggleSearch() {
  const panel = document.getElementById('searchPanel');
  const btn = document.getElementById('tlSearchBtn');
  panel.classList.toggle('open');
  btn.classList.toggle('active');
}
```

### 5-2. フィルタシート(`filter-sheet`)

タップで下からスライドインするシート。複数選択可能なチェックリスト型。

詳細仕様は別途(MVP では UI のみ実装)。

---

## 6. データバインディング

```typescript
// 各セッションカードのデータ型
interface SessionCardData {
  id: string;
  authorId: string;
  authorName: string;
  authorIsPractice: boolean;
  date: string;          // '06/21' 等の表示用
  title: string;         // 最大30字
  body: string;          // 最大150字、初期1行表示
  audioUrl: string;
  audioDuration: number; // 秒
  tags: {
    instruments: string[];  // 'Vo.', 'Gt.' etc
    areas: string[];        // '大阪', '東京' etc
    genres: string[];       // 'Folk', 'Rock' etc
  };
  listeningCount: number;   // 0なら表示しない
  isSaved: boolean;
  createdAt: Date;
}
```

タイムラインのカード一覧は `created_at DESC` 順で表示。

---

## 7. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### トップバー
- [ ] タイトル「**タイムライン**」が左上に大きく(22px, 700)
- [ ] 右上に🔔通知ボタン(円形、未読バッジ赤丸付き)
- [ ] 右上に🔍検索ボタン(円形)
- [ ] 検索ボタンタップで検索パネルが開閉、ボタンが赤に
- [ ] sticky で上に固定

### 検索パネル
- [ ] 検索入力欄(プレースホルダー「アーティスト名・曲名で検索」)
- [ ] 楽器/ジャンル/エリア の3つのフィルタチップ(▼アイコン付き)
- [ ] チップタップでフィルタシートが下から開く

### セッションカード
- [ ] 角丸20px、半透明背景 + blur(20px)
- [ ] 右上に⋯メニュー(他人のカード: 通報/ブロック)
- [ ] 日付(11px, text3)
- [ ] タイトル(16px, 700)
- [ ] **本文は初期1行**、タップで展開
- [ ] 波形プレイヤー(赤い再生ボタン、波形バー、再生時間)
- [ ] **「いま○人が聴いています」**(緑のパルスドット、現在進行形)
- [ ] 0人の場合は listening-now を表示しない
- [ ] **「セッションアンサー希望」ラベル + タグ群**(楽器/エリア/ジャンル)
- [ ] フッター: アバター + 名前 + 練習中バッジ(ON時のみ) + 🔖 + [アンサー]

### 練習中バッジ
- [ ] 黄→オレンジのグラデーション
- [ ] フッターの**名前の右**に配置
- [ ] 練習中ON のユーザーのカードのみ表示

### アクション
- [ ] アバタータップ → プロフィールページへ
- [ ] 名前タップ → プロフィールページへ
- [ ] 🔖タップ → 保存トグル(アイコン色変化、数字なし)
- [ ] [アンサー]タップ → アンサー投稿ドロワーが下から
- [ ] 本文タップ → 1行/全文の折りたたみ切替
- [ ] ⋯タップ → アクションシート

### 認証ゲート
- [ ] 未ログインでアンサー/保存/通知タップ → 認証ドロワー

### コピー
- [ ] 「セッションアンサー希望」(タグの見出し)
- [ ] 「いま○人が聴いています」(現在進行形)
- [ ] アンサーボタンのテキストは「アンサー」(「セッションアンサー」ではない、コンパクトに)

---

## 8. プロト参照箇所

具体的なコードはプロトの以下を参照:

| セクション | 行番号(目安) |
|---|---|
| トップバーCSS | 約 455〜515 |
| セッションカードCSS | 約 3220〜3340 |
| 検索パネルCSS | 約 540〜620 |
| タイムラインHTML | 約 3392〜3550 |
| listening-now CSS | 約 430〜450 |
| 練習中バッジ CSS | 約 3250〜3265 |

---

**最後に**: タイムラインは**サービスの第一印象を決める画面**。プロトの設計(温かいカード・控えめなアクション・音源中心)を忠実に再現することで、初心者でも「ここなら投稿してみたい」と思える場になります。
