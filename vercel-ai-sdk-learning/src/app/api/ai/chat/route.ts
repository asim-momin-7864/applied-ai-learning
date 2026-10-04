import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import { google } from "@ai-sdk/google";
import { localChat } from "@/lib/local-ai";

const USE_LOCAL = process.env.USE_LOCAL_AI === "true";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // model select
  const model = USE_LOCAL
    ? localChat("google/gemma-4-e4b") // uses /chat/completions — LM Studio compatible
    : google("gemini-3.1-flash-lite");

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
