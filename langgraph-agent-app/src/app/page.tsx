"use client";

import type { StoredMessagesType } from "@/lib/chat-history";
import { SyntheticEvent, useEffect, useState } from "react";

export default function Home() {
  // states
  const [messages, setMessages] = useState<StoredMessagesType[]>([]); // for disaplay messages UI
  const [input, setInput] = useState(""); // for user input
  const [isStreaming, setIsStreaming] = useState(false); // for streaming loading state
  // fetching first time
  useEffect(() => {
    async function loadMessage() {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();

        if (!res.ok) {
          console.error(data.error);
          return;
        }

        setMessages(data.messages ?? []);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    }
    loadMessage();
  }, []);

  // handle submit
  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();

    //
    if (!input.trim() || isStreaming) {
      return;
    }

    // const
    const userText = input.trim();
    setInput(""); // free user

    // show immidatly prompt
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userText,
      },
    ]);

    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
        }),
      });

      //
      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        throw new Error(data.error || "Failed to send message");
      }

      // add ai answer to messages for UI
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Something went wrong!",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-2/3 flex-col p-6">
      <h1 className="text-xl font-semibold">LangGraph Learning Agent</h1>

      <p className="mb-6 text-sm text-gray-500">
        One chat · Tavily search · Ollama or Gemini
      </p>

      <section className="flex-1 space-y-4 rounded border bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">Ask a question to begin.</p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`w-2/3 rounded p-2  ${message.role === "user" ? "bg-gray-100 ml-auto" : "bg-gray-200 mb-2"}`}
          >
            <p className="text-xs font-semibold uppercase text-gray-500">
              {message.role}
            </p>

            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
        ))}

        {isStreaming && (
          <p className="text-sm text-gray-400">Agent is thinking...</p>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex items-start justify-start gap-2 h-50"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask something..."
          className="flex-1 rounded border px-3 py-2 text-sm"
        />

        <button
          type="submit"
          disabled={isStreaming}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
