import { Worker, Job } from "bullmq";
import Redis from "ioredis";

// ============================================================================
// THE STANDALONE WORKER PROCESS
// ============================================================================
// This is a completely separate process from Next.js. 
// It does NOT run inside the Next.js request lifecycle.
// It connects directly to Redis, listens to the "heavy-jobs" queue,
// and processes tasks one by one.

const connection = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

console.log("👷 Worker process started. Listening for jobs on 'heavy-jobs'...");

// Instantiate the Worker.
// It takes the name of the queue ("heavy-jobs") and an async function to run per job.
const worker = new Worker(
  "heavy-jobs",
  async (job: Job) => {
    console.log(`\n📦 Received job ${job.id} with data:`, job.data);

    // ========================================================================
    // INSERT LANGGRAPH OR VERCEL AI SDK HERE
    // ========================================================================
    // This is where your heavy, multi-minute AI workflow goes.
    // Since this is a background worker, it won't time out Vercel's 10s-60s limit!
    // 
    // Example:
    // const stream = await generateText({ ... });
    // const agentResponse = await langgraph.invoke({ ... });
    // ========================================================================

    // Mocking a heavy task (e.g., 5 seconds of work)
    console.log(`⏳ Processing job ${job.id}... (Simulating 5s delay)`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    console.log(`✅ Completed job ${job.id}`);

    // Whatever you return here gets stored in Redis as `job.returnvalue`.
    // The Next.js API will poll for this exact result.
    return {
      status: "success",
      ai_response: `Here is your generated report for: "${job.data.prompt || 'Unknown'}"!`,
      timestamp: new Date().toISOString()
    };
  },
  { connection }
);

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("Gracefully shutting down worker...");
  await worker.close();
  process.exit(0);
});
