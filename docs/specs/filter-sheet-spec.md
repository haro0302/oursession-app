# フィルタシート 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このシートの位置づけ

### 用途

タイムライン画面の**検索パネル内のフィルタチップ**(楽器/ジャンル/エリア)をタップすると開く、**下からスライドインするシート(Sheet)**。

### サイトマップ上の位置

`sitemap.md` のカテゴリでは **Sheet (下からスライドイン、40〜60%)** に該当。

### 入口

- タイムライン画面 → 🔍検索パネル → 「楽器▼」「ジャンル▼」「エリア▼」チップタップ
- (将来) 投稿ページのタグ選択でも同じシートを再利用(`openPostFilterSheet`)

### 重要

- ページ遷移ではない、ドロワーでもない、**Sheet(下から)**
- 複数選択可能(チェックリスト型)
- 「クリア」と「決定」の2ボタンで完了

---

## 1. 画面構造

```
┌─────────────────────────────────┐
│ (タイムライン画面が後ろに半透明)   │
│                                 │
│                                 │
├─────────────────────────────────┤  ← ここから上は背景半透明 + blur
│ ─────────────                   │
│       ━━━(ハンドル)              │  ← filter-sheet-handle
│                                 │
│ 楽器                             │  ← filter-sheet-title
│ ─────────────                   │
│                                 │
│ [ボーカル] [ギター] [ベース]      │  ← fs-opt (チップ群、複数選択可)
│ [ドラム] [鍵盤] [ウクレレ]        │
│ [サックス] [トランペット]         │
│ [バイオリン] [その他]             │
│                                 │
│ ─────────────                   │
│ [クリア]    [   決定   ]         │  ← filter-sheet-actions
└─────────────────────────────────┘
```

---

## 2. シートのアニメーション(最重要)

### 2-1. 構造

```html
<!-- 背景の半透明レイヤー -->
<div class="filter-sheet-backdrop" id="fsBackdrop" onclick="closeFilterSheet()"></div>

<!-- シート本体(下からスライドイン) -->
<div class="filter-sheet" id="filterSheet">
  <div class="filter-sheet-handle"></div>
  <div class="filter-sheet-title" id="fsTitle">楽器</div>
  <div class="filter-sheet-options" id="fsOptions"></div>
  <div class="filter-sheet-actions">
    <button class="fs-btn clear" onclick="clearFilter()">クリア</button>
    <button class="fs-btn apply" onclick="closeFilterSheet()">決定</button>
  </div>
</div>
```

### 2-2. CSS(プロト準拠)

```css
/* 背景 */
.filter-sheet-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 40;
}
.filter-sheet-backdrop.open {
  opacity: 1; pointer-events: auto;
}

/* シート本体 */
.filter-sheet {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  background: rgba(20,20,26,0.92);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border-top: 1px solid var(--border2);
  border-radius: 24px 24px 0 0;            /* 上の角だけ丸める */
  padding: 8px 0 24px;
  transform: translateY(100%);              /* 初期: 画面下に隠す */
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1); /* スプリング感 */
  z-index: 41;
  max-height: 60%;                          /* 画面の60%以内 */
  display: flex; flex-direction: column;
}
.filter-sheet.open {
  transform: translateY(0);                 /* 開いた位置 */
}
```

### 2-3. React実装パターン

```tsx
// ❌ ダメな例: 要素自体を消す(アニメしない)
{filterOpen && <FilterSheet />}

// ✅ 良い例: 常にDOMに存在させて、クラスで開閉
const [filterOpen, setFilterOpen] = useState(false);
const [currentFilter, setCurrentFilter] = useState<'instrument'|'genre'|'area'>('instrument');

<>
  {/* 背景 */}
  <div 
    className={`filter-sheet-backdrop ${filterOpen ? 'open' : ''}`}
    onClick={() => setFilterOpen(false)}
  />
  
  {/* シート本体 */}
  <div className={`filter-sheet ${filterOpen ? 'open' : ''}`}>
    <div className="filter-sheet-handle"></div>
    <div className="filter-sheet-title">{filterTitle}</div>
    <div className="filter-sheet-options">
      {options.map(opt => (
        <FilterOption 
          key={opt}
          selected={selected.includes(opt)}
          onClick={() => toggle(opt)}
        >
          {opt}
        </FilterOption>
      ))}
    </div>
    <div className="filter-sheet-actions">
      <button className="fs-btn clear" onClick={handleClear}>クリア</button>
      <button className="fs-btn apply" onClick={() => setFilterOpen(false)}>決定</button>
    </div>
  </div>
</>
```

### 2-4. 重要な注意点

- 要素は**常にDOMに存在**させる(消すとアニメしない)
- `transform: translateY(100%) → translateY(0)` のパターン
- `cubic-bezier(0.4, 0, 0.2, 1)` で**スプリング感**(linear や ease は安っぽい)
- 背景タップで閉じる(backdrop の onclick)

---

## 3. ハンドル(`filter-sheet-handle`)

シート上部の小さな横線。**「これは下にスワイプで閉じられる」というアフォーダンス**として機能。

```css
.filter-sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--text3);
  margin: 8px auto 14px;
  opacity: 0.4;
}
```

実機ではスワイプで閉じる挙動を後で実装してもよいが、MVPでは見た目だけでOK。

---

## 4. タイトル(`filter-sheet-title`)

```html
<div class="filter-sheet-title" id="fsTitle">楽器</div>
```

```css
.filter-sheet-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  padding: 0 24px 14px;
  border-bottom: 1px solid var(--border);
}
```

開いたフィルタによってタイトルが変わる:
- 楽器シート → 「楽器」
- ジャンルシート → 「ジャンル」  
- エリアシート → 「エリア」

---

## 5. オプション(`fs-opt`、選択チップ)

### 5-1. 構造

```html
<div class="filter-sheet-options" id="fsOptions">
  <div class="fs-opt" onclick="toggleOption('instrument', 'ボーカル')">ボーカル</div>
  <div class="fs-opt selected" onclick="toggleOption('instrument', 'ギター')">ギター</div>
  <div class="fs-opt" onclick="toggleOption('instrument', 'ベース')">ベース</div>
  <!-- ... -->
</div>
```

### 5-2. スタイル

```css
.filter-sheet-options {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-sheet-options::-webkit-scrollbar { display: none; }

.fs-opt {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text2);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Outfit', sans-serif;
}
.fs-opt:hover { 
  border-color: var(--border2); 
}
.fs-opt.selected {
  background: var(--red-bg);       /* 控えめな赤背景 */
  border-color: var(--red-border);
  color: var(--red2);
}
```

### 5-3. 重要な思想

- 選択チップは**控えめに**(背景はうっすら赤、塗りつぶさない)
- これは CLAUDE.md §4 デザイントークンの「選択チップの見せ方」に従う
- 線と文字だけで「選んだ」感を出す、押し付けがましくない

### 5-4. 複数選択可能

- タップで選択/解除のトグル
- 何個でも選べる
- 0個でも OK(フィルタなしと同じ)

---

## 6. オプションデータ

```typescript
const FILTER_OPTIONS = {
  instrument: {
    title: '楽器',
    options: [
      'ボーカル','ギター','ベース','ドラム','鍵盤','ウクレレ',
      'サックス','トランペット','バイオリン','その他'
    ]
  },
  genre: {
    title: 'ジャンル',
    options: [
      'ロック','J-POP','ボカロ','フォーク','ジャズ','ファンク',
      'R&B','ブルース','カントリー','メタル','アニソン','洋楽'
    ]
  },
  area: {
    title: 'エリア',
    options: [
      '東京','神奈川','埼玉','千葉','大阪','京都',
      '兵庫','愛知','福岡','北海道','宮城','広島'
    ]
  }
};
```

注: 本実装では `area` を 47都道府県全部にしてもよいが、MVPでは主要エリアだけでOK。

---

## 7. アクションボタン(`filter-sheet-actions`)

```html
<div class="filter-sheet-actions">
  <button class="fs-btn clear" onclick="clearFilter()">クリア</button>
  <button class="fs-btn apply" onclick="closeFilterSheet()">決定</button>
</div>
```

```css
.filter-sheet-actions {
  display: flex;
  gap: 10px;
  padding: 14px 20px 0;
  border-top: 1px solid var(--border);
}
.fs-btn {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: all 0.15s;
}
.fs-btn.clear {
  background: var(--card2);
  color: var(--text2);
  border: 1px solid var(--border);
}
.fs-btn.apply {
  background: var(--red);
  color: white;
  box-shadow: 0 4px 14px rgba(232,74,95,0.4);
}
```

### 挙動

- **クリア**: 現在開いているシートの選択を**すべて解除**(他のフィルタには影響しない)
- **決定**: シートを閉じる(選択内容は保持)
- どちらも50:50で並ぶ

---

## 8. チップとの連動(タイムライン側)

シートを閉じた時、タイムラインのフィルタチップは選択状態を反映する:

### 選択0個の場合
```
[楽器 ▼]  ← デフォルト表示
```

### 選択1個以上の場合
```
[楽器 · 2 ▼]  ← カウント表示、has-value クラスで強調
```

### CSS

```css
.f-chip {
  /* デフォルト */
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text2);
}
.f-chip.has-value {
  /* 選択あり */
  background: var(--red-bg);
  border-color: var(--red-border);
  color: var(--red2);
  font-weight: 600;
}
```

### 実装パターン

```typescript
function updateChipState(key: 'instrument' | 'genre' | 'area') {
  const chip = document.querySelector(`.f-chip[data-filter="${key}"]`);
  const count = filterState[key].length;
  const label = FILTER_OPTIONS[key].title;
  
  chip.classList.toggle('has-value', count > 0);
  chip.textContent = count > 0 ? `${label} · ${count}` : label;
  // ▼ アイコンも残す
}
```

---

## 9. 状態管理

### 9-1. グローバルなフィルタ状態

```typescript
// タイムライン用のフィルタ
const [filterState, setFilterState] = useState<{
  instrument: string[];
  genre: string[];
  area: string[];
}>({
  instrument: [],
  genre: [],
  area: []
});

// 現在開いているシート
const [currentFilter, setCurrentFilter] = useState<'instrument'|'genre'|'area'|null>(null);
const [filterSheetOpen, setFilterSheetOpen] = useState(false);
```

### 9-2. 状態の更新フロー

1. ユーザーがチップ「楽器 ▼」タップ
2. `currentFilter = 'instrument'`, `filterSheetOpen = true`
3. シートが下からスライドイン、楽器のオプションが表示
4. ユーザーが「ギター」「ベース」をタップ
5. `filterState.instrument = ['ギター', 'ベース']` に更新
6. ユーザーが「決定」タップ
7. `filterSheetOpen = false`、シートが下にスライドアウト
8. チップが「楽器 · 2 ▼」に変わる(has-value クラス)
9. タイムラインのカードが**フィルタリングされて再描画**

---

## 10. タイムラインカードのフィルタリング

選択された条件にマッチするカードだけ表示する:

```typescript
const filteredCards = cards.filter(card => {
  // すべてのフィルタを AND で評価
  if (filterState.instrument.length > 0) {
    if (!filterState.instrument.some(i => card.tags.instruments.includes(i))) {
      return false;
    }
  }
  if (filterState.genre.length > 0) {
    if (!filterState.genre.some(g => card.tags.genres.includes(g))) {
      return false;
    }
  }
  if (filterState.area.length > 0) {
    if (!filterState.area.some(a => card.tags.areas.includes(a))) {
      return false;
    }
  }
  return true;
});
```

注: フィルタ内では **OR**(楽器の中で「ギター OR ベース」)、フィルタ間では **AND**(楽器 AND ジャンル)。

### 該当なしの場合

カードが0件になったら、空状態を表示:

```html
<div className="timeline-empty">
  <div class="timeline-empty-icon"><FilterIcon /></div>
  <div class="timeline-empty-title">条件に合うセッションが見つかりません</div>
  <div class="timeline-empty-sub">フィルタを変えてみてください。</div>
</div>
```

---

## 11. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### シートの挙動
- [ ] チップタップで**下からスライドイン**(0.32秒、cubic-bezier)
- [ ] 背景に半透明 + blur(4px) のレイヤーが出る
- [ ] 背景タップで閉じる
- [ ] 「決定」タップで閉じる
- [ ] 「クリア」タップで現在のシートの選択だけ解除(閉じない)
- [ ] 閉じる時も下にスライドアウト(逆再生)

### ハンドル
- [ ] 上部に小さな横線(36×4px, text3, opacity 0.4)

### タイトル
- [ ] 「楽器 / ジャンル / エリア」のうち、開いた種類のタイトル(14px, 700)
- [ ] 下に薄い境界線

### オプション(チップ)
- [ ] 角丸ピル形状(border-radius: 20px)
- [ ] 控えめな選択スタイル(背景: `var(--red-bg)`、ボーダー: 赤、文字: 赤)
- [ ] 選択は**塗りつぶさない**(線と文字だけで主張)
- [ ] 複数選択可能(タップでトグル)

### アクションボタン
- [ ] 「クリア」(グレー)と「決定」(赤+影)が50:50
- [ ] 上に薄い境界線

### チップ側の連動
- [ ] 選択0個: 「楽器 ▼」(デフォルト)
- [ ] 選択1個以上: 「楽器 · 2 ▼」+ has-value クラス(背景赤、文字赤)

### フィルタリング
- [ ] カードがフィルタに従って絞り込まれる
- [ ] 該当なしの場合は空状態を表示

---

## 12. プロト参照箇所

具体的なコードはプロトの以下を参照:

| セクション | 行番号(目安) |
|---|---|
| filter-sheet CSS | 約 563〜624 |
| filter-sheet HTML | 約 4159〜4168 |
| FILTER_OPTIONS データ | 約 5502〜5515 |
| openFilterSheet 関数 | 約 5528〜5554 |
| toggleOption / clearFilter / closeFilterSheet | 約 5556〜5590 |
| updateChipState 関数 | 約 5581〜5590 |

---

**最後に**: フィルタシートは**ユーザーが楽に絞り込める仕組み**。選択チップは控えめに、複数選択を自然にできる UX が大事。CLAUDE.md「初心者が面倒を感じない」を実現する装置のひとつです。
