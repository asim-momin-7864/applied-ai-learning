# Supabase Project Setup & Reset Guide

This file contains everything needed to initialize or reset a Supabase project from scratch for the **Email Chat RAG Pipeline**.

Since the Supabase free tier is limited to **2 projects**, use this guide whenever you delete an old project and need to spin up a fresh one in under 2 minutes.

---

## 1. Complete SQL Setup Script (Run in Supabase SQL Editor)

Go to **Supabase Dashboard → SQL Editor → New Query**, paste the code below, and click **Run**:

```sql
-- ==============================================================================
-- 1. CLEANUP (Optional: Only if resetting an existing project)
-- ==============================================================================
drop function if exists match_emails(vector, float, int);
drop table if exists emails cascade;

-- ==============================================================================
-- 2. ENABLE PGVECTOR EXTENSION
-- ==============================================================================
create extension if not exists vector;

-- ==============================================================================
-- 3. CREATE EMAILS TABLE
-- Note: embedding dimension is 768 to match nomic-embed-text:v1.5
-- ==============================================================================
create table if not exists emails (
  id bigint primary key generated always as identity,
  subject text not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz default now() not null
);

-- ==============================================================================
-- 4. CREATE HNSW VECTOR INDEX (Fast Cosine Similarity Search)
-- ==============================================================================
create index if not exists emails_embedding_hnsw_idx 
  on emails 
  using hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Disable for learning/development since backend uses SUPABASE_SERVICE_ROLE_KEY
-- ==============================================================================
alter table emails disable row level security;

-- ==============================================================================
-- 6. MATCH_EMAILS RPC FUNCTION (Cosine Similarity Search)
-- ==============================================================================
create or replace function match_emails (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  subject text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    emails.id,
    emails.subject,
    emails.content,
    1 - (emails.embedding <=> query_embedding) as similarity
  from emails
  where 1 - (emails.embedding <=> query_embedding) > match_threshold
  order by emails.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## 2. Update Environment Variables (`.env.local`)

Once the new Supabase project is created:

1. In Supabase Dashboard, navigate to **Project Settings → API** (or **Project Settings → Data API**).
2. Copy the **Project URL**.
3. Copy the **`service_role`** key (under Project API keys → Secret keys).
4. Update your project's `.env.local` file:

```env
# Get these from your Supabase Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_NEW_SERVICE_ROLE_SECRET_KEY"
```

5. Restart the Next.js development server:
```bash
npm run dev
```

---

## 3. Populate Test Emails

After resetting, add sample emails to test the RAG pipeline:

### Option A: Via the Web UI
1. Open [http://localhost:3000/ingest](http://localhost:3000/ingest) in your browser.
2. Copy sample subjects and bodies from [`test-data.txt`](./test-data.txt) and submit.

### Option B: Automated Seeding Command (Recommended)
Make sure `npm run dev` is running, then in a second terminal run:

```bash
npm run seed
```

This reads all 10 sample emails from `test-data.txt` and ingests them into your new Supabase database automatically!

---

## 4. Verification Check

To confirm your new Supabase database is working correctly, run this in the Supabase SQL Editor:

```sql
-- Check total stored chunks:
select count(*) as total_email_chunks from emails;

-- Check sample data with similarity test:
select id, subject, left(content, 60) as preview, created_at from emails limit 5;
```
