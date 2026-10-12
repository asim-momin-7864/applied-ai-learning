"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Single fixed chat ID used for the default persistent session
const DEFAULT_CHAT_ID = "00000000-0000-0000-0000-000000000001";

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolsUsed?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load existing chat history from Supabase on mount
  useEffect(() => {
    let ignore = false;

    async function initChat() {
      try {
        // Ensure the default chat record exists in the chats table
        await supabase.from("chats").upsert({ id: DEFAULT_CHAT_ID });

        // Fetch all previous messages for this default chat
        const { data, error: fetchError } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", DEFAULT_CHAT_ID)
          .order("created_at", { ascending: true });

        if (ignore) return;

        if (fetchError) {
          console.warn("Supabase fetch notice:", fetchError.message);
          return;
        }

        if (data) {
          setMessages(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Error loading chat history:", err);
        }
      }
    }

    initChat();

    return () => {
      ignore = true;
    };
  }, []);

  // Send message to the LangGraph ReAct backend
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // 1. Optimistically display user message
    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // 2. Call the backend API route with default chat_id
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: DEFAULT_CHAT_ID,
          message: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response from agent.");
      }

      // 3. Append assistant response with tools used
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        toolsUsed: data.toolsUsed || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground max-w-3xl mx-auto">
      {/* Minimal Header */}
      <header className="border-b border-border py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">LangGraph ReAct Agent</h1>
          <p className="text-xs text-muted-foreground">
            Tools:{" "}
            <ul className="list-disc">
              <li>Tavily Search</li>
              <li>Jina Web Scraper</li>
              <li>Feature - Supabase Memory</li>
            </ul>
          </p>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs px-6 py-2 flex justify-between items-center border-b border-destructive/20">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Message List */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="py-24 text-center space-y-2">
              <p className="text-sm font-medium">No messages yet</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  {msg.role === "user" ? "You" : "Agent"}
                </span>

                {/* Message bubble */}
                <div
                  className={`rounded-lg px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border border-border text-foreground"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Tool Badges */}
                {msg.role === "assistant" &&
                  msg.toolsUsed &&
                  msg.toolsUsed.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground border border-border px-2 py-0.5 rounded"
                        >
                          <span>🔧 Used tool:</span>
                          <strong>{tool}</strong>
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                Agent
              </span>
              <div className="rounded-lg px-4 py-2.5 text-sm bg-muted border border-border text-muted-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-ping" />
                <span>Thinking & executing tools...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Bar */}
      <footer className="border-t border-border p-4 bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? "Running..." : "Send"}
          </Button>
        </form>
      </footer>
    </div>
  );
}
