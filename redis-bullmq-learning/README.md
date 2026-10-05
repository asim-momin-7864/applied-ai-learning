# Redis + BullMQ + Next.js App Router Reference

This project demonstrates how to decouple heavy background processing (like AI generation) from your Next.js application using BullMQ and Redis.

## Prerequisites

You need a Redis instance running locally to act as the message broker.

1. **Start Redis using Docker (Run this first!):**
   ```bash
   docker run -d -p 6379:6379 redis
   ```

## Running the Application

This architecture requires running two separate processes simultaneously.

1. **Start the Next.js Frontend & API server (Terminal 1):**
   ```bash
   npm run dev
   ```
   *This serves the web UI at `http://localhost:3000` and the Next.js API routes (`/api/jobs`).*

2. **Start the Background Worker (Terminal 2):**
   ```bash
   npm run worker
   ```
   *This starts a standalone Node.js process using `tsx` that listens to the Redis queue and processes jobs asynchronously.*

## Architecture Overview

- **`src/lib/queue.ts`**: Configures the BullMQ Queue and Redis connection. This is the bridge between Next.js and the worker.
- **`worker.ts`**: A headless script that consumes jobs from the queue. This is where heavy, long-running tasks (like LangGraph or LLM calls) should go.
- **Next.js APIs**: 
  - `POST /api/jobs`: Enqueues a new job.
  - `GET /api/jobs/[id]`: Checks if the worker has finished the job yet.
- **Frontend (`src/app/page.tsx`)**: Triggers jobs and polls for completion status.
