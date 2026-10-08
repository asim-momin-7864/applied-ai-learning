// // UI client component for image-file upload route
// // Uses the NEW useChat API (AI SDK v4+)
"use client";

//* without redis-bull-mq version

// import { useState, useRef } from "react";
// import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai";
// import { Button } from "@/components/ui/button";

// export default function ImageUploadPage() {
//   const { messages, sendMessage, status } = useChat({
//     transport: new DefaultChatTransport({
//       api: "/api/ai/image-file",
//     }),
//   });

//   const [inputText, setInputText] = useState("");
//   const [files, setFiles] = useState<FileList | null>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const isLoading = status === "streaming" || status === "submitted";

//   const onSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!inputText.trim() && !files?.length) return;

//     sendMessage({
//       text: inputText,
//       files: files ?? undefined,
//     });

//     setInputText("");
//     setFiles(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <div className="flex flex-col min-h-screen w-full bg-background text-foreground max-w-2xl mx-auto p-4 md:p-8">
//       <header className="mb-8 border-b pb-6 mt-4">
//         <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
//           Vision Chat
//         </h1>
//         <p className="text-sm text-muted-foreground mt-1">
//           Upload an image and ask questions
//         </p>
//       </header>

//       <div className="flex-1 space-y-6 overflow-y-auto mb-40 pb-4">
//         {messages.length === 0 &&
//           status !== "submitted" &&
//           status !== "streaming" && (
//             <div className="text-center text-muted-foreground mt-20">
//               Upload an image to get started.
//             </div>
//           )}

//         {messages.map((m) => (
//           <div
//             key={m.id}
//             className={`flex flex-col w-full ${
//               m.role === "user" ? "items-end" : "items-start"
//             }`}
//           >
//             <div className="flex items-center gap-2 mb-1">
//               <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                 {m.role === "user" ? "You" : "AI"}
//               </span>
//             </div>
//             <div
//               className={`px-4 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm shadow-sm ${
//                 m.role === "user"
//                   ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md ring-1 ring-primary/20"
//                   : "bg-background text-foreground border rounded-tl-sm"
//               }`}
//             >
//               {m.parts.map((part, i) => {
//                 switch (part.type) {
//                   case "text":
//                     return <div key={`${m.id}-text-${i}`}>{part.text}</div>;

//                   case "file":
//                     return part.mediaType.startsWith("image/") ? (
//                       <div
//                         key={`${m.id}-file-${i}`}
//                         className="mt-2 mb-1 overflow-hidden rounded-md border bg-background/50"
//                       >
//                         {/* eslint-disable-next-line @next/next/no-img-element */}
//                         <img
//                           src={part.url}
//                           alt={part.filename ?? "uploaded image"}
//                           className="max-h-60 w-auto object-contain"
//                         />
//                       </div>
//                     ) : (
//                       <div
//                         key={`${m.id}-file-${i}`}
//                         className="mt-2 flex items-center gap-2 p-2 rounded-md bg-background/50 border text-xs"
//                       >
//                         📎 <span>{part.filename ?? "file"}</span>
//                         <span className="text-muted-foreground">
//                           ({part.mediaType})
//                         </span>
//                       </div>
//                     );

//                   default:
//                     return null;
//                 }
//               })}
//             </div>
//           </div>
//         ))}

//         {status === "submitted" && (
//           <div className="flex flex-col w-full items-start">
//             <div className="flex items-center gap-2 mb-1">
//               <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                 AI
//               </span>
//             </div>
//             <div className="px-4 py-3 rounded-2xl max-w-[85%] bg-background text-foreground border rounded-tl-sm text-sm shadow-sm flex items-center gap-2">
//               <div className="size-2 rounded-full bg-primary/40 animate-pulse" />
//               <div className="size-2 rounded-full bg-primary/60 animate-pulse delay-150" />
//               <div className="size-2 rounded-full bg-primary/80 animate-pulse delay-300" />
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 pb-8 z-10">
//         <form
//           className="max-w-2xl mx-auto flex flex-col gap-3"
//           onSubmit={onSubmit}
//         >
//           {files && files.length > 0 && (
//             <div className="flex items-center gap-2 px-1">
//               <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
//                 1 file selected
//               </span>
//             </div>
//           )}

//           <div className="flex gap-2 items-end">
//             <div className="flex-1 relative flex items-center bg-background/50 border border-input rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all focus-within:bg-background">
//               <label
//                 htmlFor="file-upload"
//                 className={`cursor-pointer p-3 text-muted-foreground hover:text-foreground transition-colors ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
//                 title="Attach image"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   width="20"
//                   height="20"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
//                 </svg>
//                 <input
//                   id="file-upload"
//                   type="file"
//                   className="hidden"
//                   accept="image/*,application/pdf"
//                   ref={fileInputRef}
//                   onChange={(e) => setFiles(e.target.files)}
//                   disabled={isLoading}
//                 />
//               </label>

//               <input
//                 className="flex h-14 w-full bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
//                 value={inputText}
//                 onChange={(e) => setInputText(e.target.value)}
//                 placeholder="Ask a question about the image..."
//                 disabled={isLoading}
//               />
//             </div>

//             <Button
//               type="submit"
//               size="lg"
//               className="rounded-2xl h-14 px-8 shadow-sm shrink-0 font-medium transition-all hover:shadow-md"
//               disabled={isLoading || (!inputText.trim() && !files?.length)}
//             >
//               {isLoading ? "Sending..." : "Send"}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

//* latest with redis - bullmq version

import { useState, useEffect } from "react";
import { JobItem } from "@/lib/types";

const ImageChatPage = () => {
  // user states
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);

  // submit handler - submit single job and free use
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    // validation
    if (!imageUrl || !prompt) return;

    // take snapshot, so we can free user for next upload
    const currentImageUrl = imageUrl;
    const currentPrompt = prompt;

    // clear inputs
    setImageUrl("");
    setPrompt("");

    // send back to backend API router
    const res = await fetch("/api/ai/image-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: currentImageUrl, //* like this cleary declare fields of data u need, to u clearly write and get in workers file and in processing
        prompt: currentPrompt, //! do not directly send whole data like , data : res.body
      }),
    });

    const { jobId } = await res.json();

    // add new job card with "pending"
    setJobs((prev) => [
      {
        id: jobId,
        imageUrl: currentImageUrl, // these fileds accoridng to what you want to show on frontend and where u want to store results and data
        prompt: currentPrompt,
        state: "pending",
      },
      ...prev,
    ]);
  };

  // fetch jobs status
  useEffect(() => {
    // pending job
    const pendingJob = jobs.filter((job) => job.state == "pending");

    // check if no job then dont fetch
    if (pendingJob.length === 0) return;

    const intervalId = setInterval(async () => {
      // ids query, join all ids
      const idsQuery = pendingJob.map((j) => j.id).join(",");
      try {
        const res = await fetch(`/api/ai/image-chat?ids=${idsQuery}`);
        if (!res.ok) throw new Error("Failed to fetch status");
        
        const jobStateResultMap = await res.json();

      setJobs((prev) =>
        prev.map((j) => {
          // if got matching job id
          if (jobStateResultMap[j.id]) {
            return {
              ...j,
              state: jobStateResultMap[j.id].state,
              result: jobStateResultMap[j.id]?.result || "",
            };
          } else {
            // if job is not done , and dont found is
            return j;
          }
        }),
      );
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000); // we check on every 3 secs

    // after work done clearn
    return () => clearInterval(intervalId);
  }, [jobs]);

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 font-sans text-gray-900">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Image Analysis Tasks</h1>
      
      <form 
        className="flex flex-col gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm mb-12"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Image URL</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            type="url"
            value={imageUrl}
            placeholder="https://example.com/image.jpg"
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Prompt (Optional)</label>
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            type="text"
            value={prompt}
            placeholder="Describe this image in detail..."
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-2"
          type="submit"
        >
          Submit Task
        </button>
      </form>

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold border-b pb-2">Recent Tasks</h2>
        
        {jobs.length === 0 && (
          <p className="text-gray-500 italic text-center py-8">No tasks submitted yet. Submit an image above!</p>
        )}
        
        {jobs.map((job) => (
          <div key={job.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row bg-white transition-all hover:shadow-md">
            <div className="sm:w-1/3 bg-gray-100 flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={job.imageUrl} 
                alt="Task" 
                className="max-h-48 object-contain rounded-md shadow-sm" 
              />
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">ID: {job.id}</span>
                
                {job.state === "pending" && (
                  <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full animate-pulse">Processing...</span>
                )}
                {job.state === "completed" && (
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>
                )}
                {job.state === "failed" && (
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Failed</span>
                )}
              </div>
              
              <p className="font-medium text-gray-800 mb-4">&quot;{job.prompt || "Describe this image"}&quot;</p>
              
              <div className="mt-auto bg-gray-50 rounded-lg p-4 text-sm border border-gray-100 min-h-20 flex flex-col justify-center">
                {job.state === "pending" && (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-full animate-pulse origin-left"></div>
                    </div>
                    <span className="text-gray-500 text-xs text-center">AI is analyzing your image...</span>
                  </div>
                )}
                
                {job.state === "completed" && (
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{job.result}</p>
                )}
                
                {job.state === "failed" && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Task failed to process.</span>
                    <button 
                      onClick={() => {
                         setImageUrl(job.imageUrl);
                         setPrompt(job.prompt);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md font-semibold transition-colors"
                    >
                      Load into Form
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageChatPage;
