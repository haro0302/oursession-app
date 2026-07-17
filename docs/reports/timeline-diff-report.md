# タイムライン画面 実装差分レポート

> 現在の実装スクショ(タイムライン画面)と、プロト(`our-session-modern.html`)・仕様書(`timeline-screen-spec.md`)を比較した結果。
> Claude Code は**すべて**を修正すること。

---

## ❌ 致命的な問題

### 問題1: ヘッダー右上の通知・検索アイコンが無い

**現状**: タイトル「タイムライン」だけがヘッダーに表示されている。右側に何もない。

**正解**: 右上に**2つの円形ボタン**が並ぶ:

```
[タイムライン]                     [🔔] [🔍]
                                    ↑    ↑
                                 通知   検索
```

- **🔔 通知ボタン**: 未読数バッジ付き(赤い小さな丸に数字)、タップで通知オーバーレイ
- **🔍 検索ボタン**: タップで下に検索パネルが開閉、開いている時はボタンが赤に

**仕様書参照**: `timeline-screen-spec.md §2`

**修正**: `tl-topbar-actions` 要素を追加、2つの `tl-icon-btn` を配置。

---

### 問題2: 「いま○人が聴いています」表示が全カードで欠如

**現状**: 波形プレイヤーの下に何もない。空白。

**正解**: 波形プレイヤーの**直下**に、緑のパルスドット + 「いま○人が聴いています」表示。

```
[▶] ▮▮▮▮ 0:00/1:30
🟢 いま5人が聴いています   ← これが現在表示されていない
─────
セッションアンサー希望
```

**重要な思想**: CLAUDE.md §4「沈黙への配慮」で**必ず実装する安心装置**として明記されている。「無反応＝無価値にしない」ための装置。

**仕様書参照**: `timeline-screen-spec.md §4-5`

**修正コード**:

```jsx
{listeningCount > 0 && (
  <div className="listening-now">
    <span className="listening-dot"></span>
    <span>いま<span className="listening-count">{listeningCount}人</span>が聴いています</span>
  </div>
)}
```

```css
.listening-now {
  display: flex; align-items: center; gap: 6px;
  margin-top: 7px;
  font-size: 10.5px;
  color: var(--text3);
}
.listening-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #7ec88a;
  animation: listeningPulse 2.2s ease-in-out infinite;
}
@keyframes listeningPulse {
  0%, 100% { opacity: 0.5; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 8px rgba(126,200,138,0.6); }
}
.listening-count { color: var(--text2); font-weight: 600; }
```

**注意**: 0人の場合は**表示しない**(無反応を強調しないため)。

---

### 問題3: タグの上の「セッションアンサー希望」ラベルが無い

**現状**: タグが本文の直下に直接表示されている(ラベルなし)。

**正解**: タグの上に小さな見出し「**セッションアンサー希望**」がある:

```
─────
セッションアンサー希望    ← このラベルが無い
[Vo.] [大阪] [Folk]
─────
```

**意味**: タグは「**この曲をやりたい人に向けたアンサー募集の条件**」を示すもの。ラベルが無いとタグが何の情報なのか分からなくなる。

**仕様書参照**: `timeline-screen-spec.md §4-6`

**修正**: `tl-tags-wrap > tl-tags-lbl` 要素を追加。

```jsx
<div className="tl-tags-wrap">
  <div className="tl-tags-lbl">セッションアンサー希望</div>
  <div className="tag-row">
    <span className="sc-tag">Vo.</span>
    <span className="sc-tag">大阪</span>
    <span className="sc-tag">Folk</span>
  </div>
</div>
```

---

### 問題4: 自分のカードのレイアウトがプロト準拠になっていない

**現状**: タイムラインに自分のカード「テスト260612_2」「テスト260612」が表示されているが、フッターが完全に無い(⋯メニューのみ)。

**正解**: タイムラインに自分のカードを**混ぜて表示するのは正しい挙動**(変更方針)。ただし、自分のカードでは:
- 🔖 保存ボタン: **非表示**(自分のカードを保存しない)
- アンサーボタン: **非表示**(自分にアンサーを送らない)
- フッター自体は**表示**: アバター + 名前 + 練習中バッジ
- ⋯メニュー: **編集 / 削除**(他人なら 通報 / ブロック)

**設計判断の経緯**: 投稿者が自分のカードをタイムラインで見られないと「ちゃんと公開された?」と不安になる。CLAUDE.md 第0条1「初心者が怖い・面倒を感じない」に反する。**X、Instagram などのSNS文化とも整合**するので、タイムラインに自分のカードを表示する方針に確定。

**実装方針**:

```jsx
<SessionCard 
  card={card} 
  variant="timeline"
  isOwn={card.authorId === currentUserId} 
/>
```

`isOwn` フラグでフッターの内容を分岐:

```jsx
<div className="tl-foot">
  <div className="tl-avatar" onClick={goToProfile} />
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

⋯メニューも分岐:

```jsx
<button className="sc-edit" onClick={() => 
  isOwn 
    ? openOwnCardAction(card.id)  // 編集/削除
    : openOtherCardAction(card.authorName, card.title)  // 通報/ブロック
}>
```

**重要**: 「いま○人が聴いています」「セッションアンサー希望」ラベル、タグ表示は**自分のカードでも他人のカードでも同じ**。違うのはフッターの右半分(保存・アンサーボタン)と⋯メニューの中身だけ。

**仕様書参照**: `timeline-screen-spec.md §4-8`

---

## ⚠️ 中程度の問題

### 問題5: 本文が初期1行表示になっていない

**現状**: 最初のカード「2人からリクエスト〜」の本文「2人からリクエストのひとこと」が表示されている。他のカードも同様に1行を超えて表示されている可能性。

**正解**: 本文は**初期1行で省略**(`-webkit-line-clamp: 1`)、**タップで展開**。

**理由**: CLAUDE.md「**視線を音源・アクションに集中させる**」ため。1スクリーン1〜1.5枚の散歩感を実現する。

**仕様書参照**: `timeline-screen-spec.md §4-2`

**修正**: 

```css
.sc-msg {
  display: -webkit-box;
  -webkit-line-clamp: 1;       /* ←1行クランプ */
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

JS:
```typescript
function handleBodyClick(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.classList.toggle('expanded');
}
```

---

### 問題6: タグの見た目がプロトと違う

**現状**: タグが大きめのフラットな角丸ボックス、内側にゆとり、文字も大きめ。

**正解**: プロトのタグは**コンパクト**:
- padding: 3px 9px (上下小さめ)
- border-radius: 10px (角丸控えめ)
- font-size: 10.5px
- font-weight: 500
- 半透明背景

**現状の見た目**は大きすぎて、カード内で目立ちすぎている。

**仕様書参照**: `timeline-screen-spec.md §4-6`

**修正**:

```css
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

---

### 問題7: 練習中バッジの位置

**現状**: 練習中バッジが**名前の隣**に正しく入っているように見える(これは合っている)。

ただし、スクショ2枚目のカード(ウエ...)では名前が **「ウエ...」と省略されすぎ**。これは練習中バッジが幅を取りすぎていてユーザー名が押し出されている可能性。

**正解**: 練習中バッジは**コンパクト**(font-size: 9px)、名前は最大幅80pxくらいで省略。バッジは右隣に小さく。

**仕様書参照**: `timeline-screen-spec.md §4-7`

**修正**: `.tl-username` の `max-width` 設定を確認:

```css
.tl-username {
  flex: 0 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;  /* この値で長い名前は省略 */
}
.tl-username-row {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.beginner-badge-mini {
  font-size: 9px;
  /* 小さくコンパクトに */
}
```

---

### 問題8: マイページでの自分のカードのレイアウト

**現状**: タイムラインに自分のカードが混在しているが、それらは**フッターが完全に無い構造**(タグだけで終わってる)。

**正解**: 
- **タイムラインの自分のカード**: 問題4で対応(フッターあり、ただし保存・アンサーボタンは非表示)
- **マイページの自分のカード**: より**シンプルな表示**

マイページでのカードレイアウト:

```
[⋯メニュー(編集/削除)]
[日付]
[タイトル]
[本文(1行折りたたみ)]
[波形プレイヤー]
[いま○人が聴いています]   ← 自分のカードでも表示する
[タグ群(sc-tags、シンプル版、「セッションアンサー希望」ラベル無し)]
↑ ここまでで終わる、フッター無し
```

**仕様書参照**: `timeline-screen-spec.md §4-8`

**重要**: 
- マイページ用カードは `sc-tags` (シンプル) を使う
- タイムライン用カードは `tl-tags-wrap` + `tl-foot` を使う
- 同じセッションカードでも**表示場所によってバリアント**が変わる

```jsx
// マイページ
<SessionCard variant="mypage" card={card} />

// タイムライン(自分のカードでも他人のカードでも)
<SessionCard variant="timeline" card={card} isOwn={card.authorId === currentUserId} />
```

---

## ⚠️ 細かい問題

### 問題9: 本文「2人からリクエストのひとこと」が見える

**現状**: 最初のカードで本文が完全に展開されて見える状態。

**理由**: テスト用に短い本文だった可能性 + 1行クランプが効いていない。

**修正**: 問題5と一緒に対処(line-clamp 1行設定)。

---

### 問題10: カードの保存ブックマークの状態

**現状**: 2枚目のカード(ウエガキ)のブックマーク🔖が**塗りつぶされた状態**(赤?)で表示されている。3枚目はアウトラインのみ(未保存)。

**正解**: これは正しい挙動。保存済みのカードは🔖が塗りつぶされる。**問題なし**。

---

## ✅ 既に合っている部分

- タイトル「タイムライン」のフォントサイズ・位置(左上、大きく)
- セッションカードの基本骨格(日付/タイトル/本文/波形/タグ)
- カードの半透明背景 + 角丸
- 波形プレイヤーの赤い再生ボタンと波形バー
- 練習中バッジの色(黄→オレンジグラデーション)と「🔰 練習中」テキスト
- 練習中バッジの位置(名前の隣)
- アンサーボタンの赤いピル形状、紙飛行機アイコン + テキスト
- ブックマーク🔖アイコンの形状と保存トグル機能
- 自分のカードの⋯メニュー位置(右上)

---

## 修正の優先順位

### Phase 1: ヘッダーと安心装置(致命的)
1. **問題1**: ヘッダー右上に🔔通知・🔍検索ボタン追加
2. **問題2**: 「いま○人が聴いています」を全カードに追加(0人時は非表示)
3. **問題3**: タグの上に「セッションアンサー希望」ラベル追加

### Phase 2: カード構造の整理(致命的)
4. **問題4**: 自分のカードでも `isOwn` フラグでフッターを表示、ただし保存・アンサーボタンは非表示
5. **問題8**: マイページ用は `variant="mypage"` でシンプル版を使う

### Phase 3: 見た目の調整
6. **問題5**: 本文を1行クランプ + タップ展開
7. **問題6**: タグのコンパクトなスタイルに修正
8. **問題7**: 練習中バッジと名前の幅調整

---

## Claude Code への指示テンプレート

```
タイムライン画面に実装ズレがあります。

以下のドキュメントを Read で全部読んでください:

1. docs/sitemap.md (全体構造)
2. docs/specs/timeline-screen-spec.md (タイムライン詳細仕様)
3. docs/reports/timeline-diff-report.md (現在の不一致リスト)
4. prototypes/our-session-modern.html
   - 行 3392〜3601 (タイムラインHTML)
   - 行 2867〜3000, 3220〜3340 (関連CSS)

読んだら Plan Mode で「修正の優先順位」のPhase順に修正計画を提示してください。

特に重要な概念:
- タイムラインは「他人のカードのみ」表示する(自分のカードはマイページへ)
- 「いま○人が聴いています」は CLAUDE.md §4 で必須の安心装置
- タグの上には必ず「セッションアンサー希望」ラベル
- 本文は初期1行表示、タップで展開
```

---

## 受け入れチェックリスト

実装し終わったら以下を確認:

### ヘッダー
- [ ] 「タイムライン」タイトル(22px, 700, 左)
- [ ] 右上に🔔通知ボタン(円形、未読バッジ付き)
- [ ] 右上に🔍検索ボタン(円形)
- [ ] 検索ボタンタップで検索パネル開閉、ボタン色変化

### カード本体
- [ ] 本文が初期1行表示(タップで展開)
- [ ] 波形プレイヤーの直下に「いま○人が聴いています」
- [ ] 0人の場合は listening-now を非表示
- [ ] 緑のドットが2.2秒周期でパルスアニメ
- [ ] **タイムラインに自分のカードも他人のカードと一緒に時系列で表示**

### タグ部分
- [ ] 「セッションアンサー希望」ラベル(text3, 10px, 600)
- [ ] タグはコンパクト(padding 3px 9px、radius 10px、font 10.5px)

### フッター(他人のカード)
- [ ] アバター + 名前 + 練習中バッジ(ON時のみ) + 🔖 + [アンサー]
- [ ] アバター・名前タップでプロフィールページへ
- [ ] 🔖タップで保存トグル(数字なし)
- [ ] アンサーボタンで投稿ドロワー
- [ ] ⋯メニュー → 通報 / ブロック

### フッター(タイムライン上の自分のカード)
- [ ] アバター + 名前 + 練習中バッジ(ON時のみ)のみ表示
- [ ] 🔖 保存ボタンは**非表示**
- [ ] アンサーボタンは**非表示**
- [ ] ⋯メニュー → 編集 / 削除

### 自分のカード(マイページ表示時)
- [ ] フッター無し(`variant="mypage"`)
- [ ] タグは sc-tags でシンプル(「セッションアンサー希望」ラベル無し)
- [ ] ⋯メニューで編集/削除
- [ ] 「いま○人が聴いています」は表示

### コピー
- [ ] 「いま○人が聴いています」(現在進行形)
- [ ] 「セッションアンサー希望」(タグ見出し)
- [ ] アンサーボタンは「アンサー」(コンパクト)

---

**最後に**: タイムラインは**サービスの第一印象**であり、ユーザーが最初に触れる画面。プロトの設計(温かいカード・控えめなアクション・音源中心・1スクリーン1〜1.5枚のゆったり感)を忠実に再現することで、初心者でも「ここなら投稿してみたい」と感じる場になります。
