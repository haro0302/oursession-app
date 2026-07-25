-- ============================================================
-- 1対1個別チャットルーム化
-- ルームの正体を answer_id にする(1セッション内の1アンサー = 1ルーム)。
-- messages / schedule_polls に answer_id を追加し、RLSをルーム単位に差し替える。
-- ============================================================

-- ------------------------------------------------------------
-- 0. 既存データのクリーンアップ(開発中のテストデータのみを想定)
-- 1セッションに複数の承認済みアンサーがある場合、既存の messages / schedule_polls /
-- schedule_poll_responses はどの相手宛てか復元できないため削除してから移行する。
-- ------------------------------------------------------------
delete from public.schedule_poll_responses
  where session_id in (
    select session_id from public.answers where status = 'approved'
    group by session_id having count(*) > 1
  );

delete from public.schedule_polls
  where session_id in (
    select session_id from public.answers where status = 'approved'
    group by session_id having count(*) > 1
  );

delete from public.messages
  where session_id in (
    select session_id from public.answers where status = 'approved'
    group by session_id having count(*) > 1
  );

-- ------------------------------------------------------------
-- 1. messages に answer_id を追加
-- ------------------------------------------------------------
alter table public.messages
  add column answer_id uuid references public.answers(id) on delete cascade;

-- 残った行(1セッション1承認済みアンサーのみ)を該当アンサーに紐付け
update public.messages m
  set answer_id = a.id
  from public.answers a
  where a.session_id = m.session_id
    and a.status = 'approved';

-- どのアンサーにも紐付かない行(承認前に作られた孤立行など)は復元不能なため削除
delete from public.messages where answer_id is null;

alter table public.messages
  alter column answer_id set not null;

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

drop policy if exists "messages: approved participants read" on public.messages;
drop policy if exists "messages: approved participants insert" on public.messages;

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

-- ------------------------------------------------------------
-- 2. schedule_polls / schedule_poll_responses に answer_id を追加
-- ------------------------------------------------------------
alter table public.schedule_polls
  add column answer_id uuid references public.answers(id) on delete cascade;

update public.schedule_polls p
  set answer_id = a.id
  from public.answers a
  where a.session_id = p.session_id
    and a.status = 'approved';

delete from public.schedule_polls where answer_id is null;

alter table public.schedule_polls
  alter column answer_id set not null;

-- schedule_poll_responses 側の旧FKが schedule_polls の unique制約に依存しているため、
-- 先にFKを外してから unique制約を張り替える(順序が逆だと 2BP01 で失敗する)。
alter table public.schedule_poll_responses
  drop constraint if exists schedule_poll_responses_poll_id_session_id_fkey;

alter table public.schedule_polls
  drop constraint if exists schedule_polls_id_session_id_key;
alter table public.schedule_polls
  add constraint schedule_polls_id_answer_id_key unique (id, answer_id);

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

-- schedule_poll_responses: poll_id 経由で answer_id を辿れるようにする
alter table public.schedule_poll_responses
  add column answer_id uuid;

update public.schedule_poll_responses r
  set answer_id = p.answer_id
  from public.schedule_polls p
  where p.id = r.poll_id;

delete from public.schedule_poll_responses where answer_id is null;

alter table public.schedule_poll_responses
  alter column answer_id set not null;

alter table public.schedule_poll_responses
  add constraint schedule_poll_responses_poll_id_answer_id_fkey
  foreign key (poll_id, answer_id) references public.schedule_polls (id, answer_id) on delete cascade;

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

drop policy if exists "schedule_polls: approved participants read" on public.schedule_polls;
drop policy if exists "schedule_polls: approved participants insert" on public.schedule_polls;
drop policy if exists "schedule_poll_responses: approved participants read" on public.schedule_poll_responses;
drop policy if exists "schedule_poll_responses: approved participants insert" on public.schedule_poll_responses;

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

create index if not exists schedule_polls_answer_id_idx on public.schedule_polls (answer_id);
create index if not exists schedule_poll_responses_answer_id_idx on public.schedule_poll_responses (answer_id);

-- ============================================================
-- 手動対応: 既に Realtime を有効化済みの messages / schedule_polls /
-- schedule_poll_responses はそのままで問題ありません(列追加のみのため)。
-- ============================================================
