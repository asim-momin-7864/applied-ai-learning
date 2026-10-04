// UI client component for image-file upload route
// Uses the NEW useChat API (AI SDK v4+)

"use client";

import { useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";

export default function ImageUploadPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/image-file",
    }),
  });

  const [inputText, setInputText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isLoading = status === "streaming" || status === "submitted";

  const onSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() && !files?.length) return;

    sendMessage({
      text: inputText,
      files: files ?? undefined,
    });

    setInputText("");
    setFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground max-w-2xl mx-auto p-4 md:p-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Vision Chat</h1>
        <p className="text-sm text-muted-foreground">Upload an image and ask questions</p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto mb-32 pb-4">
        {messages.length === 0 && status !== "submitted" && status !== "streaming" && (
          <div className="text-center text-muted-foreground mt-20">
            Upload an image to get started.
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {m.role === "user" ? "You" : "AI"}
              </span>
            </div>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm shadow-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground border rounded-tl-sm"
              }`}
            >
              {m.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return <div key={`${m.id}-text-${i}`}>{part.text}</div>;

                  case "file":
                    return part.mediaType.startsWith("image/") ? (
                      <div key={`${m.id}-file-${i}`} className="mt-2 mb-1 overflow-hidden rounded-md border bg-background/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={part.url}
                          alt={part.filename ?? "uploaded image"}
                          className="max-h-60 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div key={`${m.id}-file-${i}`} className="mt-2 flex items-center gap-2 p-2 rounded-md bg-background/50 border text-xs">
                        📎 <span>{part.filename ?? "file"}</span>
                        <span className="text-muted-foreground">({part.mediaType})</span>
                      </div>
                    );

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

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-10">
        <form
          className="max-w-2xl mx-auto flex flex-col gap-3"
          onSubmit={onSubmit}
        >
          {files && files.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                1 file selected
              </span>
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative flex items-center bg-background border border-input rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <label 
                htmlFor="file-upload" 
                className={`cursor-pointer p-3 text-muted-foreground hover:text-foreground transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                title="Attach image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  ref={fileInputRef}
                  onChange={(e) => setFiles(e.target.files)}
                  disabled={isLoading}
                />
              </label>
              
              <input
                className="flex h-12 w-full bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question about the image..."
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              size="lg"
              className="rounded-xl h-12 px-6 shadow-sm shrink-0"
              disabled={isLoading || (!inputText.trim() && !files?.length)}
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
