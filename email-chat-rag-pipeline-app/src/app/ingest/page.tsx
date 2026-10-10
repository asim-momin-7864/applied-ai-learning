"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function IngestPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  async function handleIngest(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    
    setIsIngesting(true);
    setStatus({ type: 'loading', message: "Processing and vectorizing email..." });

    try {
      const res = await fetch(`/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error ingesting email");

      setStatus({ type: 'success', message: `Successfully stored ${data.chunksInserted} chunks into the vector database.` });
      setSubject("");
      setBody("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error occurred";
      setStatus({ type: 'error', message: msg });
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8 flex-1">
      <Card className="shadow-lg border-muted/50 mt-8">
        <CardHeader className="bg-muted/30 border-b pb-6">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Ingest New Email
          </CardTitle>
          <CardDescription className="text-sm">
            Add an email to the vector database to make it searchable by the AI assistant.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleIngest}>
          <CardContent className="space-y-6 pt-6">
            
            {status.type && (
              <Alert variant={status.type === 'error' ? "destructive" : "default"} 
                     className={status.type === 'success' ? "border-green-500/50 text-green-700 bg-green-500/10 dark:text-green-400" : ""}>
                {status.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
                {status.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                <AlertTitle className="mb-1">
                  {status.type === 'loading' && "Ingesting"}
                  {status.type === 'error' && "Error"}
                  {status.type === 'success' && "Success"}
                </AlertTitle>
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Subject
              </label>
              <Input
                id="subject"
                placeholder="e.g. Q3 Roadmap Planning"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isIngesting}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Content
              </label>
              <Textarea
                id="content"
                placeholder="Paste the full email body here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isIngesting}
                required
                className="min-h-[250px] resize-y"
              />
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 border-t p-6">
            <Button type="submit" className="w-full sm:w-auto ml-auto" disabled={isIngesting}>
              {isIngesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Save to Vector DB
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
