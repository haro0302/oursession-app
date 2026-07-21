-- ============================================================
-- 日程調整ポーリング機能
-- チャット内で候補日時(最大6件)を提案し、参加者が ○/△/× で回答する
-- ============================================================

create table public.schedule_polls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  candidates jsonb not null check (jsonb_array_length(candidates) <= 6), -- [{id, iso}]
  created_at timestamptz not null default now(),
  unique (id, session_id)
);

create table public.schedule_poll_responses (
  poll_id uuid not null,
  session_id uuid not null, -- schedule_polls.session_id の非正規化コピー(Realtimeのfilterは列でしか絞れないため)
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null, -- { [candidateId]: "ok" | "maybe" | "no" }
  updated_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  -- (poll_id, session_id) の複合FKで、クライアントが偽のsession_idを付けて
  -- 別セッションのpoll_idに書き込むことをDBレベルで防ぐ
  foreign key (poll_id, session_id) references public.schedule_polls (id, session_id) on delete cascade
);

create index schedule_polls_session_id_idx on public.schedule_polls (session_id);
create index schedule_poll_responses_session_id_idx on public.schedule_poll_responses (session_id);

alter table public.schedule_polls enable row level security;
alter table public.schedule_poll_responses enable row level security;

-- 承認済み参加者のみ読み書き可(messagesテーブルと同じ述語)
create policy "schedule_polls: approved participants read"
  on public.schedule_polls for select using (
    auth.uid() in (
      select sender_id from public.answers
      where session_id = schedule_polls.session_id and status = 'approved'
      union
      select author_id from public.sessions where id = schedule_polls.session_id
    )
  );

create policy "schedule_polls: approved participants insert"
  on public.schedule_polls for insert with check (
    auth.uid() = created_by
    and auth.uid() in (
      select sender_id from public.answers
      where session_id = schedule_polls.session_id and status = 'approved'
      union
      select author_id from public.sessions where id = schedule_polls.session_id
    )
  );

create policy "schedule_poll_responses: approved participants read"
  on public.schedule_poll_responses for select using (
    auth.uid() in (
      select sender_id from public.answers
      where session_id = schedule_poll_responses.session_id and status = 'approved'
      union
      select author_id from public.sessions where id = schedule_poll_responses.session_id
    )
  );

create policy "schedule_poll_responses: approved participants insert"
  on public.schedule_poll_responses for insert with check (
    auth.uid() = user_id
    and auth.uid() in (
      select sender_id from public.answers
      where session_id = schedule_poll_responses.session_id and status = 'approved'
      union
      select author_id from public.sessions where id = schedule_poll_responses.session_id
    )
  );

create policy "schedule_poll_responses: owner update"
  on public.schedule_poll_responses for update using (auth.uid() = user_id);

-- ============================================================
-- 手動対応が必要(このSQLでは実行できません):
-- Supabase Dashboard → Database → Replication で
-- schedule_polls / schedule_poll_responses の Realtime を有効化してください。
-- (messages テーブルも同じ手順で有効化されており、SQLには表れません)
-- ============================================================
