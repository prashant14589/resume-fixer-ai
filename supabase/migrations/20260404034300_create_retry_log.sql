create extension if not exists pgcrypto;

create table if not exists public.retry_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  old_score int not null,
  attempt1_score int not null,
  final_score int not null,
  retried bool not null default false
);
