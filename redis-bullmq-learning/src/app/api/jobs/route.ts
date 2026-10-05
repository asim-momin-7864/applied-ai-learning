import { NextRequest, NextResponse } from "next/server";
import { heavyJobsQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ========================================================================
    // 1. ADD JOB TO QUEUE
    // ========================================================================
    // Instead of doing heavy AI work here and risking a Vercel timeout, 
    // we simply add the task data to our Redis queue.
    const job = await heavyJobsQueue.add("generate-report", {
      prompt: body.prompt || "Default Prompt",
      // You can pass user IDs, session tokens, or any metadata here
    });

    console.log(`[Next.js API] Enqueued job ${job.id}`);

    // ========================================================================
    // 2. RETURN IMMEDIATELY
    // ========================================================================
    // We immediately return the job ID to the frontend.
    // The frontend will use this ID to poll for status.
    return NextResponse.json({ jobId: job.id });

  } catch (error) {
    console.error("Failed to enqueue job:", error);
    return NextResponse.json(
      { error: "Failed to enqueue job" },
      { status: 500 }
    );
  }
}
