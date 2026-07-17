# メッセージ画面 & チャットルーム 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このページの位置づけ

**Our Session の「メッセージ」はSNSのDMとは違う設計**。

- 一般的なSNS: 人 ↔ 人のチャット
- **Our Session: セッションカード(楽曲)単位のチャットルーム**

つまり「**1つのセッションカードに対して、関わる人全員が集まる場**」。投稿主(ホスト)と、承認されたアンサー送信者たちが、その曲をやるためにスタジオの予定などを相談する。

これがブレるとサービスの本質が崩れます。

---

## 1. メッセージ一覧画面 (`screen-messages`)

### 1-1. 何を一覧するか

**チャットルームの「種」になりうるすべてのカード**を表示する。具体的には:

1. **自分がホスト**(投稿主)のカード
   - 新着アンサーがある → 上に出す(優先度高)
   - チャット進行中(承認済みアンサーあり)
   - アンサーまだ無し
2. **自分が承認待ち**のアンサーを送ったカード(他人のカード)
3. **自分が承認済み**で参加中のチャット(他人のカード)

### 1-2. 上部のヘッダー

```html
<div class="msg-topbar">
  <div class="msg-title">メッセージ</div>
  <div class="msg-count">6件</div>
</div>
```

- タイトルは **「メッセージ」** (「通知」ではない)
- 右側に件数(タップ反応なし、ただの情報)
- 背景は半透明 + blur(20px)で sticky

```css
.msg-topbar {
  position: sticky; top: 0;
  background: rgba(21,21,26,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 14px 18px 12px;
  z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
}
.msg-title { font-size: 18px; font-weight: 700; color: var(--text); }
.msg-count { font-size: 11px; color: var(--text3); font-weight: 500; }
```

### 1-3. 各行(`msg-row`)の構造

```html
<div class="msg-row" onclick="openChat()">
  <!-- 左: 相手のアバター + 自分の役割マーク -->
  <div class="msg-thumb" onclick="event.stopPropagation();goToProfile('あゆみ')">
    <i data-feather="user"></i>
    <div class="msg-thumb-role host">  <!-- host / guest / pending -->
      <i data-feather="disc"></i>
    </div>
  </div>
  <!-- 右: タイトル/時間/プレビュー/バッジ -->
  <div class="msg-body">
    <div class="msg-row-top">
      <div class="msg-row-title">山下達郎「Sparkle」コピー</div>
      <div class="msg-row-time">5分前</div>
    </div>
    <div class="msg-row-bottom">
      <div class="msg-row-preview alert">新しいアンサー · 2件</div>
      <div class="msg-badge">2</div>
    </div>
  </div>
</div>
```

**重要なポイント**:
- **行全体タップ** → チャットルームを開く
- **アバタータップだけは別** → そのユーザーのプロフィールページを開く(`event.stopPropagation()`)
- アバターには**役割マーク**が右下に重なる

### 1-4. 3つの役割マーク

| 役割 | クラス | アイコン | 色 | 意味 |
|---|---|---|---|---|
| host | `host` | `disc` (●) | 赤背景 | 自分が投稿主 |
| pending | `pending` | `clock` (時計) | グレー背景、内側暖色 | アンサー送って承認待ち |
| guest | `guest` | `users` | 赤系背景 | 承認済み参加中 |

```css
.msg-thumb {
  position: relative;
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.msg-thumb-role {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid var(--bg);
  display: flex; align-items: center; justify-content: center;
}
.msg-thumb-role.host {
  background: var(--red);
}
.msg-thumb-role.pending {
  background: linear-gradient(135deg, #ffb060 0%, #e88c5a 100%);
}
.msg-thumb-role.guest {
  background: var(--red2);
}
```

### 1-5. プレビュー行の4つの状態

| 状態 | クラス | 文言例 |
|---|---|---|
| 新着アンサーあり | `.alert` (赤) | 新しいアンサー · 2件 |
| 承認待ち | `.pending` (オレンジ) | ↳ アンサー送信済み · 承認待ち |
| 通常進行中 | (なし、グレー) | ゆうき: 来週土曜のスタジオ確保できました! |
| アンサーなし | `.empty` (グレー斜体) | セッションアンサーはまだいません |

### 1-6. バッジ(未読数)

- 未読数を赤い丸で右側に表示
- 0 の場合は表示しない

```css
.msg-badge {
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 9px;
  background: var(--red);
  color: white;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
```

### 1-7. 行のアニメーション

- ホバー: 背景を `var(--card-hl)` に
- タップ: `scale(0.99)`
- 通知から飛んできた時は `.highlight` クラスで赤フラッシュ(1.4秒)

```css
.msg-row.highlight {
  animation: msgRowFlash 1.4s ease-out;
}
@keyframes msgRowFlash {
  0% { background: rgba(232,74,95,0.20); }
  100% { background: var(--card); }
}
```

---

## 2. チャットルーム (`screen-chat`)

メッセージ一覧で行をタップすると遷移。**「セッションカード単位のチャット」**であり、上部にカードのスニペット、中央に未承認アンサー、区切り線、メッセージ、下部に入力欄。

### 2-1. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ ← 山下達郎「Sparkle」コピー  👥3  │  ← chat-header (sticky)
├─────────────────────────────────┤
│ ┌─────────────────────────┐    │
│ │ 🎵 山下達郎「Sparkle」     │    │
│ │   主催 · あなた           │    │  ← chat-session-snippet
│ │  [▶] ▮▮▮▮▮▮▮ 0:00/1:30 │    │     (常に表示、上部固定)
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ [⏰ 保留中 2人 [👤][👤] ▼]      │  ← pending-bar (承認後に出る)
├─────────────────────────────────┤
│ ┌─────────────────────────┐    │
│ │ 👤 あゆみ  ベース  5分前   │    │
│ │  [▶] ▮▮▮▮ 0:00/0:45     │    │  ← answer-card(未承認アンサー)
│ │  「Sparkle ずっと...」     │    │
│ │  [あとで] [承認する]       │    │
│ └─────────────────────────┘    │
│                                 │
│  ─────── チャット ───────       │  ← chat-divider (承認後)
│                                 │
│  👤 あゆみ                       │  ← chat-messages
│  ┌────────────────┐             │
│  │ はじめまして!   │             │
│  └────────────────┘             │
│                                 │
│              ┌────────┐         │
│              │ どうも! │         │
│              └────────┘         │
│                          あなた  │
│                                 │
├─────────────────────────────────┤
│ [挨拶する][担当は?][日程は?][...] │  ← quick-reply-wrap (承認後)
│ [メッセージを入力] [📤]          │  ← chat-input-wrap (承認後)
└─────────────────────────────────┘
```

### 2-2. ヘッダー(`chat-header`)

```html
<div class="chat-header">
  <button class="chat-back" onclick="closeChat()" aria-label="戻る">
    <i data-feather="chevron-left"></i>
  </button>
  <div class="chat-header-title">山下達郎「Sparkle」コピー</div>
  <div class="chat-header-members">
    <i data-feather="users"></i>
    <span id="chatMemberCount">1</span>
  </div>
</div>
```

- 左: ← 戻るボタン(円形)
- 中央: セッションカードのタイトル(1行省略)
- 右: 👥 + 参加人数(承認済みの数 + 1)

### 2-3. セッションスニペット(`chat-session-snippet`)

**ここが現在の実装で最も欠けている部分**。チャットの上部に **そのカード全体の縮小版** が常に表示される。誰と何の話をしてるのか常に分かるように。

```html
<div class="chat-session-snippet">
  <div class="chat-snippet-head">
    <div class="chat-snippet-thumb">
      <i data-feather="music"></i>
    </div>
    <div class="chat-snippet-info">
      <div class="chat-snippet-title">山下達郎「Sparkle」コピー</div>
      <div class="chat-snippet-meta">主催 · あなた</div>
    </div>
  </div>
  <div class="mp-row">
    <button class="mp-btn"><div class="mp-tri"></div></button>
    <div class="mp-bars"></div>
    <div class="mp-time">0:00 / 1:30</div>
  </div>
</div>
```

```css
.chat-session-snippet {
  margin: 12px 18px 0;
  padding: 12px 14px;
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
}
```

### 2-4. 未承認アンサーカード(`answer-card`)

```
┌─────────────────────────────────┐
│ 👤 あゆみ  [ベース]      5分前   │  ← answer-head
│ [▶] ▮▮▮▮▮ 0:00/0:45             │  ← mp-row (アンサーの音源)
│ Sparkle ずっとやりたかったです!  │  ← answer-message
│ [あとで] [承認する]              │  ← answer-actions
└─────────────────────────────────┘
```

**スタイル**:

```css
.answer-card {
  margin: 12px 18px;
  padding: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
}
.answer-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
}
.answer-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%);
}
.answer-name {
  font-size: 13px; font-weight: 600; color: var(--text);
  display: flex; align-items: center; gap: 6px;
}
.answer-instrument {
  font-size: 10px;
  background: var(--red-bg); border: 1px solid var(--red-border);
  color: var(--red2);
  padding: 1px 6px; border-radius: 6px;
  font-weight: 600;
}
.answer-time {
  font-size: 10px; color: var(--text3); margin-top: 2px;
}
.answer-message {
  font-size: 13px; color: var(--text); line-height: 1.6;
  margin: 10px 0;
}
.answer-actions {
  display: flex; gap: 8px;
}
.ans-btn {
  flex: 1; padding: 10px;
  border-radius: 12px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Outfit', sans-serif;
}
.ans-btn.skip {
  background: var(--card2); border: 1px solid var(--border);
  color: var(--text2);
}
.ans-btn.approve {
  background: var(--red); border: 1px solid var(--red);
  color: white;
  box-shadow: 0 4px 14px rgba(232,74,95,0.4);
}
```

### 2-5. 承認時の挙動

**「承認する」ボタンタップ時**:
1. このカード(answer-card)が消える
2. 残りの未承認アンサーが**自動的に折りたたまれて「保留中 N人」バー**になる
3. **chat-divider「── チャット ──」が表示される**
4. **chat-messages(空)+ quick-reply-wrap + chat-input-wrap が表示される**
5. システムメッセージとして「**○○さんと、会えそうですね 🎵**」がチャットに追加
6. 上部の参加人数 +1

```javascript
// 承認時のサンプルロジック
function approveAnswer(id, name) {
  // 1. このカードを削除
  document.getElementById(`ans-${id}`).remove();

  // 2. 残りのアンサーを保留中バーに折りたたみ
  const remaining = document.querySelectorAll('.answer-card');
  remaining.forEach(c => c.classList.add('deferred'));
  document.getElementById('pendingBar').style.display = remaining.length > 0 ? 'flex' : 'none';
  document.getElementById('pendingBarLabel').textContent = `保留中 ${remaining.length}人`;

  // 3. チャットセクションを表示
  document.getElementById('chatDivider').style.display = 'flex';
  document.getElementById('quickReplyWrap').style.display = 'flex';
  document.getElementById('chatInputWrap').style.display = 'flex';

  // 4. システムメッセージを追加
  addSystemMessage(`${name}さんと、会えそうですね 🎵`);

  // 5. 参加人数を更新
  incrementMemberCount();
}
```

### 2-6. 保留中バー(`pending-bar`)

承認後、残りの未承認アンサーは「保留中 N人」バーに折りたたまれる。

```html
<div class="pending-bar" id="pendingBar" onclick="togglePendingExpand()">
  <div class="pending-bar-icon"><i data-feather="clock"></i></div>
  <div class="pending-bar-label">保留中 2人</div>
  <div class="pending-bar-avatars">
    <!-- 縮小されたアバターを3個まで重ねて表示 -->
  </div>
  <div class="pending-bar-chevron"><i data-feather="chevron-down"></i></div>
</div>
```

- タップで展開/折りたたみ
- 展開時はシェブロンが回転(`rotate(180deg)`)

### 2-7. 区切り線(`chat-divider`)

承認後にだけ表示される。「ここから上はアンサー受付、ここから下は承認済みメンバーのチャット」を視覚的に区切る。

```html
<div class="chat-divider">
  <span class="chat-divider-text">チャット</span>
</div>
```

```css
.chat-divider {
  display: flex; align-items: center;
  margin: 20px 18px 14px;
  gap: 12px;
}
.chat-divider::before, .chat-divider::after {
  content: '';
  flex: 1; height: 1px;
  background: var(--border);
}
.chat-divider-text {
  font-size: 10px; font-weight: 700;
  color: var(--text3);
  letter-spacing: 1px; text-transform: uppercase;
}
```

### 2-8. メッセージスレッド(`chat-messages`)

各メッセージは「相手バブル(左)」「自分バブル(右)」「システムメッセージ(中央)」の3種類。

```html
<!-- 相手のメッセージ -->
<div class="chat-msg other">
  <div class="chat-msg-avatar"><i data-feather="user"></i></div>
  <div class="chat-msg-content">
    <div class="chat-msg-name">あゆみ</div>
    <div class="chat-msg-bubble">はじめまして!</div>
  </div>
</div>

<!-- 自分のメッセージ -->
<div class="chat-msg self">
  <div class="chat-msg-content">
    <div class="chat-msg-bubble">どうもです</div>
    <div class="chat-msg-name self">あなた</div>
  </div>
</div>

<!-- システムメッセージ -->
<div class="chat-msg system">
  <div class="chat-msg-system-text">あゆみさんと、会えそうですね 🎵</div>
</div>
```

**バブルのスタイル**:
- 相手: グレー背景、左寄せ、最大幅80%
- 自分: 赤背景(`var(--red)`)、右寄せ、白文字
- システム: 中央、薄いグレー文字、装飾なし

```css
.chat-msg.other .chat-msg-bubble {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 4px 18px 18px 18px;
  padding: 10px 14px;
  font-size: 13.5px; line-height: 1.5;
  max-width: 80%;
}
.chat-msg.self .chat-msg-bubble {
  background: var(--red);
  color: white;
  border-radius: 18px 4px 18px 18px;
  padding: 10px 14px;
  font-size: 13.5px; line-height: 1.5;
  max-width: 80%;
  margin-left: auto;
  box-shadow: 0 3px 10px rgba(232,74,95,0.3);
}
.chat-msg.system {
  text-align: center;
  margin: 14px 0;
}
.chat-msg-system-text {
  display: inline-block;
  font-size: 11.5px; color: var(--text3);
  padding: 5px 12px;
  background: rgba(255,255,255,0.04);
  border-radius: 12px;
}
```

### 2-9. クイックリプライ(`quick-reply-wrap`)

入力欄の上に **タップで定型文を送れるチップ** を並べる。承認後に表示される。

```html
<div class="quick-reply-wrap">
  <div class="qr-chip" onclick="toggleGreetingPicker()">挨拶する</div>
  <div class="qr-chip" onclick="postPartPoll()">担当は?</div>
  <div class="qr-chip disabled">日程は?</div>
  <div class="qr-chip disabled">スタジオは?</div>
</div>
```

**「挨拶する」**:
- タップで上にピッカー(下記)が出る
- 「こんにちは / よろしくお願いします / はじめまして」を選んで即送信

**「担当は?」**:
- タップで楽器投票バブルを送信(下記)
- 「Vo. Gt. Ba. Dr. Kb. Per.」のチップが付いた特殊メッセージ
- 各メンバーが自分の担当楽器を選んでタップ → リアルタイムで集計表示

**「日程は?」「スタジオは?」**:
- MVP では disabled(将来のスタジオ予約連携を見据えてグレーアウト)

### 2-10. 挨拶ピッカー(`greeting-picker`)

「挨拶する」タップで quick-reply-wrap の上にポップアップ。

```html
<div class="greeting-picker">
  <button onclick="sendGreeting(this)">こんにちは</button>
  <button onclick="sendGreeting(this)">よろしくお願いします</button>
  <button onclick="sendGreeting(this)">はじめまして</button>
</div>
```

### 2-11. パート投票バブル

「担当は?」タップで送信される特殊メッセージ。

```
┌────────────────────────────────┐
│ 担当の楽器を教えてください       │
│ [Vo.] [Gt.] [Ba.] [Dr.] [Kb.] │  ← タップで自分の担当を選ぶ
│ ▮▮▮▮ Vo. 1票                  │  ← 投票結果リアルタイム表示
│ ▮▮ Gt. 1票                     │
└────────────────────────────────┘
```

- 自分以外のメンバーが投票するとリアルタイムで反映(MVPでは擬似的に1秒後にBOTが投票)
- 既に投票した楽器は色が変わる

### 2-12. 入力欄(`chat-input-wrap`)

```html
<div class="chat-input-wrap">
  <input type="text" placeholder="メッセージを入力" oninput="updateSendBtn()">
  <button class="chat-send-btn" disabled>
    <i data-feather="send"></i>
  </button>
</div>
```

- テキストが入った時だけ送信ボタンが活性化
- 送信時は紙飛行機アイコンが赤くなる

---

## 3. 「承認待ち」状態の特殊画面

メッセージ一覧で**pending状態の行**をタップした時の挙動。`openPendingAnswer(key)` 関数で起動する。

これは**普通のチャットルームじゃない**。なぜなら自分はまだ承認されてないから、メッセージ送信できない。

### 表示内容
- 上部: ヘッダー(戻る + そのカードのタイトル)
- ホストのセッション情報(スニペット)
- **自分が送ったアンサー**(再生プレビュー + メッセージ内容)
- 「承認待ちです」のステータス表示
- **メッセージ入力欄は無い**(まだチャットできない)

### コピー
「○○さんがあなたのアンサーを聴いてくれるのを待っています」

---

## 4. ボトムナビ(全画面共通)

```
[📰 タイムライン] [➕ 投稿] [💬 メッセージ] [👤 マイページ]
```

**重要**:
- 4項目構成(現在実装の「家+ベル+人」3項目+大ボタンは間違い)
- メッセージタブはあくまで「💬 メッセージ」(吹き出し or messageアイコン)
- 「🔔 通知」は別。タイムライン画面の右上のベルアイコンから開くオーバーレイ
- フローティングピル形状

### ナビアイコン
- タイムライン: `home`
- 投稿: `plus`
- メッセージ: `message-square` or `message-circle`
- マイページ: `user`

---

## 5. デザイントークン(再掲)

```typescript
// すべての色・余白はトークンから引く。直書き禁止。
export const tokens = {
  color: {
    bg: '#15151a',
    card: 'rgba(26,26,32,0.55)',
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
    pendingOrange: '#ffb060',
  },
};
```

---

## 6. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### メッセージ一覧
- [ ] 上部タイトルが「**メッセージ**」(「通知」ではない)
- [ ] 右に件数表示
- [ ] 各行: アバター + 役割マーク + タイトル/時間/プレビュー/バッジ の構造
- [ ] 役割マーク3種類(host/pending/guest)が見た目で区別できる
- [ ] アバタータップで該当ユーザーのプロフィールページへ
- [ ] 行全体タップでチャットルームへ
- [ ] 4種類のプレビュー状態(alert / pending / 通常 / empty)
- [ ] 未読バッジが右側に出る
- [ ] 通知から飛んだ時にハイライトフラッシュ

### チャットルーム
- [ ] ヘッダーに ← / タイトル / 👥参加人数
- [ ] **上部にセッションスニペット**(カードの縮小版)、波形プレイヤー付き
- [ ] 未承認アンサーカードに [音源プレイヤー + メッセージ + あとで/承認するボタン]
- [ ] 承認すると残りが「保留中 N人」バーに自動折りたたみ
- [ ] 承認後にチャット区切り線、メッセージスレッド、入力欄が出現
- [ ] システムメッセージ「○○さんと、会えそうですね 🎵」が承認時に追加
- [ ] クイックリプライタブ(挨拶/担当は?/日程は?/スタジオは?)
- [ ] 「日程は?」「スタジオは?」は disabled(将来のスタジオ予約連携)
- [ ] 挨拶ピッカーの3択(こんにちは/よろしく/はじめまして)
- [ ] パート投票バブルの楽器選択UI

### 承認待ち画面
- [ ] pending状態の行タップで承認待ち画面が開く
- [ ] 自分のアンサーが表示される
- [ ] メッセージ入力欄が**無い**
- [ ] 「承認を待っています」的なステータス表示

### ボトムナビ
- [ ] 4項目(タイムライン/投稿/メッセージ/マイページ)
- [ ] 「メッセージ」と「通知」が別物
- [ ] 通知はタイムラインのベルアイコンから

---

## 7. プロト参照箇所

具体的なコードはプロトの以下の行を参照:

| セクション | 行番号(目安) |
|---|---|
| メッセージ一覧画面のHTML | 約 3886〜4014 |
| チャットルーム画面のHTML | 約 4017〜4150 |
| メッセージCSS | 約 2603〜2700 |
| チャット関連CSS | 約 2700〜2900 |
| 承認時のJSロジック | `approveAnswer`関数 |
| 承認待ち画面 | `openPendingAnswer`関数 |

---

**最後に**: メッセージ機能は Our Session の中で**最も「リアルセッションへの動線」を担う**部分。スタジオの日程・場所を相談する場所であり、サービスの本質に直結します。プロトの設計を**忠実に**再現してください。
