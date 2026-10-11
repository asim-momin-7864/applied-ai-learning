"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendIcon, Bot, User } from "lucide-react";

export default function ChatUI() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-8 flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      <Card className="flex-1 flex flex-col shadow-lg border-muted/50 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Email Assistant
          </CardTitle>
        </CardHeader>

        {/* Messages list */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            <div className="flex flex-col gap-4 pb-4">
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-8 text-sm">
                  Ask me anything about your emails!
                </div>
              )}

              {/* Each chat message */}
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isUser ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-3 rounded-xl text-sm ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm border"
                      }`}
                    >
                      {/* Render only text parts */}
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part, i) => (
                          <span
                            key={i}
                            className="whitespace-pre-wrap leading-relaxed"
                          >
                            {(part as { type: "text"; text: string }).text}
                          </span>
                        ))}
                    </div>
                  </div>
                );
              })}

              {/* Thinking indicator while streaming */}
              {(status === "submitted" || status === "streaming") && (
                <div className="flex items-start gap-3 mr-auto">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="p-3 rounded-xl bg-muted rounded-tl-sm border text-sm text-muted-foreground">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input form */}
        <CardFooter className="p-4 border-t bg-background mt-auto">
          <form
            className="flex w-full gap-2 items-center"
            onSubmit={handleSubmit}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== "ready"}
              placeholder="Ask a question about your ingested emails..."
              className="flex-1 focus-visible:ring-primary/50"
              autoFocus
            />
            <Button
              type="submit"
              disabled={status !== "ready"}
              size="icon"
              className="shrink-0"
            >
              <SendIcon className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
