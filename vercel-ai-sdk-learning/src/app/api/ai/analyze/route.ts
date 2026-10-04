//* route POST api for comment analyzing
import { streamText, Output, createTextStreamResponse, toTextStream } from "ai";
import { google } from "@ai-sdk/google";
import { localChat } from "@/lib/local-ai";
import { z } from "zod";

// switch
const USE_LOCAL = process.env.USE_LOCAL_AI === "true";

export async function POST(req: Response) {
  // feedbacks
  const { feedbacks } = await req.json();

  // model
  const model = USE_LOCAL
    ? localChat("google/gemma-4-e4b")
    : google("gemini-3.5-flash-lite");

  const result = streamText({
    model,
    system: "You are an expert customer success manager analyzing feedbacks.",
    prompt: feedbacks,
    output: Output.object({
      schema: z.object({
        sentiment: z.enum(["Positive", "Neutral", "Negative", "Mixed"]),
        summary: z.string().describe("A quick one-sentence summary"),
        urgentIssue: z
          .boolean()
          .describe(
            "True if the user is angry, threatening to cancel, or demanding a refund",
          ),
        keyThemes: z
          .array(z.string())
          .describe("3 to 5 short tags (e.g., 'UI/UX', 'Pricing')"),
        actionItems: z.array(
          z
            .object({
              department: z.enum(["Product", "Billing", "Sales", "Support"]),
              task: z.string(),
            })
            .describe(
              "Task that internal teams need to do based on this feedback",
            ),
        ),
      }),
    }),
  });

  return createTextStreamResponse({
    stream: toTextStream({
      stream: result.stream,
    }),
  });
}
