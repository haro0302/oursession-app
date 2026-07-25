-- ============================================================
-- session_assist_answers の SELECT ポリシーが自テーブルを直接サブクエリしており、
-- 「infinite recursion detected in policy for relation "session_assist_answers"」
-- を起こしていたための修正。SECURITY DEFINER 関数を挟んでRLS評価の再帰を止める。
-- (add_session_assist.sql 側も同じ内容に更新済み。以後の新規適用では不要)
-- ============================================================

create or replace function public.session_assist_has_answered(
  p_answer_id uuid,
  p_card_index smallint,
  p_user_id uuid
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.session_assist_answers
    where answer_id = p_answer_id
      and card_index = p_card_index
      and user_id = p_user_id
  );
$$;

grant execute on function public.session_assist_has_answered(uuid, smallint, uuid) to authenticated;

drop policy if exists "session_assist_answers: room participants read own or opened" on public.session_assist_answers;

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
      or public.session_assist_has_answered(session_assist_answers.answer_id, session_assist_answers.card_index, auth.uid())
    )
  );
