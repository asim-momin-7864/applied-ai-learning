"use client";

import { useObject } from "@ai-sdk/react";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const feedbackSchema = z.object({
  sentiment: z.enum(["Positive", "Neutral", "Negative", "Mixed"]),
  summary: z.string().describe("A quick one-sentence summary"),
  urgentIssue: z
    .boolean()
    .describe(
      "True if the user is angry, threatening to cancel, or demanding a refund",
    ),
  keyThemes: z
    .array(z.string())
    .describe("3 to 5 short tags (e.g., 'UI/UX', 'Pricing')"),
  actionItems: z.array(
    z
      .object({
        department: z.enum(["Product", "Billing", "Sales", "Support"]),
        task: z.string(),
      })
      .describe("Task that internal teams need to do based on this feedback"),
  ),
});

export default function FeedbackAnalyzerPage() {
  const [input, setInput] = useState("");

  const { object, submit, isLoading } = useObject({
    api: "/api/ai/analyze",
    schema: feedbackSchema,
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground max-w-2xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-8 border-b pb-4 mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Feedback Analyzer</h1>
        <p className="text-sm text-muted-foreground">Extract structured insights from raw feedback</p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto mb-40 pb-4">
        {!object && !isLoading && (
          <div className="text-center text-muted-foreground mt-20">
            Submit a piece of customer feedback to see the analysis.
          </div>
        )}

        {object && (
          <div className="space-y-6 bg-muted/30 border rounded-2xl p-6 shadow-sm">
            {/* Sentiment & Urgency */}
            <div className="flex items-center gap-4 border-b pb-4">
              {object.sentiment && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Sentiment</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    object.sentiment === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    object.sentiment === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {object.sentiment}
                  </span>
                </div>
              )}
              
              {object.urgentIssue !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Urgent</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    object.urgentIssue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {object.urgentIssue ? "YES" : "NO"}
                  </span>
                </div>
              )}
            </div>

            {/* Summary */}
            {object.summary && (
              <div>
                <h3 className="text-sm font-medium mb-1">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {object.summary}
                </p>
              </div>
            )}

            {/* Key Themes */}
            {object.keyThemes && object.keyThemes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Key Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {object.keyThemes.map((theme, i) => (
                    <span key={i} className="px-3 py-1 bg-background border rounded-md text-xs font-medium shadow-sm">
                      #{theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {object.actionItems && object.actionItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 border-t pt-4">Action Items</h3>
                <ul className="space-y-3">
                  {object.actionItems.map((item, index) => (
                    <li key={index} className="flex gap-3 items-start bg-background p-3 rounded-xl border shadow-sm">
                      {item?.department && (
                        <span className="shrink-0 px-2 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider rounded-md">
                          {item.department}
                        </span>
                      )}
                      {item?.task && (
                        <span className="text-sm pt-0.5">{item.task}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isLoading && !object && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="flex gap-2">
              <div className="size-2 rounded-full bg-primary/40 animate-pulse" />
              <div className="size-2 rounded-full bg-primary/60 animate-pulse delay-150" />
              <div className="size-2 rounded-full bg-primary/80 animate-pulse delay-300" />
            </div>
            <p className="text-sm text-muted-foreground">Analyzing feedback...</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 pb-8 z-10">
        <form
          className="max-w-2xl mx-auto flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            submit({ feedbacks: input });
            setInput(""); // optionally clear, or keep it to see what was analyzed
          }}
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                className="flex min-h-[64px] max-h-[160px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-all resize-y"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste customer feedback here..."
                disabled={isLoading}
                rows={2}
              />
            </div>
            
            <Button 
              type="submit" 
              size="lg"
              className="rounded-2xl h-14 px-8 shadow-sm shrink-0 font-medium"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
