-- Migration: 20261117_align_columns.sql
-- Descrição: Alinha todas as colunas usadas pelo frontend SafeZone Studies nas tabelas do Supabase

-- 1. Contents: suporte ao caminho do asset no Supabase Storage
alter table public.contents
  add column if not exists storage_path text;

-- 2. Flashcards: suporte a tags, dificuldade e importância
alter table public.flashcards
  add column if not exists tags text[] not null default '{}',
  add column if not exists difficulty text default 'medium',
  add column if not exists importance integer default 5;

-- 3. Study Sessions: alinhamento completo com métricas de sessão
alter table public.study_sessions
  add column if not exists start_time timestamptz not null default now(),
  add column if not exists end_time timestamptz,
  add column if not exists duration_minutes integer not null default 0,
  add column if not exists cards_hard integer not null default 0,
  add column if not exists cards_good integer not null default 0,
  add column if not exists cards_easy integer not null default 0,
  add column if not exists accuracy real not null default 0,
  add column if not exists content_ids text[] not null default '{}';

-- 4. Settings: colunas estruturadas de preferências do usuário e IA
alter table public.settings
  add column if not exists theme text not null default 'system',
  add column if not exists daily_goal jsonb not null default '{"studyTimeMinutes": 60, "newCardsLimit": 20}'::jsonb,
  add column if not exists target_exam text not null default 'AI-200',
  add column if not exists session_behavior jsonb not null default '{"autoPlayAudio": false, "showAnswerTimer": true}'::jsonb,
  add column if not exists notifications jsonb not null default '{"enabled": true, "reminderTime": "19:00"}'::jsonb,
  add column if not exists data_retention jsonb not null default '{"retention": "1year"}'::jsonb,
  add column if not exists ai jsonb not null default '{"provider": "gemini", "model": "gemini-3.1-flash-lite", "temperature": 0.3, "maxTokens": 4096}'::jsonb;

-- 5. Recarregar schema cache do PostgREST no Supabase
notify pgrst, 'reload schema';
