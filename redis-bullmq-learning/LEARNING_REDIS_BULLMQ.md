# Mastering Background Jobs in Next.js with Redis & BullMQ

When building AI applications or handling heavy computations in Next.js, you quickly run into a major issue: **Serverless Timeout Limits**. Vercel and other platforms will kill any API request that takes longer than 10–60 seconds. 

To solve this, we decouple the heavy processing from the web server using a **Message Broker (Redis)** and a **Job Queue (BullMQ)**.

---

## 🏗️ Architecture Overview

The architecture consists of 3 completely independent parts:

1. **The Web Server (Next.js)**: Acts as the **Producer**. It receives a user request, throws a "Job" into the Redis queue, and immediately returns a `jobId` to the user.
2. **The Message Broker (Redis)**: Acts as the **Queue**. It holds all the pending jobs safely in memory until a worker is ready to pick them up.
3. **The Worker (Standalone Node Process)**: Acts as the **Consumer**. It runs constantly in the background, grabs jobs from Redis one by one, processes the heavy AI task, and saves the final result back to Redis.

---

## 🛠️ Step 1: Setting Up Redis and the Queue

Before writing Next.js code, we need our message broker. We use `ioredis` to talk to a local Docker container running Redis.

**Run Redis locally:**
```bash
docker run -d -p 6379:6379 redis
```

**Create the Shared Queue (`src/lib/queue.ts`):**
Both our Next.js API and our Worker will need to import this exact same queue to talk to each other.

```typescript
import { Queue } from "bullmq";
import Redis from "ioredis";

// 1. Establish connection to Redis
const connection = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
});

// 2. Export the shared queue instance
export const heavyJobsQueue = new Queue("heavy-jobs", { connection });
```

---

## 📤 Step 2: Sending Jobs (The Producer)

When a user clicks "Generate", we don't do the heavy work. We just add it to the queue.

**The Next.js API Route (`src/app/api/jobs/route.ts`):**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { heavyJobsQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Add the job to the queue. 
  // 'generate-report' is the job name. The second arg is the payload/data.
  const job = await heavyJobsQueue.add("generate-report", {
    prompt: body.prompt || "Analyze market trends",
    userId: "user_123" // You can pass any metadata here!
  });

  // RETURN IMMEDIATELY! Do not wait for it to finish.
  return NextResponse.json({ jobId: job.id });
}
```

---

## 👷 Step 3: Processing Jobs (The Worker)

The worker is a script that runs *outside* of Next.js. We run this using `npx tsx worker.ts`. It continuously listens to Redis.

**The Worker Script (`worker.ts`):**
```typescript
import { Worker, Job } from "bullmq";
import Redis from "ioredis";

const connection = new Redis({ host: "localhost", port: 6379, maxRetriesPerRequest: null });

// Listen to the EXACT same queue name: "heavy-jobs"
const worker = new Worker("heavy-jobs", async (job: Job) => {
    console.log(`Processing job ${job.id} for prompt:`, job.data.prompt);

    // ==========================================
    // YOUR HEAVY AI TASK GOES HERE
    // Example: Vercel AI SDK or LangGraph
    // ==========================================
    // const result = await langchain.invoke({ input: job.data.prompt });
    
    // Simulating a 5-second heavy task
    await new Promise(resolve => setTimeout(resolve, 5000));

    // What you return here is AUTOMATICALLY saved back to Redis 
    // under this job's ID as `job.returnvalue`.
    return {
      status: "success",
      generatedText: "This is the AI generated report!",
    };
}, { connection });
```

---

## 🔍 Step 4: Receiving Results (The Status API)

Now that the worker has completed the job and saved the result in Redis, our Next.js frontend needs a way to fetch it.

**The Next.js GET Route (`src/app/api/jobs/[id]/route.ts`):**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { heavyJobsQueue } from "@/lib/queue";

export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  // Fetch the specific job from Redis using the ID
  const job = await heavyJobsQueue.getJob(params.id);
  
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // BullMQ tracks state for us automatically!
  const isCompleted = await job.isCompleted();

  if (isCompleted) {
    // If done, return the exact object the Worker returned!
    return NextResponse.json({ state: "completed", result: job.returnvalue });
  }

  // Otherwise, let the client know it's still processing
  return NextResponse.json({ state: await job.getState() });
}
```

---

## 🖥️ Step 5: Showing Results in Next.js (The Frontend)

Finally, the frontend needs to trigger the job, grab the `jobId`, and relentlessly poll the Status API until it gets the completed result.

**The Page Component (`src/app/page.tsx`):**
```tsx
"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);

  // 1. Submit the task
  const triggerJob = async () => {
    const res = await fetch("/api/jobs", { method: "POST" });
    const data = await res.json();
    setJobId(data.jobId); // Save the ID to state!
  };

  // 2. Poll for the result
  useEffect(() => {
    if (!jobId) return;

    // Check status every 2 seconds
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();

      if (data.state === "completed") {
        setResult(data.result); // WE HAVE THE AI DATA!
        setJobId(null);         // Stop polling
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div>
      <button onClick={triggerJob}>Start AI Task</button>
      {jobId && <p>Processing job in background...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

## 🚀 Summary of the Flow
1. **User Clicks Button** ➔ `POST /api/jobs`
2. **Next.js** adds `jobData` to **Redis Queue** and returns `jobId = 123`
3. **Frontend** receives `123` and starts polling `GET /api/jobs/123` every 2s.
4. Meanwhile, the **Worker** sees a new job in **Redis**, picks it up, and spends 5 minutes running LangGraph/OpenAI.
5. **Worker** finishes and saves `{ text: "Done!" }` to **Redis** on job `123`.
6. Next time **Frontend** polls `GET /api/jobs/123`, Next.js checks Redis, sees it's complete, and sends `{ text: "Done!" }` back to the browser.
7. Polling stops, UI displays the AI text!
