-- ourSESSION: sessions テーブル
-- Supabase Dashboard → SQL Editor で実行してください。

-- テーブル作成
create table if not exists public.sessions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  title text,
  user_name text,
  message text,
  seeking_instrument text,
  audio_url text,
  area text,                -- エリア（例: 大阪府、東京都、オンライン可）
  genre text,               -- ジャンル（例: Rock, Folk, J-Pop）
  status text default 'open' -- open / reviewing / session_set
);

-- RLS 有効化
alter table public.sessions enable row level security;

-- 全員が閲覧可能
create policy "Allow public read on sessions"
  on public.sessions for select
  using (true);

-- 全員が投稿可能（のちに認証で制限可）
create policy "Allow public insert on sessions"
  on public.sessions for insert
  with check (true);

-- サンプルデータ（任意・テスト用）
insert into public.sessions (title, user_name, message, seeking_instrument, audio_url, area, genre, status)
values
  (
    '山下達郎「Sparkle」カバー',
    'REINA',
    'アコギで弾き語りしています。一緒にセッションしませんか？',
    'Vo.',
    null,
    '大阪府',
    'Folk',
    'reviewing'
  ),
  (
    'レゲエが好きなドラマーの方いませんか？',
    'FUMIFUMI',
    'フリーのフェッダーを弾けるようになりました。リズムに合わせて練習したいです。',
    'Dr.',
    null,
    '東京都',
    'Rock',
    'open'
  ),
  (
    '一緒にウクレレ・セッション',
    'やまちゃん',
    'ウクレレ始めて1年。一緒に楽しく演奏できる方を探しています！',
    'すべて歓迎',
    null,
    '神戸市',
    'Folk',
    'session_set'
  );
