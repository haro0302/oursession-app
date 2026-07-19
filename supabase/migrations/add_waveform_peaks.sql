-- 既存DBに waveform_peaks 列を追加するマイグレーション
-- Supabase SQL Editor で実行してください
alter table public.sessions add column if not exists waveform_peaks jsonb;
alter table public.answers add column if not exists waveform_peaks jsonb;
