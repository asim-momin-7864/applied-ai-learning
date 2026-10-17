# ⚡ Quick Supabase Setup Guide

This project stores chat conversation history in Supabase. Whenever you delete and recreate your free-tier Supabase project, follow this 2-minute quick-setup guide.

---

## 🚀 30-Second Fast Track

1. Create a new Supabase project at [database.new](https://database.new).
2. Go to **SQL Editor** -> **New Query**, paste the [SQL Schema](#1-sql-schema-run-in-supabase-sql-editor), and click **Run**.
3. Go to **Project Settings** -> **API**, copy:
   - **Project URL**
   - **`service_role` secret key** *(do NOT use `anon` key)*
4. Paste them into your `.env` file:
   ```env
   SUPABASE_URL="https://<your-project-id>.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="<your-service-role-secret-key>"
   ```
5. Restart your dev server (`npm run dev`).

---

## 1. SQL Schema (Run in Supabase SQL Editor)

Copy and run this exact script in your Supabase **SQL Editor**:

```sql
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
```

---

## 2. Environment Variables (`.env`)

Update the Supabase section in your root [.env](file:///.env) file:

```env
# Supabase Configuration
SUPABASE_URL="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> ⚠️ **Important:**
> The app uses `SUPABASE_SERVICE_ROLE_KEY` inside `src/lib/supabase.ts` so the server can read and write chat history directly. Make sure to copy the **`service_role`** secret key (found in **Settings -> API -> Project API keys**), not the public `anon` key.

---

## 3. Quick Verification Commands

### Option A: Check via Curl
With the dev server running (`npm run dev`), test fetching history:
```bash
curl http://localhost:3000/api/chat
```
Expected output:
```json
{"messages":[]}
```

Send a test message:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## 4. Helpful Maintenance SQL Commands

### Clear Chat History (Without Deleting the Project)
If you just want to wipe previous chats and start fresh without creating a new Supabase project:
```sql
truncate table public.messages;
```

### Completely Reset Table
```sql
drop table if exists public.messages cascade;
```
*(Then re-run the schema script above)*

---

## 5. (Alternative) Supabase CLI Setup

If you prefer using the Supabase CLI instead of the browser:

```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your project (get project-ref from project URL)
npx supabase link --project-ref <your-project-ref>

# 3. Execute the SQL directly
npx supabase db execute --file ./supabase-schema.sql
```
