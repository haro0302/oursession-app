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
-- 1b. songs（楽曲マスタ。カードの曲・プロフィールの「やりたい曲」で共用）
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

create policy "songs: public read"
  on public.songs for select using (true);

create policy "songs: auth insert"
  on public.songs for insert with check (auth.uid() is not null);


-- ============================================================
-- 1c. profile_want_songs（プロフィールの「やりたい曲」。多対多）
-- ============================================================
create table if not exists public.profile_want_songs (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, song_id)
);

alter table public.profile_want_songs enable row level security;

create policy "profile_want_songs: public read"
  on public.profile_want_songs for select using (true);

create policy "profile_want_songs: owner insert"
  on public.profile_want_songs for insert with check (auth.uid() = profile_id);

create policy "profile_want_songs: owner delete"
  on public.profile_want_songs for delete using (auth.uid() = profile_id);


-- ============================================================
-- 2. sessions
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(id),
  requested_part text not null,
  area text not null,
  genre text not null,
  body text,
  audio_url text not null,
  waveform_peaks jsonb,
  wip boolean not null default false, -- 投稿単位の「まだ練習中」（人単位の練習中バッジとは別概念）
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
  waveform_peaks jsonb,
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
-- 4. messages（1対1チャットルーム。ルームの正体は answer_id）
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade, -- answer_id からの非正規化コピー(トリガーで自動補完)
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- session_id はクライアントに送らせず、answer_id から自動補完する
create or replace function public.messages_set_session_id()
returns trigger language plpgsql as $$
begin
  select session_id into new.session_id from public.answers where id = new.answer_id;
  return new;
end;
$$;

create trigger messages_set_session_id
  before insert on public.messages
  for each row execute procedure public.messages_set_session_id();

-- ルーム(=承認済みアンサー)の当事者2人だけが読み書き可
create policy "messages: room participants read"
  on public.messages for select using (
    exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = messages.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "messages: room participants insert"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = messages.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create index if not exists messages_answer_id_idx on public.messages (answer_id);


-- ============================================================
-- 4b. schedule_polls / schedule_poll_responses（日程調整ポーリング、ルーム=answer_id単位）
-- ============================================================
create table if not exists public.schedule_polls (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade, -- answer_id からの非正規化コピー(トリガーで自動補完)
  created_by uuid not null references public.profiles(id) on delete cascade,
  candidates jsonb not null check (jsonb_array_length(candidates) <= 6), -- [{id, iso}]
  created_at timestamptz not null default now(),
  unique (id, answer_id)
);

create table if not exists public.schedule_poll_responses (
  poll_id uuid not null,
  answer_id uuid not null, -- schedule_polls.answer_id の非正規化コピー(Realtimeのfilterは列でしか絞れないため)
  session_id uuid not null, -- 同上(表示用の非正規化コピー)
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null, -- { [candidateId]: "ok" | "maybe" | "no" }
  updated_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  -- (poll_id, answer_id) の複合FKで、クライアントが偽のanswer_idを付けて
  -- 別ルームのpoll_idに書き込むことをDBレベルで防ぐ
  foreign key (poll_id, answer_id) references public.schedule_polls (id, answer_id) on delete cascade
);

create index if not exists schedule_polls_answer_id_idx on public.schedule_polls (answer_id);
create index if not exists schedule_poll_responses_answer_id_idx on public.schedule_poll_responses (answer_id);

alter table public.schedule_polls enable row level security;
alter table public.schedule_poll_responses enable row level security;

-- session_id はクライアントに送らせず自動補完する
create or replace function public.schedule_polls_set_session_id()
returns trigger language plpgsql as $$
begin
  select session_id into new.session_id from public.answers where id = new.answer_id;
  return new;
end;
$$;

create trigger schedule_polls_set_session_id
  before insert on public.schedule_polls
  for each row execute procedure public.schedule_polls_set_session_id();

create or replace function public.schedule_poll_responses_set_session_id()
returns trigger language plpgsql as $$
begin
  select session_id into new.session_id from public.schedule_polls where id = new.poll_id;
  return new;
end;
$$;

create trigger schedule_poll_responses_set_session_id
  before insert on public.schedule_poll_responses
  for each row execute procedure public.schedule_poll_responses_set_session_id();

-- ルーム(=承認済みアンサー)の当事者2人のみ読み書き可(messagesテーブルと同じ述語)
create policy "schedule_polls: room participants read"
  on public.schedule_polls for select using (
    exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = schedule_polls.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "schedule_polls: room participants insert"
  on public.schedule_polls for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = schedule_polls.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "schedule_poll_responses: room participants read"
  on public.schedule_poll_responses for select using (
    exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = schedule_poll_responses.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "schedule_poll_responses: room participants insert"
  on public.schedule_poll_responses for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = schedule_poll_responses.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "schedule_poll_responses: owner update"
  on public.schedule_poll_responses for update using (auth.uid() = user_id);

-- 手動対応: Supabase Dashboard → Database → Replication で
-- schedule_polls / schedule_poll_responses の Realtime を有効化してください。


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
