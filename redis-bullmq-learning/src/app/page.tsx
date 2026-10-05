"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================================================
  // 1. TRIGGER THE JOB (PRODUCER)
  // ==========================================================================
  const generateReport = async () => {
    setIsLoading(true);
    setResult(null);
    setStatus("Submitting to queue...");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Analyze market trends for AI." }),
      });
      const data = await res.json();

      // Save the ID in state so our polling logic knows what to check
      setJobId(data.jobId);
      setStatus("Job queued. Waiting for worker...");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setStatus("Failed to queue job.");
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // 2. POLL FOR STATUS (CONSUMER)
  // ==========================================================================
  // Whenever `jobId` exists and the job isn't done, we hit the GET API every 2s.
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();

        if (data.state === "completed") {
          setStatus("Completed!");
          setResult(data.result);
          setIsLoading(false);
          setJobId(null); // Stop polling
          clearInterval(interval);
        } else if (data.state === "failed") {
          setStatus(`Failed: ${data.error}`);
          setIsLoading(false);
          setJobId(null); // Stop polling
          clearInterval(interval);
        } else {
          setStatus(`Status: ${data.state}...`);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [jobId]);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-12 font-sans flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold mb-4 text-blue-400">
          Background AI Worker Demo
        </h1>

        <p className="text-gray-300 mb-8 leading-relaxed">
          This UI demonstrates decoupling Next.js from heavy AI tasks. Clicking
          the button enqueues a job in Redis, and a separate Node.js worker
          processes it. We then poll the Next.js API to check if it is done.
        </p>

        <button
          onClick={generateReport}
          className="w-full py-4 rounded-lg font-bold text-lg transition-all bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)"
        >
          Generate Heavy Report
        </button>

        {status && (
          <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <p className="text-sm font-mono text-gray-400">Current Status:</p>
            <p className="text-lg text-yellow-400 font-semibold mt-1">
              {status}
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-green-900/30 rounded-lg border border-green-700/50">
            <h2 className="text-xl font-bold text-green-400 mb-2">
              Final AI Response:
            </h2>
            <pre className="whitespace-pre-wrap text-green-200 font-mono text-sm bg-green-950 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
