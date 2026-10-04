"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground max-w-2xl mx-auto p-4 md:p-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">AI Chat</h1>
        <p className="text-sm text-muted-foreground">Minimal chat interface</p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto mb-24 pb-4">
        {messages.length === 0 && status !== "submitted" && status !== "streaming" && (
          <div className="text-center text-muted-foreground mt-20">
            Send a message to start chatting.
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {message.role === "user" ? "You" : "AI"}
              </span>
            </div>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm shadow-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground border rounded-tl-sm"
              }`}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return <span key={`${message.id}-${i}`}>{part.text}</span>;
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl max-w-[85%] bg-muted text-foreground border rounded-tl-sm text-sm shadow-sm flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary/40 animate-pulse" />
              <div className="size-2 rounded-full bg-primary/60 animate-pulse delay-150" />
              <div className="size-2 rounded-full bg-primary/80 animate-pulse delay-300" />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4">
        <form
          className="max-w-2xl mx-auto flex gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput("");
          }}
        >
          <div className="flex-1 relative">
            <input
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-all"
              value={input}
              placeholder="Message AI..."
              onChange={(e) => setInput(e.currentTarget.value)}
              disabled={status === "streaming" || status === "submitted"}
            />
          </div>
          <Button 
            type="submit" 
            size="lg"
            className="rounded-xl h-12 px-6 shadow-sm"
            disabled={status === "streaming" || status === "submitted" || !input.trim()}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
