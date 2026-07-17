# プロフィール編集ドロワー 設計仕様書

> このドキュメントは Claude Code への指示書です。
> プロト `prototypes/our-session-modern.html` を**実装の正解**とし、その挙動・配置・コピーを完全に再現すること。

---

## 0. このドロワーの位置づけ

### 種類

**Drawer (下からスライドイン、90%高さ)**

プロフィールを更新するための画面。マイページの「編集」ボタンから開く。

### 入口

- マイページの**ヘッダー右の「編集」ボタン**(ペンアイコン + テキスト)
- オンボーディング完了直後の「もう少し編集する?」プロンプトから(任意)

### サイトマップ上の位置

`sitemap.md` のカテゴリでは **Drawer (下からスライドイン、90%高さ)** に該当。同じカテゴリ:
- アンサー投稿ドロワー
- 認証ドロワー

### 役割

CLAUDE.md データモデルにある `profiles` テーブルの拡張フィールドを編集:
- nickname, area, is_practice
- instruments[], genres[], favorite_artists[], favorite_tracks[]
- bio, avatar_url, sns_links

---

## 1. 画面構造(縦の流れ)

```
┌─────────────────────────────────┐
│ (マイページが背景に半透明で見える)  │
├─────────────────────────────────┤
│        ━━━(ハンドル)              │  ← pe-handle
├─────────────────────────────────┤
│ キャンセル | プロフィール編集 | 保存│  ← pe-header (sticky)
├─────────────────────────────────┤
│ ┌──────┐                         │
│ │ 👤   │ ニックネーム             │  ← pe-avatar-block
│ │      │ [ヨシキ          ]      │     アバター左、入力右(横並び)
│ │  📷  │                         │
│ └──────┘                         │
├─────────────────────────────────┤
│ ┌─────────────────────────┐    │
│ │ 練習中  🔰 練習中          │    │  ← pe-toggle-row
│ │ マイペースに楽しみたい方... │   │     練習中フラグ
│ │                       [●─]│    │     デフォルト ON
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ 自己紹介          任意・150字以内  │  ← pe-section-label
│ ┌─────────────────────────┐    │
│ │ 楽器歴・好きな音楽・セッショ │    │
│ │ ンでやりたいことなど         │    │
│ │                    56/150  │    │
│ └─────────────────────────┘    │
├─────────────────────────────────┤
│ 好きな楽器・担当       複数選択可 │
│ [ボーカル] [ギター] [ベース]      │  ← pe-chip-grid
│ [ドラム] [キーボード] [その他]    │     タップで選択(複数可、塗りつぶし無し)
├─────────────────────────────────┤
│ 好きなジャンル         複数選択可 │
│ [ロック] [ジャズ] [フォーク] ...  │  ← pe-chip-grid (同上)
├─────────────────────────────────┤
│ 好きなアーティスト     最大10件   │
│ [Miles Davis ×] [aiko ×] [+追加] │  ← pe-tag-grid
│ ┌───────────────────────┐      │
│ │ 🔍 [アーティスト名を入力 ✕ ]│  ← 入力欄(+追加タップで開く)
│ │ Miles Davis              │      │  ← サジェスト
│ │ Mizuki Yoshida           │      │
│ └───────────────────────┘      │
├─────────────────────────────────┤
│ 好きな曲              最大10件   │
│ [Sparkle ×] [白日 ×] [+追加]    │  ← pe-tag-grid
│ ┌───────────────────────┐      │
│ │ 🔍 [曲名を入力 ✕ ]        │      │  ← 入力欄
│ └───────────────────────┘      │
├─────────────────────────────────┤
│ 活動エリア                       │
│ [▼ 東京                    ]    │  ← pe-select (47都道府県)
├─────────────────────────────────┤
│ SNS連携                  任意    │
│ [𝕏] [X (Twitter) ユーザー名 ]   │  ← pe-sns-row
│ [📷] [Instagram ユーザー名  ]    │
│ [☁️] [SoundCloud ユーザー名 ]    │
└─────────────────────────────────┘
```

---

## 2. ドロワーのアニメーション

### 2-1. CSS(プロト準拠)

```css
/* 背景 */
.pe-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 55;
}
.pe-backdrop.open {
  opacity: 1; pointer-events: auto;
}

/* ドロワー本体 */
.pe-drawer {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  max-height: 90%;
  background: rgba(20,20,26,0.97);
  backdrop-filter: blur(32px) saturate(1.4);
  -webkit-backdrop-filter: blur(32px) saturate(1.4);
  border-top: 1px solid var(--border2);
  border-radius: 24px 24px 0 0;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 56;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.pe-drawer.open {
  transform: translateY(0);
}
```

### 2-2. 実装パターン(他のドロワーと同じ)

要素は**常にDOMに置く**、`open` クラスで開閉。`AnswerDrawer` と全く同じパターン。

---

## 3. ハンドル + ヘッダー

```html
<div class="pe-handle"></div>
<div class="pe-header">
  <button class="pe-header-btn" onclick="closeProfileEdit()">キャンセル</button>
  <div class="pe-title">プロフィール編集</div>
  <button class="pe-header-btn save" onclick="saveProfileEdit()">保存</button>
</div>
```

```css
.pe-handle {
  width: 36px; height: 4px;
  border-radius: 2px;
  background: var(--text3);
  opacity: 0.4;
  margin: 8px auto 6px;
  flex-shrink: 0;
}
.pe-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 18px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.pe-header-btn {
  background: transparent; border: none;
  font-size: 14px; font-weight: 500;
  color: var(--text2);
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  padding: 6px 2px; min-width: 60px;
}
.pe-header-btn:hover { color: var(--text); }
.pe-header-btn.save {
  background: var(--red);
  color: white;
  border-radius: 16px;
  padding: 7px 18px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(232,74,95,0.4);
}
.pe-header-btn.save:hover { transform: scale(1.03); }
.pe-title {
  font-size: 15px; font-weight: 700;
  color: var(--text);
}
```

**重要**:
- 「保存」は**常に活性化**(プロフィールはMVP的にバリデーション緩め)
- 下部に「保存する」ボタンは**ない**(ヘッダーの「保存」だけ)
- 「キャンセル」で入力中なら確認ダイアログ

---

## 4. アバター + ニックネーム(`pe-avatar-block`)

### 4-1. 構造

```html
<div class="pe-avatar-block">
  <div class="pe-avatar-wrap">
    <!-- アバター本体 -->
    <div class="pe-avatar">
      {avatarUrl ? <img src={avatarUrl} /> : <UserIcon />}
    </div>
    <!-- 「変更」バッジ(右下、カメラアイコン) -->
    <div class="pe-avatar-edit" onClick={openFilePicker}>
      <CameraIcon />
    </div>
    <!-- 非表示のファイル入力 -->
    <input 
      type="file" 
      accept="image/jpeg,image/png,image/webp" 
      hidden 
      onChange={handleAvatarSelect}
    />
  </div>
  <div class="pe-name-wrap">
    <input 
      type="text" 
      class="pe-name-input" 
      placeholder="ニックネーム" 
      value={nickname}
    />
  </div>
</div>
```

### 4-2. スタイル

```css
.pe-avatar-block {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 20px;
}
.pe-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.pe-avatar {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%);
  border: 2px solid rgba(232,140,90,0.3);   /* 暖色のリング */
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.pe-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.pe-avatar-edit {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--red);
  border: 2px solid var(--bg);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(232,74,95,0.4);
}
.pe-avatar-edit:hover { transform: scale(1.08); }
.pe-name-wrap { flex: 1; min-width: 0; }
.pe-name-input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 16px; font-weight: 600;
  color: var(--text);
  outline: none;
  font-family: 'Outfit', sans-serif;
}
.pe-name-input::placeholder { color: var(--text3); }
.pe-name-input:focus { border-color: var(--red-border); }
```

### 4-3. アバター変更機能(最重要)

#### 機能仕様

1. **アバター本体 or カメラバッジをタップ** → ネイティブのファイル選択ダイアログ
2. クライアント側で**画像をリサイズ(512×512、中央クロップ)**
3. ファイル形式チェック(JPG / PNG / WebP)
4. サイズチェック(リサイズ後 5MB以下、ただし普通は超えない)
5. Supabase Storage の `avatars` バケットにアップロード
6. `profiles.avatar_url` を更新
7. 古いアバターは Storage から削除(孤児防止)
8. アップロード中はスピナー表示

#### Supabase 準備

```
バケット名: avatars
Public: Yes ← 重要(プライベートだと毎回署名URL生成が必要でリンク切れの原因に)
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

「パブリック」にしても、**書き込み権限(アップロード・削除)は RLS で制限**するので安全。読み取りだけ全員に開放する設計。

```sql
-- 読み取り: 全員(パブリックバケットの確認)
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- アップロード: 認証ユーザーが自分のフォルダのみ
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 削除: 自分のファイルのみ
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 更新: 自分のファイルのみ
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

これで:
- ✅ アバター画像は**全員見られる**(パブリック)
- ❌ 他人の画像を勝手に上書き・削除できない(RLSで保護)
- ✅ `getPublicUrl()` で取得したURLが**永続的に使える**(リンク切れしない)

#### ファイル命名規則

```
avatars/{user_id}/{uuid}.{ext}
```

#### 実装パターン

```typescript
// src/lib/avatar-upload.ts
export async function uploadAvatar(
  file: File,
  userId: string,
  oldAvatarUrl?: string | null
): Promise<{ url: string } | { error: string }> {
  // 1. 形式チェック
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'JPG、PNG、WebP の画像が使えます。' };
  }
  
  // 2. クライアント側リサイズ(512×512、中央クロップ)
  const resized = await resizeImage(file, 512);
  
  // 3. サイズチェック
  if (resized.size > 5 * 1024 * 1024) {
    return { error: '画像が大きいようです。もう少し小さいものを試してみてください。' };
  }
  
  // 4. アップロード
  const ext = file.name.split('.').pop() || 'jpg';
  const uuid = crypto.randomUUID();
  const path = `${userId}/${uuid}.${ext}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, resized);
  
  if (uploadError) {
    return { error: 'うまく送れませんでした。電波の届く場所でもう一度お試しください。' };
  }
  
  // 5. パブリックURL取得
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);
  
  // 6. 古いアバター削除(孤児防止)
  if (oldAvatarUrl) {
    const oldPath = extractPathFromAvatarUrl(oldAvatarUrl);
    if (oldPath) {
      await supabase.storage.from('avatars').remove([oldPath]);
    }
  }
  
  return { url: urlData.publicUrl };
}

// クライアント側リサイズ(512x512 中央クロップ)
async function resizeImage(file: File, targetSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      
      // 中央クロップ
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
      
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        0.9
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 5. 練習中トグル(`pe-toggle-row`)

```html
<div class="pe-toggle-row">
  <div class="pe-toggle-info">
    <div class="pe-toggle-title">
      <span>練習中</span>
      <span class="pe-beginner-badge">🔰 練習中</span>
    </div>
    <div class="pe-toggle-sub">
      マイペースに楽しみたい方向け。「下手でいい、好きでつながる」を歓迎する印です。
    </div>
  </div>
  <div 
    class={`pe-switch ${isPractice ? 'on' : ''}`}
    onClick={() => setIsPractice(!isPractice)}
  ></div>
</div>
```

```css
.pe-toggle-row {
  background: var(--card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 14px;
  margin-bottom: 20px;
  display: flex; align-items: center; gap: 12px;
}
.pe-toggle-info { flex: 1; min-width: 0; }
.pe-toggle-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: var(--text);
  margin-bottom: 3px;
}
.pe-toggle-sub {
  font-size: 11px; color: var(--text3);
  line-height: 1.5;
}
.pe-beginner-badge {
  font-size: 9px; font-weight: 700;
  background: linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%);
  color: #3a2a00;
  padding: 1px 6px;
  border-radius: 6px;
}

/* トグルスイッチ */
.pe-switch {
  width: 42px; height: 24px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pe-switch::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--text3);
  transition: left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
}
.pe-switch.on {
  background: linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%);
}
.pe-switch.on::after {
  left: 22px;
  background: white;
}
```

**重要**: 練習中フラグはCLAUDE.md §4「**必ず実装する安心装置**」のひとつ。デフォルトON。

---

## 6. 自己紹介(`pe-textarea-wrap`)

```html
<div class="pe-section-label">
  <span>自己紹介</span>
  <span class="pe-section-hint">任意・150字以内</span>
</div>
<div class="pe-textarea-wrap">
  <textarea 
    class="pe-textarea"
    maxlength={300}
    placeholder="楽器歴・好きな音楽・セッションでやりたいことなど"
    value={bio}
    onChange={...}
  />
  <div class="pe-counter">{bio.length} / 150</div>
</div>
```

```css
.pe-section-label {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px; font-weight: 700; color: var(--text2);
  padding: 0 4px;
}
.pe-section-hint {
  font-size: 9px; color: var(--text3);
  font-weight: 500;
  letter-spacing: 0.3px;
}
.pe-textarea-wrap {
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px 24px;
  margin-bottom: 20px;
  transition: border-color 0.18s;
}
.pe-textarea-wrap:focus-within {
  border-color: var(--red-border);
}
.pe-textarea {
  width: 100%;
  background: transparent;
  border: none; outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text);
  min-height: 80px;
  resize: none;
}
.pe-textarea::placeholder { color: var(--text3); }
.pe-counter {
  position: absolute;
  bottom: 6px; right: 12px;
  font-size: 10px;
  color: var(--text3);
}
.pe-counter.over { color: var(--red); }
```

---

## 7. 楽器・ジャンル(`pe-chip-grid`)

### 7-1. 重要: フィルタシート方式を採用

ユーザー選択により、**投稿ページと同じフィルタシート方式**を採用する:

- 「+追加」ボタン → 下からフィルタシート → 複数選択 → 決定
- 既に選択済みのものは選択チップとして表示
- 各チップに×ボタンで個別削除

これにより、UIパターンが**投稿ページ・タイムラインフィルタ・プロフィール編集**で統一される。

### 7-2. 構造

```html
<div class="pe-section-label">
  <span>好きな楽器・担当</span>
  <span class="pe-section-hint">複数選択可</span>
</div>
<div class="pe-tag-grid" id="peInstruments">
  <!-- 選択済みチップ -->
  <div class="pe-tag-pill">
    ボーカル
    <div class="pe-tag-pill-x" onClick={() => removeInstrument('ボーカル')}>×</div>
  </div>
  <div class="pe-tag-pill">
    ギター
    <div class="pe-tag-pill-x" onClick={() => removeInstrument('ギター')}>×</div>
  </div>
  
  <!-- 「+追加」ボタン -->
  <div class="pe-tag-add" onClick={() => openFilterSheet('instrument', 'profile-edit')}>
    <PlusIcon size={11} /> 追加
  </div>
</div>
```

### 7-3. スタイル

```css
.pe-tag-grid {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-bottom: 20px;
}
.pe-tag-pill {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  border-radius: 14px;
  padding: 4px 6px 4px 11px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--red2);
  font-family: 'Outfit', sans-serif;
}
.pe-tag-pill-x {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: rgba(232,74,95,0.10);
  cursor: pointer;
  transition: background 0.15s;
}
.pe-tag-pill-x:hover { background: rgba(232,74,95,0.22); }

.pe-tag-add {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--card2);
  border: 1px dashed var(--border2);
  border-radius: 14px;
  padding: 4px 11px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  transition: all 0.18s;
  font-family: 'Outfit', sans-serif;
}
.pe-tag-add:hover {
  border-color: var(--red-border);
  background: var(--card-hl);
  color: var(--text);
}
```

### 7-4. フィルタシートとの連携

`filter-sheet-spec.md` の `openFilterSheet()` 関数を呼び出す。第2引数で「呼び出し元」を識別:

```typescript
type FilterContext = 'timeline' | 'post' | 'profile-edit';

function openFilterSheet(
  category: 'instrument' | 'genre' | 'area',
  context: FilterContext = 'timeline'
) {
  // context によって「決定」した時の保存先が変わる
}
```

決定時:
- `context === 'timeline'`: タイムラインのフィルタを更新
- `context === 'post'`: 投稿フォームのタグを更新
- `context === 'profile-edit'`: プロフィールの楽器/ジャンルを更新

---

## 8. 好きなアーティスト・好きな曲(`pe-tag-grid` + サジェスト)

### 8-1. 選択した最終形

「+追加」で個別タグ追加方式(ユーザー選択)。テキスト入力 → エンターで追加 → タグとして表示。

### 8-2. 構造

```html
<div class="pe-section-label">
  <span>好きなアーティスト</span>
  <span class="pe-section-hint">最大10件</span>
</div>
<!-- 選択済みタグ + 「+追加」 -->
<div class="pe-tag-grid">
  {artists.map(artist => (
    <div class="pe-tag-pill">
      {artist}
      <div class="pe-tag-pill-x" onClick={() => removeArtist(artist)}>×</div>
    </div>
  ))}
  <div class="pe-tag-add" onClick={() => openArtistInput()}>
    <PlusIcon /> 追加
  </div>
</div>

<!-- 入力欄(「+追加」タップで表示) -->
{artistInputOpen && (
  <div class="pe-suggest-wrap">
    <div class="pe-suggest-input-wrap">
      <SearchIcon />
      <input 
        class="pe-suggest-input" 
        placeholder="アーティスト名を入力"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') addArtist(e.target.value);
        }}
      />
      <div class="pe-suggest-close" onClick={closeArtistInput}>×</div>
    </div>
  </div>
)}
```

### 8-3. スタイル

```css
.pe-suggest-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  margin-top: 6px;
  margin-bottom: 20px;
  overflow: hidden;
}
.pe-suggest-input-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
}
.pe-suggest-input {
  flex: 1;
  background: transparent;
  border: none; outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: 13.5px;
  color: var(--text);
}
.pe-suggest-input::placeholder { color: var(--text3); }
.pe-suggest-close {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--card2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.pe-suggest-close:hover { background: var(--card-hl); }
```

### 8-4. 挙動

1. 「+追加」タップ → 入力欄が表示される、フォーカス自動移動
2. テキスト入力
3. **Enterキー or 入力欄外タップ** → タグとして追加
4. 既に同じものがあれば追加しない
5. 最大10件まで(超えたら「+追加」を非活性化)
6. ×タップで個別削除

### 8-5. データバリデーション

- 各タグ最大30文字
- 全角・半角・英字・記号OK
- 連続スペース・前後の空白はトリム
- 空文字は追加しない

---

## 9. 活動エリア(`pe-select-wrap`)

### 9-1. 構造

```html
<div class="pe-section-label">
  <span>活動エリア</span>
</div>
<div class="pe-select-wrap">
  <select class="pe-select" value={area} onChange={setArea}>
    {PREFECTURES.map(pref => (
      <option key={pref} value={pref}>{pref}</option>
    ))}
    <option value="その他">その他</option>
  </select>
</div>
```

### 9-2. 重要: 47都道府県すべて

`src/lib/constants/prefectures.ts` から PREFECTURES 定数をインポート。47都道府県全てを選択肢に。

(現在の実装は12県しか無いので、これを修正する必要あり)

### 9-3. スタイル

```css
.pe-select-wrap {
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  margin-bottom: 20px;
  padding: 0 14px;
}
.pe-select {
  width: 100%;
  background: transparent;
  border: none; outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: var(--text);
  padding: 12px 28px 12px 0;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}
.pe-select-wrap::after {
  content: '▼';
  position: absolute;
  right: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--text3);
  pointer-events: none;
}
```

---

## 10. SNS連携(`pe-sns-row`)

### 10-1. 構造

```html
<div class="pe-section-label">
  <span>SNS連携</span>
  <span class="pe-section-hint">任意</span>
</div>
<div class="pe-sns-row">
  <div class="pe-sns-icon">
    <XIcon />
  </div>
  <input 
    class="pe-sns-input" 
    placeholder="X (Twitter) ユーザー名"
    value={snsX}
  />
</div>
<div class="pe-sns-row">
  <div class="pe-sns-icon">
    <InstagramIcon />
  </div>
  <input 
    class="pe-sns-input" 
    placeholder="Instagram ユーザー名"
    value={snsInstagram}
  />
</div>
<div class="pe-sns-row">
  <div class="pe-sns-icon">
    <SoundCloudIcon />
  </div>
  <input 
    class="pe-sns-input" 
    placeholder="SoundCloud ユーザー名"
    value={snsSoundCloud}
  />
</div>
```

### 10-2. スタイル

```css
.pe-sns-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 16px;             /* ゆったりした余白 */
  margin-bottom: 8px;
  transition: border-color 0.18s;
}
.pe-sns-row:focus-within {
  border-color: var(--red-border);
}
.pe-sns-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pe-sns-icon svg {
  width: 18px; height: 18px;       /* アイコンを大きく */
  color: var(--text2);
  stroke: var(--text2);
}
.pe-sns-input {
  flex: 1;
  background: transparent;
  border: none; outline: none;
  padding: 4px 0;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;                 /* プレースホルダーも見える大きさ */
  color: var(--text);
}
.pe-sns-input::placeholder { 
  color: var(--text3);
  font-size: 13px;
}
```

**重要なポイント**:
- アイコンは **18×18px** で大きめに、円形背景は無し
- 入力欄の padding は **13〜16px** でゆったり
- placeholder は「○○ ユーザー名」で統一(URLではない)
- Instagram のアイコンは Feather Icons の `instagram`(camera ではない)

### 10-3. 保存形式

`profiles.sns_links` には JSON で保存:

```typescript
sns_links: {
  x?: string;
  instagram?: string;
  soundcloud?: string;
}
```

ユーザー名のみを保存(URLは表示時に組み立てる):
- X: `https://x.com/{username}`
- Instagram: `https://instagram.com/{username}`
- SoundCloud: `https://soundcloud.com/{username}`

---

## 11. 保存・キャンセル

### 11-1. 「保存」ボタン

ヘッダー右の「保存」タップ:

```typescript
async function saveProfileEdit() {
  // バリデーション(最小限)
  if (!nickname.trim()) {
    showToast('ニックネームを入力してください');
    return;
  }
  
  // Supabase profiles 更新
  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: nickname.trim(),
      is_practice: isPractice,
      bio: bio.trim() || null,
      instruments: instruments,
      genres: genres,
      favorite_artists: artists,
      favorite_tracks: tracks,
      area: area,
      sns_links: { x: snsX, instagram: snsInstagram, soundcloud: snsSoundCloud },
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (error) {
    showToast('うまく送れませんでした。もう一度お試しください。');
    return;
  }
  
  // 閉じる + トースト
  closeProfileEdit();
  showToast('プロフィールを更新しました');
}
```

### 11-2. 「キャンセル」ボタン

入力中(初期値から変更があれば)なら確認:

```typescript
function closeProfileEdit() {
  const isDirty = checkIfDirty();
  if (isDirty) {
    if (!confirm('変更を破棄しますか?')) return;
  }
  
  // ドロワーを閉じる
  setDrawerOpen(false);
}
```

---

## 12. 受け入れチェックリスト

実装後、以下をすべて満たすか確認:

### 構造
- [ ] ドロワー(下からスライド、高さ90%程度)
- [ ] 上部にハンドル(横線)
- [ ] 背景に半透明レイヤー + blur

### ヘッダー
- [ ] 「キャンセル | プロフィール編集 | 保存」の3要素
- [ ] 「保存」は赤背景 + 影、常に活性
- [ ] 下部に「保存する」ボタンが**ない**

### アバター
- [ ] ドロワー上部に**大きなアバター + ニックネーム入力**が横並び
- [ ] アバター右下にカメラアイコンの「変更」バッジ
- [ ] アバターまたはバッジタップでファイル選択
- [ ] 選んだ画像がクライアント側で512×512にリサイズ
- [ ] Supabase Storage に保存され、すぐ反映される
- [ ] 古いアバターは Storage から削除される

### 練習中トグル
- [ ] カード形式で表示(背景半透明)
- [ ] 「練習中」テキスト + 🔰練習中バッジ
- [ ] サブテキスト「マイペースに楽しみたい方向け…」
- [ ] トグルが ON 時に**黄→オレンジのグラデ**

### 自己紹介
- [ ] 「任意・150字以内」サブテキスト
- [ ] placeholder「楽器歴・好きな音楽・セッションでやりたいことなど」
- [ ] 右下に文字数カウンタ

### 楽器・ジャンル
- [ ] **「+追加」でフィルタシート**が下から開く
- [ ] 選択済みは赤いピル + ×ボタン
- [ ] サブテキスト「複数選択可」

### アーティスト・曲
- [ ] **「+追加」でテキスト入力欄**が表示
- [ ] Enter で追加、最大10件
- [ ] サブテキスト「最大10件」

### エリア
- [ ] **47都道府県** + 「その他」がセレクトに含まれる

### SNS
- [ ] X / Instagram / SoundCloud の3つの入力欄
- [ ] 各アイコン + ユーザー名入力

### 保存・キャンセル
- [ ] 保存タップで Supabase profiles 更新 + トースト
- [ ] キャンセル時、変更ありなら確認ダイアログ

### 整合性
- [ ] **インラインスタイルを使わない**(CLAUDE.md §5)
- [ ] CSS変数経由でデザイントークンを参照
- [ ] 投稿ページのフィルタシート、タグUIと**コンポーネントを共有**

---

## 13. プロト参照箇所

| セクション | 行番号(目安) |
|---|---|
| プロフィール編集ドロワーHTML | 約 4952〜5110 |
| プロフィール編集CSS | 約 2034〜2280 |
| アバターブロックCSS | 約 2093〜2150 |
| タグ・サジェストCSS | 約 2241〜2300 |
| トグルCSS | 検索 |

---

**最後に**: プロフィール編集は「**自分を表現する場**」。CLAUDE.md「自分の音楽の好み・楽器・エリアを伝えることで、合う仲間が見つかる」を実現する装置。楽器・ジャンルの選択UIを投稿ページと統一することで、ユーザーが「タグ選択 = フィルタシート」というメンタルモデルを1つ持てるようになります。
