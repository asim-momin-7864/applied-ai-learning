//* router for image file upload
import {
  streamText,
  createUIMessageStreamResponse,
  toUIMessageStream,
  convertToModelMessages,
  UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { localChat } from "@/lib/local-ai";

const USE_LOCAL = process.env.USE_LOCAL_AI === "true";

export async function POST(req: Request) {
  // useChat sends JSON { messages: UIMessage[] }
  const { messages }: { messages: UIMessage[] } = await req.json();

  // model choosing
  const model = USE_LOCAL
    ? localChat("google/gemma-4-e4b")
    : google("gemini-3.5-flash-lite");

  // convertToModelMessages: converts UIMessage[] → ModelMessage[]
  // - UIMessage has `parts` (used by the UI),
  // - ModelMessage has `content` (used by the AI model)
  // Without this conversion, streamText throws a Zod validation error on `content`
  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
    }),
  });
}
