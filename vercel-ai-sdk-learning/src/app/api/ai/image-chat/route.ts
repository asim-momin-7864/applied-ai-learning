//* router for image file upload

//* Direct without redis-bullmq queue way
// import {
//   streamText,
//   createUIMessageStreamResponse,
//   toUIMessageStream,
//   convertToModelMessages,
//   UIMessage,
// } from "ai";
// import { google } from "@ai-sdk/google";
// import { localChat } from "@/lib/local-ai";

// const USE_LOCAL = process.env.USE_LOCAL_AI === "true";

// export async function POST(req: Request) {
//   // useChat sends JSON { messages: UIMessage[] }
//   const { messages }: { messages: UIMessage[] } = await req.json();

//   // model choosing
//   const model = USE_LOCAL
//     ? localChat("google/gemma-4-e4b")
//     : google("gemini-3.5-flash-lite");

//   // convertToModelMessages: converts UIMessage[] → ModelMessage[]
//   // - UIMessage has `parts` (used by the UI),
//   // - ModelMessage has `content` (used by the AI model)
//   // Without this conversion, streamText throws a Zod validation error on `content`
//   const result = streamText({
//     model,
//     system:
//       "If user dont provide prompt, Give 5 lines description of uploaded image",
//     messages: await convertToModelMessages(messages),
//   });

//   return createUIMessageStreamResponse({
//     stream: toUIMessageStream({
//       stream: result.stream,
//     }),
//   });
// }

//* redis-bullmq queue way ( PRODUCER SIDE )
// Route handler
import { NextRequest, NextResponse } from "next/server";
import { imageQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const { imageUrl, prompt }: { imageUrl: string; prompt: string } =
    await req.json(); // here we get benefit of clearly sending data in req body

  // add job to queue
  const job = await imageQueue.add("describe-image", { imageUrl, prompt });

  console.log("initial job => ", job);

  // return job id
  return NextResponse.json({
    jobId: job.id,
  });
}

// GET : for fecthing jobs
export async function GET(req: NextRequest) {
  // get ids
  const { searchParams } = new URL(req.url);
  const idsString = searchParams.get("ids");

  // split ids
  const idsArray = idsString ? idsString.split(",") : [];

  // empty dictionary to hold results (object map)
  const jobStateResultMap: Record<
    string,
    {
      state: "pending" | "completed" | "failed";
      result?: string;
    }
  > = {};

  // iterate over ids array
  // to check all jobs

  for (const id of idsArray) {
    // get job
    const job = await imageQueue.getJob(id);

    // id not found job, then skip this iteration and go to next
    if (!job) continue;

    // get status
    const state = await job.getState();
    // 'completed', 'failed', 'delayed', 'active', 'waiting', 'waiting-children', 'unknown'.

    if (state === "completed") {
      // add data
      jobStateResultMap[id] = {
        state: "completed",
        result: job.returnvalue?.text,
      };
    } else if (
      state === "delayed" ||
      state === "active" ||
      state === "waiting" ||
      state === "waiting-children"
    ) {
      // add pending
      jobStateResultMap[id] = {
        state: "pending",
      };
    } else if (state === "failed") {
      // add failed
      jobStateResultMap[id] = {
        state: "failed",
      };
    }
  }

  // return all jobs states map with id
  return NextResponse.json(jobStateResultMap);
}
