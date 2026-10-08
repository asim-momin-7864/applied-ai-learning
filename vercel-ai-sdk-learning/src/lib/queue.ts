//* creating queu for image ai work

import { Queue } from "bullmq";
import Redis from "ioredis";

// connection to redis
const connection = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

// queue instance
export const imageQueue = new Queue("imageQueue", { connection });
