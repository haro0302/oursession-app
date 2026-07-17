# アンサー投稿ドロワー 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このドロワーの位置づけ

### 重要: これは「ドロワー」であって「ページ」ではない

アンサー投稿は**下からスライドインするドロワー**(Drawer)。
**投稿ページとは別物**:

| | 投稿ページ | アンサードロワー |
|---|---|---|
| 種類 | Screen(画面遷移) | Drawer(下からスライド) |
| URL | 変わる | 変わらない |
| ハンドル | なし | **あり**(上部の横線) |
| 背景 | 透けない | 透ける(タイムラインが背景に見える) |
| 高さ | 全画面 | 88%程度 |
| ヘッダー左 | 「キャンセル」(テキスト) | 「キャンセル」(テキスト) |
| ヘッダー右 | 「公開」 | 「送信」 |
| ヘッダー中央 | 新しいセッション | アンサーを送る |
| 安心ブロック | 2つ必須 | **なし**(代わりにアンサー先カード) |

### 入口

- タイムライン画面の各セッションカードの「アンサー」ボタン
- 他人のプロフィールページ内のセッションカードの「アンサー」ボタン
- メッセージ画面のチャットルーム内(自分がアンサー送信予定の場合)

未ログイン時にタップ → 認証ドロワーが先に出る

### 出口

- ハンドルをスワイプダウン → 閉じる
- 背景タップ → 閉じる
- ヘッダー左「キャンセル」 → 入力中なら確認、閉じる
- ヘッダー右「送信」 → アンサー送信 → 閉じる + 完了トースト

### サイトマップ上の位置

`sitemap.md` のカテゴリでは **Drawer (下からスライドイン、90%高さ)** に該当。同じカテゴリ:
- プロフィール編集ドロワー
- 認証ドロワー

---

## 1. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ (タイムラインが背景に半透明で見える)│
├─────────────────────────────────┤
│        ━━━(ハンドル)              │  ← ad-handle
├─────────────────────────────────┤
│ キャンセル | アンサーを送る | 送信 │  ← ad-header (sticky)
├─────────────────────────────────┤
│   ↳ ┌─────────────────────┐    │  ← リプライマーク (↳)
│     │ アンサー先              │    │  ← ad-target-lbl (赤)
│     │ 山下達郎「Sparkle」コピー│   │  ← ad-target-title
│     │ 👤 REINA さん           │    │  ← ad-target-user
│     └─────────────────────┘    │     ad-target (赤枠カード)
├─────────────────────────────────┤
│ あなたの演奏音源 必須・90秒/5MBまで │  ← ad-label
│ ┌─────────────────────────┐    │
│ │ 🎤 その場で録音する        │    │  ← rec-start (赤い大ボタン)
│ │   スマホのマイクで90秒まで  │    │
│ └─────────────────────────┘    │
│       ──── または ────          │  ← rec-or-row
│ ┌╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┐      │
│ ╎    ↑(赤)                ╎    │  ← ad-mp3-drop (破線囲み)
│ ╎    ファイルから選ぶ        ╎    │
│ ╎    MP3 (90秒・5MBまで)   ╎    │
│ └╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┘      │
├─────────────────────────────────┤
│ 一言メッセージ  必須・150字以内   │  ← ad-label
│ ┌─────────────────────────┐    │
│ │ どんな思いでこの曲をやり... │    │  ← ad-textarea
│ │                            │    │
│ │                            │    │
│ │                    0/150  │    │  ← ad-counter (右下)
│ └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

## 2. ドロワーのアニメーション(最重要)

### 2-1. 構造

```html
<!-- 背景 -->
<div class="ad-backdrop" id="adBackdrop" onclick="closeAnswerDrawer()"></div>

<!-- ドロワー本体 -->
<div class="ad-drawer" id="adDrawer">
  <div class="ad-handle"></div>
  <div class="ad-header">
    <button class="ad-header-btn" onclick="closeAnswerDrawer()">キャンセル</button>
    <div class="ad-title">アンサーを送る</div>
    <button class="ad-send" id="adSendBtn" onclick="sendAnswer()">
      <i data-feather="send"></i>
      <span>送信</span>
    </button>
  </div>
  <div class="ad-body">
    <!-- 中身 -->
  </div>
</div>
```

### 2-2. CSS(プロト準拠)

```css
/* 背景 */
.ad-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 55;
}
.ad-backdrop.open {
  opacity: 1; pointer-events: auto;
}

/* ドロワー本体(下からスライド) */
.ad-drawer {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  max-height: 88%;                       /* 画面の88%まで */
  background: rgba(20,20,26,0.97);
  backdrop-filter: blur(32px) saturate(1.4);
  -webkit-backdrop-filter: blur(32px) saturate(1.4);
  border-top: 1px solid var(--border2);
  border-radius: 24px 24px 0 0;          /* 上の角だけ丸める */
  transform: translateY(100%);            /* 初期: 画面下に隠す */
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 56;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.ad-drawer.open {
  transform: translateY(0);              /* 開いた位置 */
}
```

### 2-3. React実装パターン

```tsx
// ❌ ダメ: 要素自体を消す
{drawerOpen && <AnswerDrawer />}

// ✅ 良い: 要素は常にDOMに置く
const [drawerOpen, setDrawerOpen] = useState(false);

<>
  <div 
    className={`ad-backdrop ${drawerOpen ? 'open' : ''}`}
    onClick={() => setDrawerOpen(false)}
  />
  <div className={`ad-drawer ${drawerOpen ? 'open' : ''}`}>
    {/* ... */}
  </div>
</>
```

### 2-4. 重要な注意点

- `transform: translateY(100%) → translateY(0)` のパターン
- `cubic-bezier(0.4, 0, 0.2, 1)` で**スプリング感**(0.35秒)
- ドロワーは**88%程度**(全画面ではない、上にタイムラインが少し見える)
- 要素は常にDOMに存在させる(消すとアニメしない)

---

## 3. ハンドル(`ad-handle`)

```html
<div class="ad-handle"></div>
```

```css
.ad-handle {
  width: 36px; height: 4px;
  border-radius: 2px;
  background: var(--text3);
  opacity: 0.4;
  margin: 8px auto 6px;
  flex-shrink: 0;
}
```

- 上部中央の小さな横線
- 「これは下にスワイプで閉じられる」のアフォーダンス
- MVP段階では見た目だけでOK(スワイプ閉じは後で)

---

## 4. ヘッダー(`ad-header`)

### 4-1. 構造

```html
<div class="ad-header">
  <button class="ad-header-btn" onclick="closeAnswerDrawer()">キャンセル</button>
  <div class="ad-title">アンサーを送る</div>
  <button class="ad-send" id="adSendBtn" onclick="sendAnswer()">
    <i data-feather="send" style="width:13px;height:13px;stroke:currentColor;"></i>
    <span>送信</span>
  </button>
</div>
```

### 4-2. スタイル

```css
.ad-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 18px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.ad-header-btn {
  background: transparent; border: none;
  font-size: 14px; color: var(--text2); font-weight: 500;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  padding: 6px 2px;
  min-width: 60px;
}
.ad-header-btn:hover { color: var(--text); }
.ad-title {
  font-size: 15px; font-weight: 700;
  color: var(--text);
}
.ad-send {
  background: var(--card2);
  color: var(--text3);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 7px 16px;
  font-size: 13px; font-weight: 700;
  cursor: not-allowed;
  font-family: 'Outfit', sans-serif;
  transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 5px;
}
.ad-send.ready {
  background: var(--red);
  color: white;
  border-color: var(--red);
  box-shadow: 0 4px 14px rgba(232,74,95,0.4);
  cursor: pointer;
}
```

### 4-3. 挙動

- **キャンセル**: タップで閉じる。入力中なら確認ダイアログ
- **「アンサーを送る」**: タイトル、タップ反応なし
- **送信**: 必須項目すべて入力で活性化(`.ready` → 赤背景 + 紙飛行機アイコンが白)

### 4-4. 重要な注意点

- **×ボタンは無い**(「キャンセル」テキストボタン)
- **下部に「アンサーを送る」ボタンは無い**(ヘッダーの「送信」で実行)
- 「送信」ボタンには**紙飛行機アイコン + テキスト**(投稿ページの「公開」と違って、こちらはアイコン付き)

---

## 5. アンサー先カード(`ad-target`)

### 5-1. 重要: ここが「リプライ感」の核心

ユーザーが「**何に対してアンサーを送るのか**」を最重要情報として最上部に表示。**赤い枠のカード + リプライマーク「↳」**で視覚的に強調。

### 5-2. 構造

```html
<div class="ad-target">
  <div class="ad-target-lbl">アンサー先</div>
  <div class="ad-target-title" id="adTargetTitle">山下達郎「Sparkle」コピー</div>
  <div class="ad-target-user">
    <i data-feather="user" style="width:11px;height:11px;stroke:currentColor;"></i>
    <span id="adTargetUser">REINA さん</span>
  </div>
</div>
```

### 5-3. スタイル

```css
.ad-target {
  position: relative;
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--red-border);      /* ★赤い枠線 */
  border-radius: 16px;
  padding: 13px 14px 13px 16px;
  margin-bottom: 20px;
  margin-left: 14px;                         /* ←リプライマーク用に左寄せ */
}

/* リプライマーク「↳」を擬似要素で左に配置 */
.ad-target::before {
  content: '↳';
  position: absolute;
  left: -14px;                                /* カードの外側左に */
  top: 13px;
  font-size: 18px;
  color: var(--red2);
  font-weight: 300;
  line-height: 1;
}

.ad-target-lbl {
  font-size: 9px;
  font-weight: 700;
  color: var(--red2);                         /* 赤い小さなラベル */
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.ad-target-title {
  font-size: 14px; font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  margin-bottom: 3px;
}
.ad-target-user {
  font-size: 11px; color: var(--text3);
  display: flex; align-items: center; gap: 5px;
}
```

### 5-4. 重要な要素

- **赤い枠線**(`var(--red-border)`)で「アンサー先」だと強調
- **「↳」リプライマーク**を左外側に配置(チャットでも使う統一マーク)
- **「アンサー先」赤いラベル**(小さい、UPPERCASE)
- **タイトル + ユーザー名**(👤アイコン + 「REINAさん」)

### 5-5. データバインディング

呼び出し元から `title` と `userName` を渡す:

```tsx
function openAnswerDrawer(title: string, userName: string) {
  setAdTargetTitle(title);
  setAdTargetUser(`${userName} さん`);  // 「さん」を付ける
  setDrawerOpen(true);
}
```

---

## 6. 音源セクション

### 6-1. ラベル

```html
<div class="ad-label">
  <span>あなたの演奏音源</span>
  <span class="ad-label-req">必須・90秒/5MBまで</span>
</div>
```

```css
.ad-label {
  font-size: 10px; font-weight: 700;
  color: var(--text3);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin: 0 4px 8px;
  display: flex; align-items: center; justify-content: space-between;
}
.ad-label-req {
  color: var(--red2);
  font-size: 9px;
  letter-spacing: 0.5px;
}
```

### 6-2. アイドル状態: 録音 + ファイル選択(投稿ページと同じパターン)

投稿ページと**ほぼ同じUI**。違いはマージン値だけ:

```html
<div id="adMp3Idle">
  <!-- 主役: 録音ボタン -->
  <button class="rec-start" onclick="startAdRecording()" type="button">
    <div class="rec-start-icon">
      <i data-feather="mic" style="width:20px;height:20px;stroke:white;stroke-width:2.5;"></i>
    </div>
    <div class="rec-start-body">
      <div class="rec-start-title">その場で録音する</div>
      <div class="rec-start-sub">スマホのマイクで90秒まで</div>
    </div>
  </button>

  <!-- セパレータ -->
  <div class="rec-or-row">または</div>

  <!-- 副次: ファイル選択(破線囲み) -->
  <label class="ad-mp3-drop" id="adMp3Drop">
    <div class="ad-mp3-drop-icon">
      <i data-feather="upload" style="width:18px;height:18px;stroke:var(--red2);"></i>
    </div>
    <div class="ad-mp3-drop-title">ファイルから選ぶ</div>
    <div class="ad-mp3-drop-sub">MP3 (90秒・5MBまで)</div>
    <input type="file" accept="audio/mpeg,audio/mp3,.mp3" id="adMp3Input" onchange="onAdMp3Selected(event)">
  </label>
</div>
```

### 6-3. ファイル選択(`ad-mp3-drop`)のスタイル

```css
.ad-mp3-drop {
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1.5px dashed var(--border2);    /* ★破線! */
  border-radius: 18px;
  padding: 26px 20px;
  display: flex; flex-direction: column; align-items: center;
  gap: 9px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}
.ad-mp3-drop:hover {
  border-color: var(--red-border);
  background: var(--card-hl);
}
.ad-mp3-drop-icon {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  display: flex; align-items: center; justify-content: center;
}
.ad-mp3-drop-title {
  font-size: 14px; font-weight: 600; color: var(--text);
}
.ad-mp3-drop-sub {
  font-size: 11px; color: var(--text3);
}
```

---

## 7. 録音中・成功などの状態(投稿ページと共通)

録音カウントダウン、録音中、プレビュー、アップロード進捗、エラー、成功などのステートは**投稿ページと完全に同じパターン**で実装する。共通コンポーネント化推奨。

主なステート:
- `idle`: 録音ボタン + ファイル選択
- `countdown`: 3秒カウントダウン
- `recording`: 録音中(パルス + 波形 + タイマー + やめる/停止)
- `preview`: プレビュー再生 + もう一度/これで送る
- `uploading`: 進捗バー(0%→100%)
- `error`: アンバー色のエラー + もう一度試す/別のファイル
- `success`: 緑チェック + **ファイル名** + ×ボタン + 波形プレイヤー

### 7-1. 成功時(ファイル名表示)

```html
<div class="ad-mp3-selected" id="adMp3Selected" style="display:none;">
  <div class="ad-mp3-selected-head">
    <div class="upload-icon success" style="width:30px;height:30px;">
      <i data-feather="check" style="width:14px;height:14px;stroke:#7ec88a;"></i>
    </div>
    <div class="ad-mp3-selected-name" id="adMp3Name">音源ファイル名.mp3</div>
    <div class="ad-mp3-remove" onclick="removeAdMp3()" aria-label="削除">
      <i data-feather="x" style="width:14px;height:14px;stroke:var(--text2);"></i>
    </div>
  </div>
  <div class="mp-row">
    <button class="mp-btn"><div class="mp-tri"></div></button>
    <div class="mp-bars"></div>
    <div class="mp-time">0:00 / 0:45</div>
  </div>
</div>
```

**重要**: 投稿ページと同様、**ファイル名を明示的に表示**する(「音源を受け付けました」のような汎用ラベルではない)。

---

## 8. 一言メッセージ(`adComment`)

### 8-1. 構造

```html
<div class="ad-label">
  <span>一言メッセージ</span>
  <span class="ad-label-req">必須・150字以内</span>
</div>
<div class="ad-textarea-wrap">
  <textarea 
    class="ad-textarea" 
    id="adComment" 
    maxlength="300"
    placeholder="どんな思いでこの曲をやりたいか、自分の演奏のアピールなどを書いてみよう。"
    oninput="onAdCommentInput()"
  ></textarea>
  <div class="ad-counter" id="adCounter">0 / 150</div>
</div>
```

### 8-2. スタイル

```css
.ad-textarea-wrap {
  position: relative;
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 13px 16px 26px;
  transition: border-color 0.18s;
}
.ad-textarea-wrap:focus-within {
  border-color: var(--red-border);
}
.ad-textarea {
  width: 100%;
  background: transparent; border: none; outline: none;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  min-height: 110px;
  resize: none;
}
.ad-textarea::placeholder { color: var(--text3); }
.ad-counter {
  position: absolute;
  bottom: 6px; right: 12px;
  font-size: 10px;
  color: var(--text3);
  font-weight: 500;
}
.ad-counter.over { color: var(--red); }
```

### 8-3. 重要なポイント

- **ラベルは「一言メッセージ」**(❌「ひとこと(任意)」)
- **必須**(投稿ページの「本文」は任意だが、こちらは必須)
- 150字以内、超えたらカウンタが赤
- placeholder: 「**どんな思いでこの曲をやりたいか、自分の演奏のアピールなどを書いてみよう。**」
  - 「やりたい曲への気持ち」と「自分のアピール」の両方を促す
  - 「〜してみよう」で背中を押す(CLAUDE.md トーン)

### 8-4. なぜ必須なのか

アンサーは「投稿主にお願いする」アクションなので、**音源だけ送るのは失礼**にもなる。一言添えることで:
- 相手に**人柄が伝わる**(機械的じゃない)
- 「なぜこの曲をやりたいか」が伝わる
- 承認のための判断材料になる

CLAUDE.md「**会いたいが生まれる**」の補強。

---

## 9. バリデーション

### 9-1. 「送信」ボタンの活性条件

```typescript
function updateSendState() {
  const hasMp3 = adMp3Selected;
  const comment = document.getElementById('adComment').value.trim();
  const hasComment = comment.length > 0;
  const commentOk = comment.length <= 150;
  
  const ready = hasMp3 && hasComment && commentOk;
  document.getElementById('adSendBtn').classList.toggle('ready', ready);
}
```

必須:
- 音源アップロード完了
- 一言メッセージ入力済み(空白のみは不可)
- メッセージ150字以内

### 9-2. 送信時の処理

```typescript
function sendAnswer() {
  const btn = document.getElementById('adSendBtn');
  if (!btn.classList.contains('ready')) return;
  
  // 送信処理(本実装では Supabase に answer レコード作成)
  
  // ドロワーを閉じる
  closeAnswerDrawer();
  
  // 完了トースト
  showToast('あなたの音、届きました🎵<br>相手が聴いてくれたら、メッセージでつながれます。');
  
  // フォームリセット
  resetAnswerDrawer();
}
```

### 9-3. キャンセル時の確認

```typescript
function closeAnswerDrawer() {
  const isDirty = 
    adMp3Selected ||
    document.getElementById('adComment').value.length > 0;
  
  if (isDirty) {
    if (!confirm('入力内容を破棄しますか?')) return;
  }
  
  resetAnswerDrawer();
  document.getElementById('adDrawer').classList.remove('open');
  document.getElementById('adBackdrop').classList.remove('open');
}
```

---

## 10. 完了時のトースト

CLAUDE.md §2 のコピー実例より:

```
「あなたの音、届きました🎵
 相手が聴いてくれたら、メッセージでつながれます。」
```

投稿ページの完了トーストとは**少し違う**ので注意:
- 投稿: 「仲間が見つかったらお知らせします」
- アンサー: 「相手が聴いてくれたら、メッセージでつながれます」

→ アンサーは**特定の相手に向けたアクション**なので、その相手との接続を示唆する。

---

## 11. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### 構造
- [ ] **ドロワー**(下からスライド、高さ88%程度)であり、ページではない
- [ ] **ハンドル**(上部の横線)が**ある**
- [ ] 背景が透ける(タイムラインが半透明で見える)
- [ ] 角丸は上の2つだけ(下は画面端まで)

### ヘッダー
- [ ] 「キャンセル | アンサーを送る | 送信」の**3要素構成**
- [ ] 「キャンセル」はテキストボタン(❌×ボタンではない)
- [ ] 「送信」は紙飛行機アイコン + テキスト、必須項目入力で赤くなる(`.ready`)

### アンサー先カード
- [ ] **赤い枠線**で強調(`var(--red-border)`)
- [ ] **「↳」リプライマーク**が左外側に配置
- [ ] 赤い「アンサー先」ラベル(小さい、UPPERCASE)
- [ ] セッションタイトル表示
- [ ] 投稿者のアバターアイコン + 「○○さん」表示

### 音源セクション
- [ ] ラベル「あなたの演奏音源」+ 「必須・90秒/5MBまで」(赤の必須マーク)
- [ ] 「その場で録音する」が主役の赤い大ボタン(サブテキスト付き)
- [ ] 「── または ──」セパレータ
- [ ] 「ファイルから選ぶ」が**破線囲みの大きなドロップゾーン**
- [ ] 各「MP3 (90秒・5MBまで)」のサイズ情報

### 一言メッセージ
- [ ] ラベル「一言メッセージ」(❌「ひとこと」)
- [ ] **必須・150字以内**(❌「(任意)」)
- [ ] placeholder「どんな思いでこの曲をやりたいか、自分の演奏のアピールなどを書いてみよう。」
- [ ] 右下にカウンタ「0 / 150」
- [ ] フォーカス時に枠が赤に

### 削除すべきもの
- [ ] 下部の「アンサーを送る」ボタンが**無い**(ヘッダー右の「送信」で実行)
- [ ] ×ボタンが**無い**

### 送信
- [ ] 音源 + メッセージ揃ったら「送信」が活性化
- [ ] 送信タップでドロワー閉じる → 完了トースト
- [ ] トースト: 「あなたの音、届きました🎵 / 相手が聴いてくれたら、メッセージでつながれます。」

---

## 12. プロト参照箇所

具体的なコードはプロトの以下を参照:

| セクション | 行番号(目安) |
|---|---|
| アンサードロワー HTML | 約 4775〜4947 |
| アンサードロワー CSS | 約 1849〜2030 |
| 録音・アップロード関連 CSS | 投稿ページと共通 |
| openAnswerDrawer 関数 | 検索 |
| sendAnswer 関数 | 検索 |

---

**最後に**: アンサー投稿は「**音源を聴いて『この人と演奏したい』と思った瞬間**」を逃さないための装置。アンサー先カードで「誰に何を返すのか」を明確に示し、温かいコピーで「一言添える」ハードルを下げる。CLAUDE.md「**会いたいが生まれる**」を実現する核心ドロワーです。
