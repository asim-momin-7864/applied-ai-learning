import { NextRequest, NextResponse } from "next/server";
import { heavyJobsQueue } from "@/lib/queue";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ========================================================================
    // 1. FETCH JOB FROM REDIS
    // ========================================================================
    // We use the shared queue instance to fetch the exact job by ID.
    const job = await heavyJobsQueue.getJob(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // ========================================================================
    // 2. CHECK JOB STATUS
    // ========================================================================
    // BullMQ tracks state (waiting, active, completed, failed) for us.
    const isCompleted = await job.isCompleted();
    const isFailed = await job.isFailed();

    if (isCompleted) {
      // job.returnvalue contains whatever the Worker returned!
      return NextResponse.json({
        state: "completed",
        result: job.returnvalue,
      });
    }

    if (isFailed) {
      return NextResponse.json({
        state: "failed",
        error: job.failedReason,
      }, { status: 500 });
    }

    // If it's not completed or failed, it's pending/active.
    return NextResponse.json({
      state: await job.getState(), // Usually 'waiting' or 'active'
    });

  } catch (error) {
    console.error("Failed to check job status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
