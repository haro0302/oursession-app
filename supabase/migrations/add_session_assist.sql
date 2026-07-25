-- ============================================================
-- セッションアシスト（お題デッキ ＋ スタジオ枠提案）
-- 承認直後の個別チャット部屋（answer_id単位）に常設する機能。
-- 詳細は docs/specs/chat-spec.md を参照。
-- ============================================================

-- ------------------------------------------------------------
-- 1. お題デッキの回答
--    card_index は固定デッキ(src/lib/assistDeck.ts)の何問目か(0〜5)。
--    値の形はカードの種類により異なる(profile/text/multi)ため、
--    型自体はDBに持たずclient側のデッキ定義で解釈する。
-- ------------------------------------------------------------
create table public.session_assist_answers (
  answer_id uuid not null references public.answers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_index smallint not null check (card_index >= 0 and card_index <= 5),
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (answer_id, user_id, card_index)
);

create index session_assist_answers_answer_id_idx on public.session_assist_answers (answer_id);

alter table public.session_assist_answers enable row level security;

-- 読み取り: room participant であることに加え、
-- 自分の回答 or 同じcard_indexへの自分の回答が既にある(=開封済み)場合のみ他人の行が見える。
-- 「開封はカード単位・両者が答えた瞬間だけ」をDB層でも強制する。
create policy "session_assist_answers: room participants read own or opened"
  on public.session_assist_answers for select using (
    exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = session_assist_answers.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
    and (
      user_id = auth.uid()
      or exists (
        select 1 from public.session_assist_answers mine
        where mine.answer_id = session_assist_answers.answer_id
          and mine.user_id = auth.uid()
          and mine.card_index = session_assist_answers.card_index
      )
    )
  );

create policy "session_assist_answers: room participants insert own"
  on public.session_assist_answers for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = session_assist_answers.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "session_assist_answers: owner update"
  on public.session_assist_answers for update using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. スタジオ枠提案
--    「枠を出しなおす」は既存行を更新せず新しい行を追加する
--    (messages/schedule_pollsと同じ「チャット＝記録」の思想)。
-- ------------------------------------------------------------
create table public.session_assist_studio_proposals (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  studio_name text not null,
  area text not null,
  fee_per_hour integer,
  url text,
  slots jsonb not null check (jsonb_array_length(slots) >= 1 and jsonb_array_length(slots) <= 3),
  -- slots: [{ date: "YYYY-MM-DD", start_hour: number, duration_hours: 1|2|3 }]
  chosen_index smallint,
  chosen_by uuid references public.profiles(id),
  chosen_at timestamptz,
  booked_at timestamptz,
  created_at timestamptz not null default now()
);

create index session_assist_studio_proposals_answer_id_idx on public.session_assist_studio_proposals (answer_id);

alter table public.session_assist_studio_proposals enable row level security;

-- 2人だけの部屋のため、read/insert/updateともroom participantであれば可
-- (選択列・確定列をcolumn単位で厳密分離する制御はMVPでは行わない)
create policy "session_assist_studio_proposals: room participants read"
  on public.session_assist_studio_proposals for select using (
    exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = session_assist_studio_proposals.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "session_assist_studio_proposals: room participants insert"
  on public.session_assist_studio_proposals for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = session_assist_studio_proposals.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

create policy "session_assist_studio_proposals: room participants update"
  on public.session_assist_studio_proposals for update using (
    exists (
      select 1 from public.answers a
      join public.sessions s on s.id = a.session_id
      where a.id = session_assist_studio_proposals.answer_id
        and a.status = 'approved'
        and (auth.uid() = a.sender_id or auth.uid() = s.author_id)
    )
  );

-- ============================================================
-- 手動対応が必要(このSQLでは実行できません):
-- Supabase Dashboard → Database → Replication で
-- session_assist_answers / session_assist_studio_proposals の
-- Realtime を有効化してください。
-- ============================================================
