-- Migration: 20261112_init_schema.sql
-- Descrição: Estrutura inicial do SafeZone Studies no Supabase (PostgreSQL + RLS + Storage)

-- 1. Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- 2. Tabela de Perfis de Usuário
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger de criação automática de perfil a partir do Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Tabela de Conteúdos
create table if not exists public.contents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('pdf', 'link', 'text', 'markdown')),
  source jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  flashcards_count integer not null default 0,
  reviewed_count integer not null default 0,
  mastery real not null default 0,
  last_studied timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  extracted_text text,
  chunks jsonb not null default '[]'::jsonb,
  study_guide jsonb not null default '[]'::jsonb
);

alter table public.contents enable row level security;

create policy "Users manage own contents" on public.contents
  for all using (auth.uid() = user_id);

-- 4. Tabela de Flashcards e Questões
create table if not exists public.flashcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_id uuid references public.contents(id) on delete cascade not null,
  front text not null,
  back text not null,
  format text not null default 'flip' check (format in ('flip', 'multiple-choice')),
  kind text not null default 'question' check (kind = 'question'),
  options jsonb, -- lista de MultipleChoiceOption [{ id, text, rationale, isCorrect }]
  explanation text, -- justificativa pedagógica detalhada dos distratores
  ease_factor real not null default 2.5,
  interval integer not null default 0,
  repetitions integer not null default 0,
  next_review timestamptz not null default now(),
  last_reviewed timestamptz,
  lapses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy "Users manage own flashcards" on public.flashcards
  for all using (auth.uid() = user_id);

-- Índices de performance para revisões e consultas do dashboard
create index if not exists idx_flashcards_user_next_review on public.flashcards(user_id, next_review);
create index if not exists idx_flashcards_content_id on public.flashcards(content_id);
create index if not exists idx_contents_user_id on public.contents(user_id);

-- 5. Tabela de Sessões de Estudo
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_id uuid references public.contents(id) on delete set null,
  date date not null default current_date,
  cards_reviewed integer not null default 0,
  cards_correct integer not null default 0,
  cards_again integer not null default 0,
  time_spent_seconds integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.study_sessions enable row level security;

create policy "Users manage own sessions" on public.study_sessions
  for all using (auth.uid() = user_id);

-- 6. Tabela de Configurações de Usuário
create table if not exists public.settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Users manage own settings" on public.settings
  for all using (auth.uid() = user_id);

-- 7. Configuração do Storage para Arquivos de Estudo (PDFs e referências)
insert into storage.buckets (id, name, public)
values ('study-assets', 'study-assets', false)
on conflict (id) do nothing;

create policy "Users upload own study assets" on storage.objects
  for insert with check (
    bucket_id = 'study-assets' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users view own study assets" on storage.objects
  for select using (
    bucket_id = 'study-assets' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own study assets" on storage.objects
  for delete using (
    bucket_id = 'study-assets' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
