# オンボーディング 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このページの位置づけ

### 種類

**全画面オーバーレイ(Screen 級)** — `ob-screen`

### 重要: いつ表示するか

**メール認証 or Google ログインで新規登録完了した直後の1回だけ**

- ❌ ログインしただけ(既存ユーザー)は表示しない
- ❌ 既にオンボード完了済みのユーザーは二度と表示しない
- ✅ アカウント作成直後で `profiles.onboarded_at` が null のユーザーのみ表示

### サイトマップ上の位置

`sitemap.md` のカテゴリでは **オンボーディング (登録直後のみ)** に該当。

### 入口

```
[新規登録ボタン] → [認証ドロワー] → [Supabase Auth でアカウント作成]
   → onboarded_at が null かチェック
      → null なら → このオンボーディング画面へリダイレクト
      → null じゃない なら → タイムラインへ
```

### 出口

すべてのステップ完了 → タイムライン画面へ遷移

途中で離脱可能?  
→ **不可**(必須情報を集めきるまで他画面に移動できない)。ただし「あとで設定」のスキップ動線は **任意項目** のみ提供。

### 役割

CLAUDE.md データモデルにある `profiles` の最小限を集める:
- nickname(必須)
- instruments[] + is_practice(必須)
- area(必須)
- avatar_url、bio、genres[]、favorite_artists[]、SNS は**後でプロフィール編集で設定**(オンボードでは省略)

これは CLAUDE.md「**最小ウィザード + 後から育てる**」設計の実装です。

---

## 1. 全体構造(4ステップ)

```
[Step 1] ニックネーム
   ↓
[Step 2] 楽器 + 練習中フラグ
   ↓
[Step 3] エリア(47都道府県)
   ↓
[Step 4] Welcome(サービス紹介の再確認)
   ↓
タイムラインへ
```

### 各ステップの最上部に進行バー

```
●●●○  ← 3つ進んだ中で、4個目はwelcome
```

3つのドット = 入力3ステップ。Welcome は4つ目のステップだが、進行バーは「完了」を意味する状態。

### 各ステップの最下部に「次へ」ボタン

- 必須項目が満たされていないと**非活性**(グレー)
- 満たされたら**赤くなる**(`.ready` クラス)
- Step 4(Welcome)では「**はじめる**」に変わる

---

## 2. レイアウトと挙動

### 2-1. オーバーレイ構造

```html
<div class="ob-screen" id="obScreen">
  <!-- 暖色オーロラ背景(他画面と同じ) -->
  <div class="aurora">
    <span class="blob1"></span>
    <span class="blob2"></span>
  </div>
  
  <!-- 戻るボタン(左上) -->
  <button class="ob-back" id="obBack" onClick={obPrev}>
    <ChevronLeftIcon />
  </button>
  
  <!-- 進行バー(上部中央) -->
  <div class="ob-progress">
    <div class="ob-progress-dot active" data-step="1"></div>
    <div class="ob-progress-dot" data-step="2"></div>
    <div class="ob-progress-dot" data-step="3"></div>
  </div>
  
  <!-- 各ステップ(active なやつだけ表示) -->
  <div class="ob-step active" data-step="1">...</div>
  <div class="ob-step" data-step="2">...</div>
  <div class="ob-step" data-step="3">...</div>
  <div class="ob-step" data-step="4">...</div>  <!-- Welcome -->
  
  <!-- フッター(次へボタン) -->
  <div class="ob-footer">
    <button class="ob-next" id="obNextBtn" onClick={obNext}>
      <span id="obNextLabel">次へ</span>
      <ArrowRightIcon />
    </button>
  </div>
</div>
```

### 2-2. オーバーレイ全体のスタイル

```css
.ob-screen {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 80;                  /* sitemap.md の z-index 階層に従う */
  display: none;
  flex-direction: column;
  padding: 60px 24px 30px;
  overflow: hidden;
}
.ob-screen.open {
  display: flex;
}
```

z-index 80 = ドロワー(85)より下、オーバーレイ(70)より上。**新規登録直後の唯一の画面**として、他のすべてを覆い隠す。

### 2-3. 戻るボタン

```css
.ob-back {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.18s;
}
.ob-back:hover { background: var(--card-hl); }
.ob-back[disabled] {
  opacity: 0;
  pointer-events: none;          /* Step 1 と Welcome では戻れない */
}
```

**動作ルール**:
- Step 1: 戻るボタン非表示(`disabled`)
- Step 2, 3: 前のステップに戻れる
- Step 4(Welcome): 戻るボタン非表示(完了したので戻る意味なし)

### 2-4. 進行バー(`ob-progress`)

```css
.ob-progress {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-bottom: 36px;
  flex-shrink: 0;
}
.ob-progress-dot {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background: var(--card2);
  transition: background 0.3s ease;
}
.ob-progress-dot.active {
  background: var(--red);
}
.ob-progress-dot.completed {
  background: var(--red2);
}
```

**状態管理**:
- 3つのドット(Step 1, 2, 3 に対応)
- 現在のステップは `active`(赤)
- 完了したステップは `completed`(赤2)
- Welcome(Step 4)では3つとも `completed`

---

## 3. 各ステップの仕様

### 3-1. 共通レイアウト

```html
<div class="ob-step" data-step="N">
  <div class="ob-step-icon">
    <FeatherIcon />
  </div>
  <div class="ob-step-title">
    タイトル<br>(2行に分けて視覚的に大きく)
  </div>
  <div class="ob-step-sub">
    サブテキスト<br>(温かい補足)
  </div>
  <!-- 入力UI(ステップごとに違う) -->
</div>
```

```css
.ob-step {
  display: none;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}
.ob-step.active { display: flex; }
.ob-step::-webkit-scrollbar { display: none; }

.ob-step-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 24px;
  flex-shrink: 0;
}
.ob-step-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.35;
  text-align: center;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  font-family: 'Outfit', sans-serif;
}
.ob-step-sub {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.6;
  text-align: center;
  margin-bottom: 32px;
  font-weight: 400;
}
```

---

### 3-2. Step 1: ニックネーム

#### 内容

```html
<div class="ob-step active" data-step="1">
  <div class="ob-step-icon">
    <i data-feather="smile" style="width:24px;height:24px;stroke:var(--red2);"></i>
  </div>
  <div class="ob-step-title">
    あなたを<br>何て呼べばいい?
  </div>
  <div class="ob-step-sub">
    本名でなくて大丈夫。<br>後からいつでも変えられます。
  </div>
  <div class="ob-input-wrap">
    <input 
      type="text" 
      class="ob-input" 
      id="obNickname"
      placeholder="ニックネーム"
      maxlength="20"
      value={nickname}
      onChange={(e) => setNickname(e.target.value)}
    />
  </div>
</div>
```

#### スタイル

```css
.ob-input-wrap {
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0 16px;
  margin: 0 auto 24px;
  max-width: 320px;
  width: 100%;
  transition: border-color 0.18s;
}
.ob-input-wrap:focus-within {
  border-color: var(--red-border);
}
.ob-input {
  width: 100%;
  background: transparent;
  border: none; outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  color: var(--text);
  padding: 14px 0;
  text-align: center;
}
.ob-input::placeholder { color: var(--text3); }
```

#### バリデーション

- **必須**(空白のみは不可)
- 最大20文字
- 入力済みで「次へ」が活性化

---

### 3-3. Step 2: 楽器 + 練習中フラグ

#### 内容

```html
<div class="ob-step" data-step="2">
  <div class="ob-step-icon">
    <i data-feather="music" style="width:24px;height:24px;stroke:var(--red2);"></i>
  </div>
  <div class="ob-step-title">
    どんな楽器を<br>やってる?
  </div>
  <div class="ob-step-sub">
    複数選んでOK。<br>後から追加・変更もできます。
  </div>
  
  <!-- 楽器チップグリッド -->
  <div class="ob-chip-grid" id="obInstruments">
    {INSTRUMENTS.map(inst => (
      <div 
        className={`ob-chip ${instruments.includes(inst) ? 'selected' : ''}`}
        onClick={() => toggleInstrument(inst)}
      >
        {inst}
      </div>
    ))}
  </div>
  
  <!-- 練習中トグル -->
  <div class="ob-toggle-row">
    <div class="ob-toggle-body">
      <div class="ob-toggle-title">
        <span>練習中</span>
        <span class="beginner-badge-mini">🔰 練習中</span>
      </div>
      <div class="ob-toggle-sub">
        マイペースに楽しみたい方向け。<br>「下手でいい、好きでつながる」を歓迎する印です。
      </div>
    </div>
    <div 
      className={`pe-switch ${isPractice ? 'on' : ''}`}
      onClick={() => setIsPractice(!isPractice)}
    ></div>
  </div>
</div>
```

#### 楽器の選択肢

```typescript
const INSTRUMENTS = [
  'ボーカル', 'ギター', 'ベース', 'ドラム', '鍵盤', 'ウクレレ',
  'サックス', 'トランペット', 'バイオリン', '管楽器', '弦楽器', 'その他'
];
```

(`prefectures.ts` と同じく、`src/lib/constants/instruments.ts` などに切り出して全画面で共有する)

#### スタイル

```css
.ob-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 24px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}
.ob-chip {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 9px 18px;
  font-size: 13px;
  color: var(--text2);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Outfit', sans-serif;
}
.ob-chip:hover { border-color: var(--border2); }
.ob-chip.selected {
  background: var(--red-bg);
  border-color: var(--red-border);
  color: var(--red2);
  font-weight: 600;
}

/* 練習中トグル */
.ob-toggle-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 14px;
  margin: 12px auto 0;
  max-width: 360px;
}
.ob-toggle-body { flex: 1; min-width: 0; }
.ob-toggle-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: var(--text);
  margin-bottom: 3px;
}
.ob-toggle-sub {
  font-size: 11px;
  color: var(--text3);
  line-height: 1.5;
}
```

**注意**: 練習中トグルは**プロフィール編集ドロワーと同じ `.pe-switch` クラス**を使う(コンポーネント共有)。

#### バリデーション

- 楽器は**最低1つ**選択必須
- 練習中はトグル(デフォルト ON、変更可能、必須ではない)

---

### 3-4. Step 3: エリア

#### 内容

```html
<div class="ob-step" data-step="3">
  <div class="ob-step-icon">
    <i data-feather="map-pin" style="width:24px;height:24px;stroke:var(--red2);"></i>
  </div>
  <div class="ob-step-title">
    どのエリアで<br>セッションする?
  </div>
  <div class="ob-step-sub">
    近くの仲間が見つかりやすくなります。<br>後から変えられます。
  </div>
  
  <!-- 47都道府県のグリッド -->
  <div class="ob-area-grid" id="obAreas">
    {PREFECTURES.map(pref => (
      <div 
        className={`ob-area-chip ${area === pref ? 'selected' : ''}`}
        onClick={() => setArea(pref)}
      >
        {pref}
      </div>
    ))}
  </div>
</div>
```

#### スタイル

```css
.ob-area-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-width: 360px;
  margin: 0 auto;
}
.ob-area-chip {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 4px;
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  font-family: 'Outfit', sans-serif;
}
.ob-area-chip:hover { border-color: var(--border2); }
.ob-area-chip.selected {
  background: var(--red-bg);
  border-color: var(--red);
  color: var(--red2);
  font-weight: 700;
}
```

#### バリデーション

- 都道府県を**1つだけ**選択必須(`area` は単一値)
- `src/lib/constants/prefectures.ts` から PREFECTURES 定数を import(47都道府県)

---

### 3-5. Step 4: Welcome(サービス紹介の再確認)

#### 重要: ここがヨシキさんの追加要望

メール認証直後の最後のステップで、サービスの本質を**短くおさらい**する。LP で読んだ内容を改めて確認できる場所。

#### 内容

```html
<div class="ob-step" data-step="4">
  <div class="ob-welcome">
    <div class="ob-welcome-icon">🎵</div>
    <div class="ob-welcome-title">
      ようこそ、<br>
      <span id="obWelcomeName">あなた</span>さん
    </div>
    <div class="ob-welcome-sub">
      OurSessionは音源で繋がる場所。<br>
      <b>スタジオで一緒に演奏する仲間</b>を見つけよう。
    </div>
    
    <!-- フロー説明(イラスト or 図解) -->
    <div class="ob-flow">
      <div class="ob-flow-step">
        <div class="ob-flow-icon">📤</div>
        <div class="ob-flow-text">
          <b>セッションカード</b>を投稿
        </div>
      </div>
      <div class="ob-flow-arrow">↓</div>
      <div class="ob-flow-step">
        <div class="ob-flow-icon">🎵</div>
        <div class="ob-flow-text">
          共感した人から<br><b>アンサー</b>が届く
        </div>
      </div>
      <div class="ob-flow-arrow">↓</div>
      <div class="ob-flow-step">
        <div class="ob-flow-icon">💬</div>
        <div class="ob-flow-text">
          承認したら<br><b>メッセージで繋がる</b>
        </div>
      </div>
      <div class="ob-flow-arrow">↓</div>
      <div class="ob-flow-step">
        <div class="ob-flow-icon">🎸</div>
        <div class="ob-flow-text">
          <b>スタジオで会って</b>演奏する
        </div>
      </div>
    </div>
    
    <div class="ob-welcome-final">
      まずは気になる人の音源を聴いてみよう🎵
    </div>
  </div>
</div>
```

#### スタイル

```css
.ob-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 16px;
  max-width: 360px;
  margin: 0 auto;
}
.ob-welcome-icon {
  font-size: 56px;
  margin-bottom: 20px;
  animation: welcomePulse 2.5s ease-in-out infinite;
}
@keyframes welcomePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.ob-welcome-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.35;
  margin-bottom: 14px;
  font-family: 'Outfit', sans-serif;
}
.ob-welcome-sub {
  font-size: 13.5px;
  color: var(--text2);
  line-height: 1.65;
  margin-bottom: 28px;
}
.ob-welcome-sub b {
  color: var(--text);
  font-weight: 700;
}

/* フロー説明 */
.ob-flow {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
  width: 100%;
}
.ob-flow-step {
  display: flex; align-items: center; gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 16px;
  text-align: left;
}
.ob-flow-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.ob-flow-text {
  font-size: 12.5px;
  color: var(--text2);
  line-height: 1.5;
  flex: 1;
}
.ob-flow-text b {
  color: var(--text);
  font-weight: 700;
}
.ob-flow-arrow {
  font-size: 16px;
  color: var(--text3);
  text-align: center;
  line-height: 1;
}

.ob-welcome-final {
  font-size: 13px;
  color: var(--red2);
  font-weight: 600;
  margin-top: 12px;
}
```

#### 動作

- Step 3 で「次へ」 → Step 4(Welcome)に遷移
- 進行バーは3つとも `completed`(赤2)
- 戻るボタンは**非表示**(完了したので戻る意味なし)
- 「**はじめる**」ボタンタップ → Supabase に保存 → タイムラインへ

---

## 4. ナビゲーションロジック

### 4-1. 状態管理

```typescript
const [currentStep, setCurrentStep] = useState(1);
const [nickname, setNickname] = useState('');
const [instruments, setInstruments] = useState<string[]>([]);
const [isPractice, setIsPractice] = useState(true);  // ★デフォルトON
const [area, setArea] = useState<string | null>(null);
```

### 4-2. 次へボタンの活性条件

```typescript
function isStepValid(step: number): boolean {
  switch (step) {
    case 1: return nickname.trim().length > 0;
    case 2: return instruments.length > 0;
    case 3: return area !== null;
    case 4: return true;  // Welcome は常に活性
    default: return false;
  }
}

// ボタンの表示
function getNextLabel(step: number): string {
  return step === 4 ? 'はじめる' : '次へ';
}
```

### 4-3. 次へボタンのスタイル

```css
.ob-footer {
  flex-shrink: 0;
  padding-top: 20px;
}
.ob-next {
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--card2);
  color: var(--text3);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  cursor: not-allowed;
  margin: 0 auto;
  transition: all 0.2s;
}
.ob-next.ready {
  background: var(--red);
  color: white;
  border-color: var(--red);
  box-shadow: 0 4px 16px rgba(232,74,95,0.4);
  cursor: pointer;
}
.ob-next.ready:hover { transform: scale(1.02); }
```

### 4-4. 遷移ロジック

```typescript
function obNext() {
  if (!isStepValid(currentStep)) return;
  
  if (currentStep === 4) {
    // Welcome → 保存してタイムラインへ
    saveAndComplete();
    return;
  }
  
  // 次のステップへ
  setCurrentStep(currentStep + 1);
  
  // Welcome ステップに到達したら、ニックネームを反映
  if (currentStep + 1 === 4) {
    document.getElementById('obWelcomeName').textContent = nickname;
  }
}

function obPrev() {
  if (currentStep === 1 || currentStep === 4) return;  // 戻れない
  setCurrentStep(currentStep - 1);
}
```

### 4-5. 保存処理

```typescript
async function saveAndComplete() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    showToast('ログイン情報が見つかりません');
    return;
  }
  
  // profiles を更新
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      nickname: nickname.trim(),
      instruments: instruments,
      is_practice: isPractice,
      area: area,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (error) {
    showToast('保存に失敗しました。もう一度お試しください。');
    console.error(error);
    return;
  }
  
  // profileStore を更新
  useProfileStore.getState().refetch();
  
  // タイムラインへ遷移
  router.push('/timeline');
  
  // 任意: 完了トースト
  showToast(`はじめまして、${nickname}さん🎵 / 気になる人の音源を聴いてみよう`);
}
```

---

## 5. DB スキーマの確認

### 5-1. profiles テーブルに追加が必要なカラム

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
```

このカラムが null の場合のみ、ログイン後にオンボーディング画面を表示する。

### 5-2. オンボーディング表示の判定

```typescript
// アプリ起動時 or ログイン直後
async function checkOnboarding() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .single();
  
  if (!profile?.onboarded_at) {
    // オンボード未完了 → オンボーディング画面へ
    router.push('/onboarding');
  }
}
```

---

## 6. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### 表示条件
- [ ] メール認証 or Google ログインで新規登録した直後のみ表示
- [ ] 既存ユーザーのログイン時は表示されない
- [ ] オンボード完了済み(`onboarded_at` が null じゃない)ユーザーには表示されない

### 全体構造
- [ ] 4ステップ構成(ニックネーム / 楽器 / エリア / Welcome)
- [ ] 上部に進行バー(3つのドット、現在地は赤)
- [ ] 左上に戻るボタン(Step 1 と 4 では非表示)
- [ ] 下部に「次へ」(Welcome では「はじめる」)
- [ ] 必須項目を満たすと「次へ」が活性化(赤)
- [ ] 全画面オーバーレイ(z-index 80、背景にオーロラ)

### Step 1: ニックネーム
- [ ] アイコン「smile」(笑顔)
- [ ] タイトル「あなたを何て呼べばいい?」
- [ ] サブ「本名でなくて大丈夫。後からいつでも変えられます。」
- [ ] 入力欄(中央寄せ、最大20文字)
- [ ] 入力済みで「次へ」活性化

### Step 2: 楽器 + 練習中
- [ ] アイコン「music」
- [ ] タイトル「どんな楽器をやってる?」
- [ ] サブ「複数選んでOK。後から追加・変更もできます。」
- [ ] 楽器チップグリッド(複数選択可)
- [ ] 練習中トグル(デフォルト ON)
- [ ] 練習中バッジが**黄→オレンジのグラデ**で表示
- [ ] 最低1つ選択で「次へ」活性化

### Step 3: エリア
- [ ] アイコン「map-pin」
- [ ] タイトル「どのエリアでセッションする?」
- [ ] サブ「近くの仲間が見つかりやすくなります。後から変えられます。」
- [ ] 47都道府県のグリッド(4列、単一選択)
- [ ] 選択で「次へ」活性化

### Step 4: Welcome
- [ ] 🎵 アイコン(2.5秒周期の脈動アニメ)
- [ ] タイトル「ようこそ、○○さん」(ニックネーム挿入)
- [ ] サービス紹介(OurSessionは音源で繋がる場所)
- [ ] 4ステップのフロー説明(投稿 → アンサー → メッセージ → スタジオ)
- [ ] 「まずは気になる人の音源を聴いてみよう🎵」
- [ ] ボタンが「はじめる」に変わる
- [ ] 戻るボタンは非表示
- [ ] 進行バーは3つとも `completed`

### 保存と遷移
- [ ] 「はじめる」タップで profiles を更新
- [ ] `onboarded_at` がタイムスタンプで保存される
- [ ] profileStore も更新される
- [ ] タイムラインへ遷移
- [ ] 完了トースト「はじめまして、○○さん🎵 / 気になる人の音源を聴いてみよう」

### 一度完了したら二度と出ない
- [ ] 完了後、再度ログインしてもオンボーディングが表示されない
- [ ] 別のブラウザでログインしても表示されない

---

## 7. プロト参照箇所

| セクション | 行番号(目安) |
|---|---|
| オンボードHTML | 約 4372〜4442 |
| オンボードCSS | 約 748〜935 |
| 楽器・都道府県のデータ | プロト内 `INSTRUMENTS` / `AREAS` 配列 |

---

## 8. 関連するタスク(後ほど)

このオンボーディング完成後、関連して進めたいタスク:

### LP との連携(Phase 3)

ヨシキさんが構想中の LP では、本オンボーディングと**サービス紹介の内容が一部重複**する。

LP の役割:
- 未会員に「OurSession とは何か」を伝える
- イラスト・動画・詳細な説明
- 会員登録 CTA

オンボーディング Welcome の役割:
- 会員登録直後の人に「もう一度確認」させる
- 短く、ダイジェスト的に
- 「これから何ができるか」のフロー説明

両者で**コピーのトーンと内容を統一**する必要がある(LP 制作時に確認)。

### 任意項目の後追い設定促進

オンボード完了後、プロフィール編集ドロワーで:
- アバター
- 自己紹介
- ジャンル
- 好きなアーティスト・曲
- SNS

を設定してもらう。これらは MVP の途中で「**まだ設定してないですよ**」というプロンプトを出す案もあり(将来検討)。

---

**最後に**: オンボーディングは「**初心者が最初に触れる画面**」。CLAUDE.md 第0条1「**初心者が怖い・恥ずかしい・面倒を感じない**」を最も体現すべき場所。プロト通りに作ることで、温かい「ようこそ」体験が実現します。
