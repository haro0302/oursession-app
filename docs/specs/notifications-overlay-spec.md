# 通知オーバーレイ 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このオーバーレイの位置づけ

### 重要: ページ遷移ではなく**オーバーレイ**

通知は**URL遷移しません**。タイムライン画面の上に**右からスライドインで重なる**オーバーレイです。

- ❌ `/notifications` ページへ遷移する
- ✅ タイムライン画面上にオーバーレイで開く
- 戻るボタン or 背景タップで閉じる
- URLは変わらない(変えるならクエリパラメータだけ)

### 入口

- **タイムライン画面右上の🔔ベルアイコン**(`tl-icon-btn`)から開く
- 未読数があれば、ベル右上に赤いバッジで数を表示
- 未ログイン時にタップ → 認証ドロワー
- メッセージ画面・マイページなど他の画面からは開けない(タイムラインの上に重なる)

### サイトマップ上の位置

`sitemap.md` のカテゴリでは **Overlay (右からスライドイン)** に該当。同じカテゴリ:
- 他人のプロフィールページ
- 設定オーバーレイ
- 保存一覧オーバーレイ

---

## 1. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ ← 通知              すべて既読   │  ← notif-header (sticky)
├─────────────────────────────────┤
│ 今日                             │  ← notif-day (区切り見出し)
│ ┌─────────────────────────┐    │
│ │👤📩 あゆみさん、たくみさん   │    │  ← notif-row.unread (新着アンサー)
│ │    から音が届きました 🎵   │    │
│ │    5分前                  │    │
│ │   🎵 山下達郎「Sparkle」   │    │  ← notif-context (関連カード)
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │👤✓ ゆうきさんと、         │    │  ← notif-row.unread (承認)
│ │   会えそうですね 🎵        │    │
│ │   1時間前                 │    │
│ │   🎵 King Gnu「白日」      │    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │👤💬 ゆうき: 来週土曜のスタジオ │ ← notif-row.unread (チャット)
│ │   2時間前                 │    │
│ │   🎵 King Gnu「白日」      │    │
│ └─────────────────────────┘    │
│                                 │
│ 昨日                             │  ← notif-day
│ ┌─────────────────────────┐    │
│ │👤✓ みゆきさんと、会えそう…  │    │  ← notif-row (既読、薄く)
│ │   昨日                    │    │
│ │   🎵 マカロニえんぴつ…     │    │
│ └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

## 2. オーバーレイのアニメーション(最重要)

### 2-1. 構造

```html
<!-- 背景の半透明レイヤー(タップで閉じる) -->
<div class="notif-backdrop" id="notifBackdrop" onclick="closeNotifications()"></div>

<!-- 通知本体(右からスライドイン) -->
<div class="notif-screen" id="notifScreen">
  <!-- 中身 -->
</div>
```

### 2-2. スタイル(プロト準拠)

```css
/* 背景の半透明レイヤー */
.notif-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 50;
}
.notif-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

/* 通知本体(画面全体を覆う、右からスライドイン) */
.notif-screen {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(20,20,26,0.96);
  backdrop-filter: blur(32px) saturate(1.4);
  -webkit-backdrop-filter: blur(32px) saturate(1.4);
  transform: translateX(100%);                              /* 初期位置: 右画面外 */
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1); /* 重要: スプリング感のあるトランジション */
  z-index: 51;
  display: flex;
  flex-direction: column;
}
.notif-screen.open {
  transform: translateX(0);                                  /* 開いた位置: 元の場所 */
}
```

### 2-3. React実装パターン

```tsx
// ❌ ダメな例: ページ遷移
<Link href="/notifications"><BellIcon /></Link>

// ❌ ダメな例: 要素自体を消す(アニメしない)
{notificationsOpen && <NotificationsOverlay />}

// ✅ 良い例: 要素は常にDOMに置いて、クラスで開閉
const [notificationsOpen, setNotificationsOpen] = useState(false);

<>
  <button onClick={() => setNotificationsOpen(true)}>
    <BellIcon />
  </button>

  {/* 背景レイヤー */}
  <div 
    className={`notif-backdrop ${notificationsOpen ? 'open' : ''}`}
    onClick={() => setNotificationsOpen(false)}
  />

  {/* 通知本体 */}
  <div className={`notif-screen ${notificationsOpen ? 'open' : ''}`}>
    {/* ... */}
  </div>
</>
```

### 2-4. 重要な注意点

- **要素は常にDOMに存在させる**。`display: none` だと transform アニメーションが効かない
- `transform: translateX(100%) → translateX(0)` のパターン
- `cubic-bezier(0.4, 0, 0.2, 1)` で**スプリング感**を出す(linear や ease だと安っぽい)
- 0.32秒というのは**早すぎず遅すぎず**の絶妙な値

---

## 3. ヘッダー(`notif-header`)

```html
<div class="notif-header">
  <button class="notif-back" onclick="closeNotifications()" aria-label="戻る">
    <i data-feather="chevron-left"></i>
  </button>
  <div class="notif-title">通知</div>
  <button class="notif-mark-all" onclick="markAllRead()">すべて既読</button>
</div>
```

```css
.notif-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.notif-back {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.notif-back:hover { background: var(--card-hl); }
.notif-title {
  font-size: 17px; font-weight: 700;
  color: var(--text);
  flex: 1;
}
.notif-mark-all {
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--text2);
  font-weight: 600;
  cursor: pointer;
  padding: 6px 8px;
}
.notif-mark-all:hover { color: var(--red2); }
```

### 要素

- **← 戻るボタン**: タップでオーバーレイを閉じる(右にスライドアウト)
- **「通知」タイトル**: 17px, 700, 中央寄せじゃなく flex:1 で左寄り
- **「すべて既読」ボタン**: 右上、テキストのみ、タップで全通知を既読化

---

## 4. 日別の区切り見出し(`notif-day`)

```html
<div class="notif-day">今日</div>
<!-- ... 今日の通知 ... -->
<div class="notif-day">昨日</div>
<!-- ... 昨日の通知 ... -->
<div class="notif-day">もっと前</div>
```

```css
.notif-day {
  font-size: 10px;
  font-weight: 700;
  color: var(--text3);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 14px 8px 8px;
}
```

### 表示ルール

- 今日 / 昨日 / もっと前 の3カテゴリ
- 各カテゴリ内は新しい順に並べる
- 1件もないカテゴリの見出しは出さない
- 全部空なら `notif-empty` を表示(下記)

---

## 5. 通知行(`notif-row`)

### 5-1. 構造

```html
<div class="notif-row unread" onclick="handleNotifClick('answer-sparkle')">
  <!-- 左: アイコン + 種別バッジ -->
  <div class="notif-icon-wrap">
    <div class="notif-icon">
      <UserIcon />  <!-- 通知元のユーザー(またはデフォルト人型アイコン) -->
    </div>
    <div class="notif-icon-badge">
      <MailIcon />  <!-- 種別を示すサブアイコン -->
    </div>
  </div>
  
  <!-- 右: テキスト本文 + 時間 + 関連カード -->
  <div class="notif-body">
    <div class="notif-text">
      <b>あゆみ</b>さん、<b>たくみ</b>さんから音が届きました 🎵
    </div>
    <div class="notif-meta">5分前</div>
    <div class="notif-context">
      <div class="notif-context-icon"><MusicIcon /></div>
      <span>山下達郎「Sparkle」コピー</span>
    </div>
  </div>
</div>
```

### 5-2. スタイル

```css
.notif-row {
  display: flex; align-items: flex-start; gap: 11px;
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px 14px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
}
.notif-row:hover {
  background: var(--card-hl);
  border-color: var(--border2);
}
.notif-row:active {
  transform: scale(0.99);
}

/* 未読の通知は左に赤いインジケータ + 赤い背景 */
.notif-row.unread {
  background: rgba(232,74,95,0.06);
  border-color: var(--red-border);
}
.notif-row.unread::before {
  content: '';
  position: absolute;
  left: -2px; top: 50%; transform: translateY(-50%);
  width: 4px; height: 60%;
  border-radius: 2px;
  background: var(--red);
}
```

### 5-3. アイコン + 種別バッジ

```css
.notif-icon-wrap {
  position: relative;
  flex-shrink: 0;
}
.notif-icon {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a4a55 0%, #2a2a32 100%);
  display: flex; align-items: center; justify-content: center;
}
.notif-icon-badge {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--red);  /* デフォルト: 赤 */
  border: 2px solid var(--bg);
  display: flex; align-items: center; justify-content: center;
}
.notif-icon-badge.green { background: #3a9b6b; }  /* 承認 */
.notif-icon-badge.blue { background: #3a7ebc; }   /* チャット */
.notif-icon-badge.heart { background: #ff5570; }  /* 保存(将来) */
```

---

## 6. 通知の種類(全パターン)

### 6-1. 新着アンサー (`unread`、デフォルト赤バッジ + メールアイコン)

```html
<div class="notif-row unread" onclick="handleNotifClick('answer-sparkle')">
  <div class="notif-icon-wrap">
    <div class="notif-icon"><UserIcon /></div>
    <div class="notif-icon-badge"><MailIcon /></div>
  </div>
  <div class="notif-body">
    <div class="notif-text"><b>あゆみ</b>さん、<b>たくみ</b>さんから音が届きました 🎵</div>
    <div class="notif-meta">5分前</div>
    <div class="notif-context">
      <div class="notif-context-icon"><MusicIcon /></div>
      <span>山下達郎「Sparkle」コピー</span>
    </div>
  </div>
</div>
```

**コピー**: 「○○さんから音が届きました 🎵」(複数: 「○○さん、△△さんから〜」)
**発火**: 自分の投稿に他人からアンサーが来た時
**タップ時**: 該当のチャットルームへ

### 6-2. 承認 (`unread.green`、緑バッジ + チェックアイコン)

```html
<div class="notif-row unread" onclick="handleNotifClick('approved-shiraga')">
  <div class="notif-icon-wrap">
    <div class="notif-icon"><UserIcon /></div>
    <div class="notif-icon-badge green"><CheckIcon /></div>
  </div>
  <div class="notif-body">
    <div class="notif-text"><b>ゆうき</b>さんと、会えそうですね 🎵</div>
    <div class="notif-meta">1時間前</div>
    <div class="notif-context">
      <div class="notif-context-icon"><MusicIcon /></div>
      <span>King Gnu「白日」セッション</span>
    </div>
  </div>
</div>
```

**コピー**: 「○○さんと、会えそうですね 🎵」
**発火**: 自分が送ったアンサーが承認された時
**タップ時**: メッセージ画面の該当行へジャンプ(ハイライト付き)

### 6-3. チャット新着メッセージ (`unread.blue`、青バッジ + メッセージアイコン)

```html
<div class="notif-row unread" onclick="handleNotifClick('message-shiraga')">
  <div class="notif-icon-wrap">
    <div class="notif-icon"><UserIcon /></div>
    <div class="notif-icon-badge blue"><MessageIcon /></div>
  </div>
  <div class="notif-body">
    <div class="notif-text"><b>ゆうき</b>: 来週土曜のスタジオ確保できました!</div>
    <div class="notif-meta">2時間前</div>
    <div class="notif-context">
      <div class="notif-context-icon"><MusicIcon /></div>
      <span>King Gnu「白日」セッション</span>
    </div>
  </div>
</div>
```

**コピー**: 「○○: (メッセージ本文の冒頭)」
**発火**: 自分が参加中のチャットルームに新着メッセージが来た時
**タップ時**: 該当のチャットルームへ

### 6-4. 既読の通知(`.unread` クラスなし)

```html
<div class="notif-row" onclick="handleNotifClick('approved-young-adult')">
  <!-- unread クラスがない以外は同じ構造 -->
</div>
```

- 背景がフラットな `var(--card)`(赤くない)
- 左の赤いインジケータが無い
- 「もっと前」セクションに集約される

---

## 7. 通知タップ時の挙動

`handleNotifClick(key)` 関数で分岐:

| 通知種別 | タップ時の遷移先 |
|---|---|
| 新着アンサー | チャットルーム(該当カード)を開く |
| 承認 | メッセージ画面に戻り、該当行を**ハイライトフラッシュ**(`msgRowFlash` アニメ、1.4秒) |
| チャット新着 | 該当のチャットルームを開く |

**重要**: タップで通知オーバーレイは自動的に閉じる。

```typescript
function handleNotifClick(key: string) {
  closeNotifications();
  setTimeout(() => {
    if (key.startsWith('answer-')) {
      // 該当のセッションのチャットルームを開く
      openChat(key);
    } else if (key.startsWith('approved-')) {
      // メッセージ画面に遷移し、該当行をハイライト
      navigateToMessages();
      highlightMessageRow(key);
    } else if (key.startsWith('message-')) {
      // 該当のチャットルームを開く
      openChat(key);
    }
  }, 250);  // オーバーレイが閉じきった後で遷移
}
```

---

## 8. 空状態(`notif-empty`)

通知が1件もない場合は専用の空状態を表示:

```html
<div class="notif-empty">
  <div class="notif-empty-icon">
    <i data-feather="bell-off"></i>
  </div>
  <div class="notif-empty-title">通知はまだありません</div>
  <div class="notif-empty-sub">
    あなたの音源に反応があったら、ここでお知らせします。
  </div>
</div>
```

```css
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 30px;
  gap: 14px;
}
.notif-empty-icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
}
.notif-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.notif-empty-sub {
  font-size: 12px;
  color: var(--text3);
  line-height: 1.6;
  max-width: 240px;
}
```

**コピー**:
- タイトル: 「通知はまだありません」
- サブ: 「あなたの音源に反応があったら、ここでお知らせします。」(CLAUDE.md §2 トーン準拠、温かい)

---

## 9. ベル(タイムライン側)との連動

タイムライン画面のベルアイコンには未読数バッジが付く:

```html
<button class="tl-icon-btn" id="tlNotifBtn" onclick="openNotifications()">
  <i data-feather="bell"></i>
  <span class="tl-icon-badge" id="tlNotifBadge">3</span>
</button>
```

```css
.tl-icon-badge {
  position: absolute;
  top: -2px; right: -2px;
  min-width: 16px; height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--red);
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--bg);
}
```

### 未読数の管理

- 未読数 = `.notif-row.unread` の数
- 0件のときはバッジを非表示
- 「すべて既読」タップで全部 `.unread` 解除 → バッジも消える
- 個別の通知タップでもその行が既読化される

---

## 10. データバインディング

```typescript
interface Notification {
  id: string;
  type: 'answer' | 'approved' | 'message';  // バッジの色を決める
  fromUsers: string[];                       // 通知元(複数の場合あり)
  textTemplate: string;                      // 「○○さんから音が届きました 🎵」
  contextTitle: string;                      // 関連するセッションカードのタイトル
  contextId: string;                         // 該当のチャットルームID等
  createdAt: Date;
  read: boolean;
}

// 表示時は日別にグルーピング
function groupByDay(notifs: Notification[]) {
  return {
    today: notifs.filter(/* ... */),
    yesterday: notifs.filter(/* ... */),
    older: notifs.filter(/* ... */),
  };
}
```

---

## 11. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### オーバーレイの挙動
- [ ] 🔔タップで**ページ遷移しない**(URLが変わらない)
- [ ] 通知が**右からスライドイン**(0.32秒、cubic-bezier)
- [ ] 背景が半透明 + blur(4px) のレイヤーで覆われる
- [ ] 背景タップで閉じる
- [ ] 「← 戻る」タップで閉じる
- [ ] 閉じる時も右にスライドアウト(逆再生)

### ヘッダー
- [ ] 「← 通知 すべて既読」の3要素構成
- [ ] タイトル「通知」(17px, 700)
- [ ] 「すべて既読」はテキストボタン(右側)

### 日別グルーピング
- [ ] 「今日 / 昨日 / もっと前」で区切る
- [ ] 各見出しは UPPERCASE, 10px, 700, text3
- [ ] 1件もないカテゴリは見出しを出さない

### 通知行
- [ ] アバター(36px円形) + 種別バッジ(右下、18px円形)
- [ ] テキスト + 時間 + 関連カード情報
- [ ] 関連カードは小さな box で表示(音符アイコン + タイトル)
- [ ] **未読**: 赤い背景(`rgba(232,74,95,0.06)`) + 左に赤いインジケータ
- [ ] **既読**: フラットなカード背景

### 種別バッジの色分け
- [ ] 新着アンサー: 赤(`var(--red)`)
- [ ] 承認: 緑(`#3a9b6b`)
- [ ] チャット: 青(`#3a7ebc`)

### コピー
- [ ] 「○○さんから音が届きました 🎵」(新着アンサー)
- [ ] 「○○さんと、会えそうですね 🎵」(承認)
- [ ] 「○○: メッセージ本文」(チャット)
- [ ] 空状態: 「通知はまだありません / あなたの音源に反応があったら〜」

### タップ挙動
- [ ] 新着アンサー → 該当チャットルームへ
- [ ] 承認 → メッセージ画面+該当行ハイライト(`msgRowFlash` アニメ)
- [ ] チャット新着 → 該当チャットルームへ
- [ ] タップでオーバーレイは自動的に閉じる

### ベル側
- [ ] 未読数が赤バッジで表示
- [ ] 0件のときはバッジ非表示
- [ ] 「すべて既読」または個別タップでバッジ更新

---

## 12. プロト参照箇所

具体的なコードはプロトの以下を参照:

| セクション | 行番号(目安) |
|---|---|
| 通知CSS全体 | 約 2465〜2601 |
| 通知オーバーレイHTML | 約 4240〜4345 |
| `openNotifications()` 関数 | (検索すれば見つかる) |
| `handleNotifClick()` 関数 | (同上) |

---

**最後に**: 通知は**ユーザーに「あなたの音楽が届いている」と伝える窓**。CLAUDE.md「**沈黙への配慮**」と同じ思想で、温かい言葉と適切な区別(色分け)で「ここに反応がある」と教える設計です。
