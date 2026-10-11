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

  // Step 1: Get the latest user message text
  // UIMessage.parts is an array — find the text part and extract its text
  const lastMessage = messages[messages.length - 1];
  const userQuestion = lastMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join(" ");

  // Step 2: Embed the user question into a vector
  const { embedding } = await embed({
    model: ollama.embeddingModel("nomic-embed-text:v1.5"),
    value: userQuestion,
  });

  // Step 3: Search Supabase for similar emails using the vector
  const { data: matchedEmails, error } = await supabase.rpc("match_emails", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 4,
  });

  if (error) throw new Error(error.message);

  // Step 4: If no emails found, return a consistent polite fallback from the LLM
  if (!matchedEmails || matchedEmails.length === 0) {
    const fallbackResult = streamText({
      model: ollama.chat("llama3.2:1b"),
      instructions: `You are an assistant for searching user emails. No relevant emails or data were found in the database for the user's question. Reply ONLY with: "I couldn't find any relevant emails or data related to your question. Please try rephrasing your search or ingesting more emails."`,
      prompt: `Did you find any emails for: "${userQuestion}"?`,
      temperature: 0,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: fallbackResult.stream,
        onError: (err) => {
          console.error("[chat/route] fallback error:", err);
          return err instanceof Error ? err.message : String(err);
        },
      }),
    });
  }

  // Step 5: Format the matched emails into a readable context string
  const context = matchedEmails
    .map(
      (email: { subject: string; content: string }) =>
        `Subject: ${email.subject}\nBody: ${email.content}`,
    )
    .join("\n---\n");

  // Step 6: Build the system prompt with the email context
  const systemPrompt = `
You are a helpful assistant searching through the user's emails.
Answer the user's question using ONLY the context provided below.
If the answer is not in the context, say "I can't find the answer in your emails."

CONTEXT:
${context}
`;

  // Step 7: Convert UI messages to model messages format, then stream response
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: ollama.chat("llama3.2:1b"),
    instructions: systemPrompt,
    messages: modelMessages,
  });

  // Step 8: Return the streaming response
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (err) => {
        console.error("[chat/route] stream error:", err);
        return err instanceof Error ? err.message : String(err);
      },
    }),
  });
}
