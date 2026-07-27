-- サインアップ時の年齢確認（18歳以上）で取得した生年月日を保存する非公開テーブル
-- profiles は "public read" ポリシーで全員が select できるため、生年月日はここに分離する
-- Supabase SQL Editor で実行してください
create table if not exists public.profile_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_date date not null,
  created_at timestamptz not null default now()
);

alter table public.profile_private enable row level security;

create policy "profile_private: owner select"
  on public.profile_private for select using (auth.uid() = user_id);

create policy "profile_private: owner insert"
  on public.profile_private for insert with check (auth.uid() = user_id);
