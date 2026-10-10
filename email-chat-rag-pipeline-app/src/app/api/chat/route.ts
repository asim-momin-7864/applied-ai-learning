//* chat route for Retrieval + RAG generation

import {
  streamText,
  embed,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { ollama, supabase } from "@/lib/config";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // UIMessage uses parts[], NOT .content — extract the latest user text
  const latestMessage = messages[messages.length - 1];
  const latestText = latestMessage.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");

  // embed the users query
  const { embedding } = await embed({
    model: ollama.embeddingModel("nomic-embed-text:v1.5"),
    value: latestText,
  });

  // SQL similarity function supabase RPC
  const { data: matchedEmails, error } = await supabase.rpc("match_emails", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 4,
  });

  // error
  if (error) throw new Error(error.message);

  // [prepare data / prompt with data] format retrieved database records to send to LLM
  const contexText =
    matchedEmails
      ?.map(
        (email: { subject: string; content: string }) =>
          `Subject: ${email.subject}\n Body: ${email.content}`,
      )
      .join("\n---\n") ||
    // OR if not get emails
    "No relevant emails found";

  // system prompt - to send final with context we make
  const systemPrompt = `
You are a helpful assistant searching through the user's emails.
Answer the user's question using ONLY the context provided below.
If the answer is not contained in the context, say "I can't find the answer in your emails." Do not make up information.

 CONTEXT:
 ${contexText}
`;

  // early return if no relevant emails found — skip LLM to avoid hanging
  if (!matchedEmails || matchedEmails.length === 0) {
    // Manually create a stream that yields the text delta to bypass the LLM entirely
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          type: "text-delta",
          textDelta:
            "I couldn't find any relevant emails for your question. Try rephrasing or ingest more emails.",
        });
        controller.close();
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: fallbackStream }),
    });
  }

  // convert UIMessage[] → ModelMessage[] before passing to the LLM
  const modelMessages = await convertToModelMessages(messages);

  // send prompt with data to LLM and get response
  const result = streamText({
    model: ollama("llama3.2:1b"),
    instructions: systemPrompt,
    messages: modelMessages,
  });

  // return UI message stream (required for useChat + DefaultChatTransport)
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        console.error("[chat/route] stream error:", error);
        return error instanceof Error ? error.message : String(error);
      },
    }),
  });
}
