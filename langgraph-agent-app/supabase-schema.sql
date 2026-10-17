-- Supabase Schema for langgraph-agent-app
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Create messages table for chat history
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Index for fast chat history querying and ordering
create index if not exists idx_messages_chat_id_created_at
  on public.messages (chat_id, created_at asc);

-- 3. Enable Row Level Security (RLS)
alter table public.messages enable row level security;

-- 4. Full access policy for service role (used by backend)
create policy "Service role has full access"
  on public.messages
  for all
  to service_role
  using (true)
  with check (true);
