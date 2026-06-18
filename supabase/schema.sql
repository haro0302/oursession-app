-- ============================================================
-- our SESSION: 完全スキーマ + RLS
-- Supabase Dashboard → SQL Editor で実行
-- ============================================================

-- ============================================================
-- 1. profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  area text,
  is_practice boolean not null default true,
  instruments text[] not null default '{}',
  genres text[] not null default '{}',
  favorite_artists text[] not null default '{}',
  favorite_tracks text[] not null default '{}',
  bio text,
  avatar_url text,
  sns_links jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 全員が閲覧可能
create policy "profiles: public read"
  on public.profiles for select using (true);

-- 本人のみ更新可
create policy "profiles: owner update"
  on public.profiles for update using (auth.uid() = id);

-- 登録時に自分のprofileを作成可
create policy "profiles: owner insert"
  on public.profiles for insert with check (auth.uid() = id);


-- ============================================================
-- 2. sessions
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  audio_url text not null,
  is_practice boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

-- 全員が閲覧可能
create policy "sessions: public read"
  on public.sessions for select using (true);

-- 認証済みユーザーが投稿可
create policy "sessions: auth insert"
  on public.sessions for insert with check (auth.uid() = author_id);

-- 本人のみ削除可
create policy "sessions: owner delete"
  on public.sessions for delete using (auth.uid() = author_id);


-- ============================================================
-- 3. answers
-- ============================================================
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  audio_url text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  unique (session_id, sender_id)
);

alter table public.answers enable row level security;

-- セッション投稿者 & アンサー送信者だけが閲覧可
create policy "answers: session author or sender read"
  on public.answers for select using (
    auth.uid() = sender_id
    or auth.uid() = (select author_id from public.sessions where id = session_id)
  );

-- 認証済みユーザーがアンサー送信可
create policy "answers: auth insert"
  on public.answers for insert with check (auth.uid() = sender_id);

-- セッション投稿者がstatus更新可（承認・却下）
create policy "answers: session author status update"
  on public.answers for update using (
    auth.uid() = (select author_id from public.sessions where id = session_id)
  );


-- ============================================================
-- 4. messages（承認済みセッションのチャット）
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- 承認済みアンサーに関与している人のみ読み書き可
create policy "messages: approved participants read"
  on public.messages for select using (
    auth.uid() in (
      select sender_id from public.answers
      where session_id = messages.session_id and status = 'approved'
      union
      select author_id from public.sessions where id = messages.session_id
    )
  );

create policy "messages: approved participants insert"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select sender_id from public.answers
      where session_id = messages.session_id and status = 'approved'
      union
      select author_id from public.sessions where id = messages.session_id
    )
  );


-- ============================================================
-- 5. saves（ブックマーク、数字非表示）
-- ============================================================
create table if not exists public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  primary key (user_id, session_id)
);

alter table public.saves enable row level security;

-- 本人のみ閲覧・追加・削除
create policy "saves: owner read"
  on public.saves for select using (auth.uid() = user_id);

create policy "saves: owner insert"
  on public.saves for insert with check (auth.uid() = user_id);

create policy "saves: owner delete"
  on public.saves for delete using (auth.uid() = user_id);


-- ============================================================
-- 6. updated_at 自動更新トリガー
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 7. 新規登録時に profiles を自動生成
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', 'ゲスト'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
