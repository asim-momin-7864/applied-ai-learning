// file for image description worker
import { Worker, type Job } from "bullmq";
import { generateText } from "ai";
import { localChat } from "@/lib/local-ai";

// connection
const connectionObject = {
  connection: {
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
  },
  concurrency: 1, // Explicitly set to 1. Local LM Studio servers usually crash or reject requests if you try to process multiple images concurrently!
};

// worker instance
const imageWorker = new Worker(
  "imageQueue", // fixed queue name to match queue.ts
  async (job: Job) => {
    console.log(`⏳ Processing job ${job.id}...`);
    //data
    const { imageUrl, prompt } = job.data;

    // model
    const model = localChat("google/gemma-4-e2b");

    // fetch the image first because LM Studio often does not support downloading from a URL directly
    const imageRes = await fetch(imageUrl);
    
    if (!imageRes.ok) {
      throw new Error(`Failed to download image from URL. Server responded with: ${imageRes.status} ${imageRes.statusText}`);
    }
    const arrayBuffer = await imageRes.arrayBuffer();
    const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

    // call vision model
    const response = await generateText({
      model,
      system: "You are a helpful assistant. Describe the uploaded image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Describe this image" },
            {
              type: "file",
              data: arrayBuffer, // AI SDK will automatically convert this to a base64 string for the OpenAI protocol
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    console.log(
      `✅ Job ${job.id} completed. Generated Text:\n\n${response.text}\n\n`,
    );

    // return result to redis , it is save in job.returnValue
    return {
      text: response.text,
    };
  },

  connectionObject,
);

// cases we handled

imageWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

// Triggered when a job successfully completes
imageWorker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} officially completed. Result stored in Redis!`);
});

// Triggered if the worker itself throws an error (e.g., Redis connection drops)
imageWorker.on("error", (err) => {
  console.error(`🚨 Worker encountered an error:`, err);
});

// Triggered if a job gets stuck (e.g., CPU is overloaded or worker crashed mid-job)
imageWorker.on("stalled", (jobId) => {
  console.warn(`⚠️ Job ${jobId} stalled and will be re-processed.`);
});
