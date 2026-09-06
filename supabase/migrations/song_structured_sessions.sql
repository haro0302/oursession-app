-- ============================================================
-- 曲を構造化データ化し、セッションのタイトル自由入力・複数選択タグを廃止する
-- 詳細: docs/our-session-changes.md
--
-- 冪等に書いてあるので、途中で失敗しても最初からもう一度流して問題ない。
-- ============================================================

-- 既存のセッションカードはテストデータのみの前提で、先に空にしておく
-- （song_id 等を NOT NULL にする都合上、必須）
delete from public.sessions;

-- ============================================================
-- 1. songs（楽曲マスタ。カードの曲・プロフィールの「やりたい曲」で共用）
-- ============================================================
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,                 -- is_original = true の場合は null 可
  apple_track_id bigint,       -- iTunes Search API の trackId（手動入力・オリジナル曲は null）
  is_original boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists songs_apple_track_id_idx on public.songs (apple_track_id) where apple_track_id is not null;

alter table public.songs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'songs' and policyname = 'songs: public read') then
    create policy "songs: public read" on public.songs for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'songs' and policyname = 'songs: auth insert') then
    create policy "songs: auth insert" on public.songs for insert with check (auth.uid() is not null);
  end if;
end $$;


-- ============================================================
-- 2. profile_want_songs（プロフィールの「やりたい曲」。多対多）
-- ============================================================
create table if not exists public.profile_want_songs (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, song_id)
);

alter table public.profile_want_songs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profile_want_songs' and policyname = 'profile_want_songs: public read') then
    create policy "profile_want_songs: public read" on public.profile_want_songs for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profile_want_songs' and policyname = 'profile_want_songs: owner insert') then
    create policy "profile_want_songs: owner insert" on public.profile_want_songs for insert with check (auth.uid() = profile_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profile_want_songs' and policyname = 'profile_want_songs: owner delete') then
    create policy "profile_want_songs: owner delete" on public.profile_want_songs for delete using (auth.uid() = profile_id);
  end if;
end $$;


-- ============================================================
-- 3. sessions: title(自由記述)・tags(複数選択配列) を廃止し、
--    曲(song_id)・募集パート/エリア/ジャンル(単一選択)に置き換える
-- ============================================================

-- is_practice(投稿時にプロフィールの練習中フラグを継承していた列)を
-- 投稿単位で任意に選ぶ「まだ練習中」に意味変更して再利用する
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'is_practice'
  ) then
    alter table public.sessions rename column is_practice to wip;
  end if;
end $$;

alter table public.sessions
  add column if not exists song_id uuid references public.songs(id),
  add column if not exists requested_part text,
  add column if not exists area text,
  add column if not exists genre text;

alter table public.sessions
  alter column song_id set not null,
  alter column requested_part set not null,
  alter column area set not null,
  alter column genre set not null;

alter table public.sessions
  drop column if exists title,
  drop column if exists tags;

-- ============================================================
-- 4. profiles: 「好きな曲」(生文字列配列) を廃止。「やりたい曲」は profile_want_songs に移行済み
-- ============================================================
alter table public.profiles drop column if exists favorite_tracks;
