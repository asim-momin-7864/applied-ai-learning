"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          <span className="font-bold">
            {message.role === "user" ? "User: " : "AI: "}
          </span>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <span key={`${message.id}-${i}`}>{part.text}</span>;
            }
          })}
        </div>
      ))}

      {status === "submitted" && (
        <div className="whitespace-pre-wrap text-zinc-500">
          <span className="font-bold text-black dark:text-white">
            Google Gemini:{" "}
          </span>
          Model Thinking...
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
