# 投稿ページ 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このページの位置づけ

### 重要: これは「ページ」であって「ドロワー」ではない

投稿は**ボトムナビ中央の➕タブから開く独立した画面**(Screen)です。

- ✅ **Screen** (`screen-post`): タイムライン・マイページ等と同列のメイン画面
- ❌ Drawer ではない(下から30%スライドアップする小さなパネルではない)
- ❌ Modal でもない

### サイトマップ上の位置

`sitemap.md` のカテゴリでは **画面 (Screen)** に該当。同じカテゴリ:
- タイムライン
- メッセージ一覧
- マイページ

### 入口

- ボトムナビ中央の **➕ ボタン**(赤い大きな丸)
- タイムラインからのみ遷移可能
- 未ログインなら認証ドロワーが先に出る

### 出口

- ヘッダー左「キャンセル」 → タイムラインへ戻る(入力中なら確認ダイアログ)
- ヘッダー右「公開」 → 投稿実行 → タイムラインへ戻る + 完了トースト
- ボトムナビ他項目タップ → 確認ダイアログ後に遷移

---

## 1. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ キャンセル | 新しいセッション | 公開 │  ← post-header (sticky)
├─────────────────────────────────┤
│ ┌─────────────────────────┐    │
│ │ 👥(緑) 同じギター好きが   │    │  ← 安心ブロック1: 孤独感解消
│ │       23人 いま探しています │   │
│ │       あなたの投稿を待っ... │   │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ 👁(琥珀) 公開範囲: 全員  │    │  ← 安心ブロック2: 公開範囲明示
│ │         足あとは残りません │   │
│ │         アプリ利用者なら... │   │
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ 音源           必須・90秒/5MBまで │  ← post-label
│ ┌─────────────────────────┐    │
│ │ 🎤 その場で録音する        │    │  ← rec-start (赤い大ボタン)
│ │   スマホのマイクで90秒まで  │    │
│ └─────────────────────────┘    │
│       ──── または ────          │  ← rec-or-row
│ ┌╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┐      │
│ ╎    ↑(赤)                ╎    │  ← mp3-drop (破線囲み、大きい)
│ ╎    ファイルから選ぶ        ╎    │
│ ╎    MP3 (90秒・5MBまで)   ╎    │
│ └╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┘      │
├─────────────────────────────────┤
│ タイトル        必須・30字以内    │
│ ┌─────────────────────────┐    │
│ │ 例: 山下達郎「Sparkle」... │    │
│ │                    0/30   │    │
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ 本文           任意・150字以内    │
│ ┌─────────────────────────┐    │
│ │ どんなセッションがしたいか │    │
│ │ どんな人を探しているかを... │   │
│ │                    0/150  │    │
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ セッションアンサー希望  必須・1つ以上│
│ ┌─────────────────────────┐    │
│ │ 楽器              [+ 追加] │    │
│ │ 未選択                    │    │
│ │ ─────                     │    │
│ │ ジャンル          [+ 追加] │    │
│ │ 未選択                    │    │
│ │ ─────                     │    │
│ │ エリア            [+ 追加] │    │
│ │ 未選択                    │    │
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ [🏠 タイムライン] [➕] [💬] [👤] │  ← フローティングナビ
└─────────────────────────────────┘
```

---

## 2. ヘッダー(`post-header`)

### 2-1. 構造

```html
<div class="post-header">
  <button class="post-header-btn" onclick="cancelPost()">キャンセル</button>
  <div class="post-header-title">新しいセッション</div>
  <button class="post-header-publish" id="postPublishBtn" onclick="tryPublish()">公開</button>
</div>
```

### 2-2. スタイル

```css
.post-header {
  position: sticky; top: 0;
  background: rgba(21,21,26,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 14px 18px;
  z-index: 5;
  display: flex; align-items: center; justify-content: space-between;
}
.post-header-btn {
  background: transparent; border: none;
  font-size: 13px; font-weight: 500;
  color: var(--text2);
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  padding: 4px 0;
}
.post-header-btn:hover { color: var(--text); }
.post-header-title {
  font-size: 15px; font-weight: 700;
  color: var(--text);
}
.post-header-publish {
  background: var(--card2);
  border: 1px solid var(--border);
  color: var(--text3);
  font-size: 13px; font-weight: 700;
  padding: 7px 18px;
  border-radius: 16px;
  cursor: not-allowed;
  font-family: 'Outfit', sans-serif;
  transition: all 0.18s;
}
.post-header-publish.ready {
  background: var(--red);
  border-color: var(--red);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(232,74,95,0.4);
}
```

### 2-3. 挙動

- **キャンセル**: タップでタイムラインへ戻る。入力中なら確認ダイアログ
- **「新しいセッション」**: タイトル(ラベル)。タップ反応なし
- **公開**: バリデーション通過時のみ赤くなる(`.ready`)、それまでは灰色で非活性
- 必須項目すべて入っていたら `.ready` が付く:
  - 音源アップロード完了
  - タイトル入力済み
  - タグ最低1つ選択(楽器/ジャンル/エリアどれか1つ以上)

### 2-4. 重要な注意点

- **ハンドル(横線)は無い**(ドロワーではないので)
- **×ボタンも無い**(キャンセルテキストボタンで閉じる)
- ヘッダーは sticky で上に固定される(スクロールしても見える)

---

## 3. 安心ブロック(`post-reassure`)

### 3-1. 2つの独立したブロック

ヘッダー直下に**2つの安心ブロック**が縦に並ぶ:

```html
<!-- 1: 孤独感解消(緑、users アイコン) -->
<div class="post-reassure" style="margin-top:12px;">
  <div class="post-reassure-icon">
    <i data-feather="users" style="width:15px;height:15px;stroke:#7ec88a;"></i>
  </div>
  <div class="post-reassure-body">
    <div class="post-reassure-title">同じギター好きが <b>23人</b> いま探しています</div>
    <div class="post-reassure-sub">あなたの投稿を待っている仲間がいます。スマホで録ったものでOKです。</div>
  </div>
</div>

<!-- 2: 公開範囲明示(琥珀、eye アイコン) -->
<div class="post-reassure">
  <div class="post-reassure-icon warm">
    <i data-feather="eye" style="width:15px;height:15px;stroke:#e88c5a;"></i>
  </div>
  <div class="post-reassure-body">
    <div class="post-reassure-title">公開範囲: <b>全員</b> ・ 足あとは残りません</div>
    <div class="post-reassure-sub">アプリ利用者なら誰でも聴けます。誰が聴いたかは表示されないので、安心して投稿できます。</div>
  </div>
</div>
```

### 3-2. スタイル

```css
.post-reassure {
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  margin: 0 18px 12px;
  display: flex; align-items: flex-start; gap: 11px;
}
.post-reassure-icon {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(126,200,138,0.12);     /* 緑系 (デフォルト = 孤独感解消) */
  border: 1px solid rgba(126,200,138,0.35);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.post-reassure-icon.warm {
  background: rgba(232,140,90,0.12);      /* 琥珀系 (公開範囲) */
  border-color: rgba(232,140,90,0.4);
}
.post-reassure-body { flex: 1; min-width: 0; }
.post-reassure-title {
  font-size: 12.5px; font-weight: 600; color: var(--text);
  line-height: 1.5; margin-bottom: 3px;
}
.post-reassure-sub {
  font-size: 11px; color: var(--text2); line-height: 1.55;
}
.post-reassure-sub b { color: var(--text); font-weight: 700; }
```

### 3-3. 重要な思想

CLAUDE.md §4「**必ず実装する安心装置**」より:
- **孤独感解消**(緑): 「同じ楽器・同じ好きの人が○人います」 → 投稿前に「ひとりじゃない」と伝える
- **公開範囲明示**(琥珀): 「誰が聴けるか/足あとは残らないか」 → **最大の恐怖を投稿前に消す**

両方とも**必須**で、片方だけだと不安が残る。**両方表示すること**。

### 3-4. 動的な数字

「同じギター好きが23人いま探しています」の `23人` 部分は、ユーザーの**最初の楽器タグに合わせて動的に変化**するのが理想。MVP段階では固定値でもOK。

---

## 4. 音源セクション

### 4-1. ラベル

```html
<div class="post-label">
  <span>音源</span>
  <span class="post-label-req">必須・90秒/5MBまで</span>
</div>
```

```css
.post-label {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 22px;
  margin: 18px 0 8px;
}
.post-label > span:first-child {
  font-size: 11px; font-weight: 700;
  color: var(--text2);
  letter-spacing: 0.3px;
}
.post-label-req {
  font-size: 10px;
  color: var(--red);          /* 赤で必須を強調 */
  font-weight: 700;
}
```

### 4-2. アイドル状態: 録音ボタン + 「または」 + ファイル選択

```html
<div id="postMp3Idle">
  <!-- 主役: 録音ボタン(大きな赤い四角) -->
  <button class="rec-start" onclick="startPostRecording()" 
          style="margin:0 18px;width:calc(100% - 36px);">
    <div class="rec-start-icon">
      <i data-feather="mic" style="width:20px;height:20px;stroke:white;stroke-width:2.5;"></i>
    </div>
    <div class="rec-start-body">
      <div class="rec-start-title">その場で録音する</div>
      <div class="rec-start-sub">スマホのマイクで90秒まで</div>
    </div>
  </button>

  <!-- セパレータ -->
  <div class="rec-or-row" style="margin:10px 18px;">または</div>

  <!-- 副次: ファイル選択(破線囲みの大きなドロップゾーン) -->
  <label class="mp3-drop" id="mp3Drop">
    <div class="mp3-drop-icon">
      <i data-feather="upload" style="width:20px;height:20px;stroke:var(--red2);"></i>
    </div>
    <div class="mp3-drop-title">ファイルから選ぶ</div>
    <div class="mp3-drop-sub">MP3 (90秒・5MBまで)</div>
    <input type="file" accept="audio/mpeg,audio/mp3,.mp3" 
           id="mp3Input" onchange="onMp3Selected(event)">
  </label>
</div>
```

### 4-3. 録音ボタン(`rec-start`)のスタイル

```css
.rec-start {
  width: 100%;
  background: var(--red);       /* 赤背景 */
  border: 1px solid var(--red);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex; align-items: center; gap: 14px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(232,74,95,0.35);
  transition: all 0.18s;
  font-family: 'Outfit', sans-serif;
}
.rec-start:hover { transform: translateY(-1px); }
.rec-start-icon {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rec-start-body { flex: 1; text-align: left; }
.rec-start-title {
  font-size: 15px; font-weight: 700; color: white;
  margin-bottom: 3px;
}
.rec-start-sub {
  font-size: 11px; color: rgba(255,255,255,0.85);
}
```

### 4-4. 「または」セパレータ

```css
.rec-or-row {
  display: flex; align-items: center; gap: 12px;
  color: var(--text3);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-align: center;
}
.rec-or-row::before,
.rec-or-row::after {
  content: '';
  flex: 1; height: 1px;
  background: var(--border);
}
```

### 4-5. ファイル選択(`mp3-drop`)のスタイル

```css
.mp3-drop {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px;
  padding: 28px 18px;
  margin: 0 18px;
  border: 1.5px dashed var(--border2);    /* 破線! */
  border-radius: 16px;
  background: var(--card);
  backdrop-filter: blur(20px);
  cursor: pointer;
  transition: all 0.18s;
  text-align: center;
}
.mp3-drop:hover {
  border-color: var(--red-border);
  background: var(--card-hl);
}
.mp3-drop-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  display: flex; align-items: center; justify-content: center;
}
.mp3-drop-title {
  font-size: 14px; font-weight: 700; color: var(--text);
}
.mp3-drop-sub {
  font-size: 11px; color: var(--text3);
}
.mp3-drop input[type="file"] { display: none; }
```

### 4-6. 重要な思想

- **録音 > ファイル選択** の優先度
  - 録音は**赤い大きなボタンで目立つ**(スマホで録ったものでOKを強調)
  - ファイル選択は破線囲みの控えめなドロップゾーン
- 並びは**録音 → または → ファイル選択** の順(録音を上に)
- CLAUDE.md「**スマホで録ったものでOK**」のメッセージを体現

---

## 5. 録音中・完了の状態(他の仕様書参照)

録音中、カウントダウン、プレビュー、アップロード進捗、エラー、成功などの状態UIは別仕様書(または timeline-screen-spec.md と同じパターン)に従う。

主なステート:
- `idle`: 録音ボタン + ファイル選択
- `countdown`: 3秒カウントダウン(72px数字、ポップアニメ)
- `recording`: 録音中(赤いパルス + 波形 + タイマー + 「やめる」「停止」)
- `preview`: プレビュー再生 + 「もう一度」「これで送る」
- `uploading`: 進捗バー(0% → 100%)
- `error`: アンバー色のエラー表示 + 「もう一度試す」「別のファイル」
- `success`: 緑チェック + ファイル名 + 波形プレイヤー

### 5-1. アップロード成功表示(`mp3-selected`)

これが現在の実装で問題ありそう:

```html
<div class="mp3-selected" id="mp3Selected" style="display:none;">
  <div class="mp3-selected-head">
    <div class="upload-icon success" style="width:30px;height:30px;">
      <i data-feather="check" style="width:14px;height:14px;stroke:#7ec88a;"></i>
    </div>
    <div class="mp3-selected-name" id="mp3Name">mp3-demo-file.mp3</div>
    <div class="mp3-remove" onclick="removeMp3()" aria-label="削除">
      <i data-feather="x" style="width:14px;height:14px;stroke:var(--text2);"></i>
    </div>
  </div>
  <div class="mp-row">
    <button class="mp-btn" id="mpb-post" onclick="toggleMP('-post')"><div class="mp-tri" id="mpi-post"></div></button>
    <div class="mp-bars" id="mpbars-post"></div>
    <div class="mp-time">0:00 / 1:30</div>
  </div>
</div>
```

**重要**: ファイル名が**明示的に表示**される(`mp3-demo-file.mp3` などのフルファイル名)。プロト Image 2 で見える形。

---

## 6. タイトル(`postTitle`)

### 6-1. 構造

```html
<div class="post-label">
  <span>タイトル</span>
  <span class="post-label-req">必須・30字以内</span>
</div>
<div class="post-input-wrap">
  <input type="text" class="post-input-title" id="postTitle" 
         maxlength="60" 
         placeholder="例: 山下達郎「Sparkle」コピー" 
         oninput="onTitleInput()">
  <div class="post-counter" id="titleCounter">0 / 30</div>
</div>
```

### 6-2. スタイル

```css
.post-input-wrap {
  position: relative;
  margin: 0 18px;
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 16px;
  transition: border-color 0.18s;
}
.post-input-wrap:focus-within {
  border-color: var(--red-border);
}
.post-input-title {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 500;
  padding-right: 60px;
}
.post-input-title::placeholder { color: var(--text3); }
.post-counter {
  position: absolute;
  bottom: 6px; right: 12px;
  font-size: 10px;
  color: var(--text3);
  font-weight: 500;
}
.post-counter.over { color: var(--red); }
```

### 6-3. 注意点

- **placeholder**: 「例: 山下達郎「Sparkle」コピー」
  - ❌「例: ジャズセッション相手を探しています」(現在の実装)
  - ❌「タイトルを入力」(命令形)
- 最大30字、超えたらカウンタが赤(`over`)
- maxlength="60" は念のため2倍の余裕、JS側で30字制限を強制

---

## 7. 本文(`postBody`)

### 7-1. 構造

```html
<div class="post-label">
  <span>本文</span>
  <span style="font-size:9px;color:var(--text3);">任意・150字以内</span>
</div>
<div class="post-input-wrap">
  <textarea class="post-textarea" id="postBody" 
            maxlength="300" 
            placeholder="どんなセッションがしたいか、どんな人を探しているかを書いてみよう。" 
            oninput="onBodyInput()"></textarea>
  <div class="post-counter" id="bodyCounter">0 / 150</div>
</div>
```

### 7-2. スタイル

```css
.post-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  min-height: 90px;
  resize: none;
  padding-bottom: 12px;
}
.post-textarea::placeholder { color: var(--text3); }
```

### 7-3. 注意点

- **ラベルは「本文」**(❌「ひとこと」)
- **必須マークは無い**(任意なので)
- 「任意・150字以内」のサブテキストは text3 で控えめ(赤じゃない)
- placeholder「どんなセッションがしたいか、どんな人を探しているかを書いてみよう。」
  - 「書いてみよう」は CLAUDE.md トーンの**そっと背中を押す**例

---

## 8. タグセクション(`post-tag-card`)

### 8-1. 重要: カンマ区切りテキストではない

現在の実装は「ジャズ, ギター, 初心者歓迎」のような**カンマ区切りテキスト入力**ですが、これはプロトと全く違います。

プロトは**3カテゴリ別の「+追加」ボタン**で、タップで**フィルタシートを開いて複数選択**する構造:

### 8-2. 構造

```html
<div class="post-label">
  <span>セッションアンサー希望</span>
  <span class="post-label-req">必須・1つ以上</span>
</div>
<div class="post-tag-card">
  <div class="post-tag-group">
    <div class="post-tag-group-head">
      <div class="post-tag-group-lbl">楽器</div>
      <div class="post-tag-add" onclick="openPostFilterSheet('instrument')">
        <i data-feather="plus" style="width:11px;height:11px;stroke:currentColor;"></i> 追加
      </div>
    </div>
    <div class="post-tag-list" id="postTagsInstrument">
      <div class="post-tag-empty">未選択</div>
    </div>
  </div>
  
  <div class="post-tag-group">
    <div class="post-tag-group-head">
      <div class="post-tag-group-lbl">ジャンル</div>
      <div class="post-tag-add" onclick="openPostFilterSheet('genre')">
        <i data-feather="plus" style="width:11px;height:11px;stroke:currentColor;"></i> 追加
      </div>
    </div>
    <div class="post-tag-list" id="postTagsGenre">
      <div class="post-tag-empty">未選択</div>
    </div>
  </div>
  
  <div class="post-tag-group">
    <div class="post-tag-group-head">
      <div class="post-tag-group-lbl">エリア</div>
      <div class="post-tag-add" onclick="openPostFilterSheet('area')">
        <i data-feather="plus" style="width:11px;height:11px;stroke:currentColor;"></i> 追加
      </div>
    </div>
    <div class="post-tag-list" id="postTagsArea">
      <div class="post-tag-empty">未選択</div>
    </div>
  </div>
</div>
```

### 8-3. スタイル

```css
.post-tag-card {
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  margin: 0 18px;
  padding: 0 16px;
}
.post-tag-group {
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.post-tag-group:last-child { border-bottom: none; }
.post-tag-group-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.post-tag-group-lbl {
  font-size: 12px; font-weight: 700; color: var(--text);
}
.post-tag-add {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 5px 11px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  transition: all 0.18s;
}
.post-tag-add:hover {
  background: var(--card-hl);
  border-color: var(--red-border);
  color: var(--red2);
}
.post-tag-list {
  display: flex; flex-wrap: wrap; gap: 6px;
  min-height: 26px;
}
.post-tag-empty {
  font-size: 11px; color: var(--text3);
  font-style: italic;
}
.post-tag-pill {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  border-radius: 14px;
  padding: 4px 6px 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--red2);
  font-family: 'Outfit', sans-serif;
}
.post-tag-pill-x {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: rgba(232,74,95,0.10);
  cursor: pointer;
  transition: background 0.15s;
}
.post-tag-pill-x:hover { background: rgba(232,74,95,0.22); }
```

### 8-4. 「+追加」タップで開くフィルタシート

**`openPostFilterSheet('instrument')`** で `filter-sheet-spec.md` のフィルタシートが下から開く:
- 楽器/ジャンル/エリアの選択肢から複数選択
- 「決定」で閉じて、選択した内容が `.post-tag-list` に**ピル形式**で追加される
- 各ピルに×ボタンで個別削除可能

**重要**: タイムラインのフィルタシートと**同じシート**を再利用。`currentContext = 'post'` で挙動を切り替える。

### 8-5. 必須条件

「セッションアンサー希望」は**必須・1つ以上**:
- 楽器/ジャンル/エリアのどれか1つでもタグがあればOK
- すべて空だと「公開」ボタンが非活性のまま

---

## 9. バリデーション

### 9-1. 「公開」ボタンの活性条件

以下すべてを満たしたら `.ready` クラスが付いて赤くなる:

```typescript
function updatePublishState() {
  const hasMp3 = mp3Selected;
  const hasTitle = document.getElementById('postTitle').value.trim().length > 0;
  const titleOk = document.getElementById('postTitle').value.length <= 30;
  const bodyOk = document.getElementById('postBody').value.length <= 150;
  const hasTags = 
    postTags.instrument.length > 0 ||
    postTags.genre.length > 0 ||
    postTags.area.length > 0;
  
  const ready = hasMp3 && hasTitle && titleOk && bodyOk && hasTags;
  document.getElementById('postPublishBtn').classList.toggle('ready', ready);
}
```

### 9-2. 公開時の処理

```typescript
function tryPublish() {
  const btn = document.getElementById('postPublishBtn');
  if (!btn.classList.contains('ready')) return;
  
  // 投稿実行(本実装では Supabase に送信)
  
  // タイムラインへ戻る
  navigateTo('timeline');
  
  // 完了トースト
  showToast('あなたの音、届きました🎵<br>仲間が見つかったらお知らせします。');
  
  // フォームをリセット
  resetPostForm();
}
```

### 9-3. キャンセル時の確認

入力中(タイトル・本文・音源・タグのいずれかに変更あり)なら確認ダイアログ:

```typescript
function cancelPost() {
  const isDirty = 
    mp3Selected ||
    document.getElementById('postTitle').value.length > 0 ||
    document.getElementById('postBody').value.length > 0 ||
    postTags.instrument.length > 0 ||
    postTags.genre.length > 0 ||
    postTags.area.length > 0;
  
  if (isDirty) {
    if (!confirm('入力内容を破棄してタイムラインに戻りますか?')) return;
  }
  
  resetPostForm();
  navigateTo('timeline');
}
```

---

## 10. 完了時のトースト

CLAUDE.md §2 の決まった文言:

```
「あなたの音、届きました🎵
 仲間が見つかったらお知らせします。」
```

トースト仕様は `messages-screen-spec.md` 等の他の画面と同じパターン:
- 画面下部、ボトムナビの少し上
- 3.8秒で自動消滅、×ボタンで手動クローズ
- 🎵 アイコン + 2行メッセージ

---

## 11. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### 構造
- [ ] **画面遷移するページ**(`screen-post`)であって、ドロワーではない
- [ ] ハンドル(横線)が**無い**
- [ ] ×ボタンが**無い**(代わりに「キャンセル」テキストボタン)
- [ ] ボトムナビが**表示される**

### ヘッダー
- [ ] 「キャンセル | 新しいセッション | 公開」の3要素構成
- [ ] sticky で上に固定、半透明 + blur
- [ ] 「公開」ボタンは必須項目すべて入力されるまで非活性(灰色)
- [ ] 入力完了で `.ready` クラスが付いて赤く

### 安心ブロック
- [ ] 2つの独立したブロックが縦に並ぶ
- [ ] 1つ目: 緑アイコン「同じ○○好きが ○人 いま探しています」
- [ ] 2つ目: 琥珀アイコン「公開範囲: 全員 ・ 足あとは残りません」
- [ ] サブテキストに「スマホで録ったものでOK」「誰が聴いたかは表示されない」等の温かいコピー
- [ ] アイコンは緑(`rgba(126,200,138,0.12)`)と琥珀(`rgba(232,140,90,0.12)`)で区別

### 音源セクション
- [ ] ラベル「音源」+ 「必須・90秒/5MBまで」(赤の必須マーク)
- [ ] **「その場で録音する」が主役の赤い大きなボタン**(マイクアイコン)
- [ ] サブテキスト「スマホのマイクで90秒まで」
- [ ] 「── または ──」セパレータ
- [ ] 「ファイルから選ぶ」は**破線囲みの大きなドロップゾーン**
- [ ] ↑アップロードアイコン(赤の円形バッジ)
- [ ] サブテキスト「MP3 (90秒・5MBまで)」

### アップロード成功時
- [ ] 緑チェック + **ファイル名表示** + ×ボタン
- [ ] 波形プレイヤーが表示される(0:00 / 0:06 など)

### タイトル
- [ ] ラベル「タイトル」+ 「必須・30字以内」(赤の必須マーク)
- [ ] placeholder「例: 山下達郎「Sparkle」コピー」
- [ ] 右下にカウンタ「0 / 30」、超えたら赤
- [ ] フォーカス時に枠が赤に

### 本文
- [ ] ラベル「本文」(❌「ひとこと」)
- [ ] サブ「任意・150字以内」は text3 で控えめ
- [ ] placeholder「どんなセッションがしたいか、どんな人を探しているかを書いてみよう。」

### タグ
- [ ] ラベル「セッションアンサー希望」+ 「必須・1つ以上」(赤)
- [ ] **カンマ区切りテキスト入力ではない**
- [ ] 3カテゴリ(楽器/ジャンル/エリア)が縦に並ぶカード
- [ ] 各カテゴリに「+追加」ボタン
- [ ] 「+追加」タップで**フィルタシートが下から開く**
- [ ] 選択した内容がピル形式で表示、各×で削除可能
- [ ] 未選択時は「未選択」(イタリック、text3)

### 「練習中」トグルは無い
- [ ] 投稿ページに「練習中」トグルが**ない**(これはプロフィール編集の話)

### 投稿ボタン
- [ ] 画面下部に「投稿する」ボタンは**ない**(ヘッダー右の「公開」が投稿ボタン)

### バリデーション
- [ ] 音源 + タイトル + タグ最低1つで「公開」が活性
- [ ] 公開タップで投稿 → タイムラインへ → 完了トースト
- [ ] キャンセル時、入力中なら確認ダイアログ

### コピー
- [ ] 完了トースト: 「あなたの音、届きました🎵 / 仲間が見つかったらお知らせします。」

---

## 12. プロト参照箇所

具体的なコードはプロトの以下を参照:

| セクション | 行番号(目安) |
|---|---|
| 投稿ページHTML | 約 3654〜3884 |
| 投稿ページCSS | 約 1380〜1500 |
| 安心ブロック CSS | 約 1383〜1411 |
| ヘッダーCSS | 約 1412〜1440 |
| 録音UI CSS | 約 1500〜1640 |
| MP3アップロードUI CSS | 約 1700〜1790 |
| tryPublish 関数 | 検索 |
| resetPostForm 関数 | 検索 |
| openPostFilterSheet 関数 | 約 5533 |

---

**最後に**: 投稿ページは「**初心者が初めて音を投稿する瞬間**」を守る最重要画面。CLAUDE.md「**怖い・恥ずかしい・面倒**」を全部消す設計です。安心ブロック2つを必ず表示し、温かいコピーで背中を押すこと。
