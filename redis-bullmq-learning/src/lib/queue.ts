import { Queue } from "bullmq";
import Redis from "ioredis";

// ============================================================================
// 1. Redis Connection
// ============================================================================
// We create a shared Redis connection using ioredis. 
// By default, it connects to localhost:6379, which matches our Docker setup.
// If you deploy this, you would use process.env.REDIS_URL here.
const connection = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null, // Required by BullMQ
});

// ============================================================================
// 2. BullMQ Queue Instance
// ============================================================================
// Both the Next.js API (Producer) and the standalone Worker process 
// will import and connect to this exact same queue named "heavy-jobs".
// The Next.js API will ADD jobs to this queue, and the worker will TAKE them.
export const heavyJobsQueue = new Queue("heavy-jobs", {
  connection,
});
