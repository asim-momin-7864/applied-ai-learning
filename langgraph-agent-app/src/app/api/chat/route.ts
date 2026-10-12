import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// 1. LANGCHAIN & LANGGRAPH IMPORTS
// ---------------------------------------------------------------------------
// MessagesAnnotation: Pre-built LangGraph state definition with a "messages" array.
// StateGraph: The core LangGraph class to construct workflow graphs.
// START & END: Special graph boundary nodes.
import {
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";

// ToolNode: A pre-built LangGraph node that automatically executes tool calls.
// toolsCondition: A pre-built conditional edge router that checks if the model called tools.
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

// LangChain tool definition helper and validation schema
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Base message classes used by LangChain
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
  isAIMessage,
} from "@langchain/core/messages";

// LLM Providers: ChatGroq (ultra-fast inference) and ChatGoogleGenerativeAI (Gemini)
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ---------------------------------------------------------------------------
// 2. DEFINE THE AI TOOLS
// ---------------------------------------------------------------------------

/**
 * TOOL 1: Tavily Internet Search Tool
 *
 * How it works:
 * - Tavily is a search engine optimized for AI agents and LLMs.
 * - If TAVILY_API_KEY is present, we query Tavily for live search results.
 * - If TAVILY_API_KEY is missing, we return a graceful fallback string so
 *   the agent knows search is disabled without throwing an unhandled error.
 */
const tavilySearchTool = tool(
  async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return (
        "Notice: TAVILY_API_KEY is not configured in .env.local. " +
        "Please provide an API key if you need live web search."
      );
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 3,
          search_depth: "basic",
        }),
      });

      if (!response.ok) {
        return `Tavily Search API error: ${response.status} ${response.statusText}`;
      }

      const data = await response.json();
      return JSON.stringify(data.results);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return `Search failed with error: ${errorMsg}`;
    }
  },
  {
    name: "tavily_search",
    description:
      "Search the internet for current events, fresh information, news, and factual queries.",
    schema: z.object({
      query: z.string().describe("The search term or question to search the web for"),
    }),
  }
);

/**
 * TOOL 2: Custom Web Scraper Tool using Jina Reader (https://r.jina.ai/)
 *
 * How it works:
 * - Uses the native fetch() API without any API keys.
 * - Prefixing any web URL with https://r.jina.ai/ reads the web page and returns
 *   clean, LLM-friendly Markdown directly.
 */
const webScraperTool = tool(
  async ({ url }) => {
    try {
      // Normalize URL if user or model omitted protocol
      let targetUrl = url.trim();
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = `https://${targetUrl}`;
      }

      // Fetch markdown representation from Jina Reader
      const response = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: {
          Accept: "text/plain",
        },
      });

      if (!response.ok) {
        return `Failed to scrape ${targetUrl}: HTTP ${response.status} ${response.statusText}`;
      }

      const markdown = await response.text();
      // Cap length to prevent overflowing LLM token context limits
      return markdown.slice(0, 8000);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return `Scraping error: ${errorMsg}`;
    }
  },
  {
    name: "web_scraper",
    description:
      "Scrapes and reads the text content of any website URL, returning clean Markdown.",
    schema: z.object({
      url: z.string().describe("The URL of the webpage to scrape and extract text from"),
    }),
  }
);

// Collect all tools in an array
const tools = [tavilySearchTool, webScraperTool];

// ---------------------------------------------------------------------------
// 3. INITIALIZE THE LLM MODEL WITH TOOLS BOUND
// ---------------------------------------------------------------------------
/**
 * Model Selection:
 * We check for GROQ_API_KEY first (Llama-3.3-70b-versatile via Groq).
 * If not present, we check for GOOGLE_API_KEY / GEMINI_API_KEY (Gemini 1.5 Flash).
 */
function getLanguageModel() {
  if (process.env.GROQ_API_KEY) {
    return new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });
  }

  const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-1.5-flash",
      temperature: 0,
    });
  }

  // Fallback default (ChatGroq with empty key, will alert on call if not configured)
  return new ChatGroq({
    apiKey: "placeholder",
    model: "llama-3.3-70b-versatile",
    temperature: 0,
  });
}

// Bind tools to the model: This informs the LLM of tool signatures so it can
// decide whether to generate text or invoke a tool call.
const model = getLanguageModel();
const modelWithTools = model.bindTools(tools);

// ---------------------------------------------------------------------------
// 4. DEFINE THE LANGGRAPH AGENT WORKFLOW (ReAct LOOP)
// ---------------------------------------------------------------------------

/**
 * STEP 4.1: Agent Node
 *
 * In a ReAct graph, the Agent Node calls the LLM with the accumulated messages.
 * The LLM returns an AIMessage that either contains a final answer OR
 * one or more tool_calls to execute.
 */
async function callAgent(state: typeof MessagesAnnotation.State) {
  const response = await modelWithTools.invoke(state.messages);
  // Return the new AIMessage to be appended to the state's message list
  return { messages: [response] };
}

/**
 * STEP 4.2: Tool Node
 *
 * LangGraph provides ToolNode, which inspects the latest message in the state.
 * If the message has `tool_calls`, ToolNode automatically invokes the matching
 * tool function and appends a `ToolMessage` with the tool result.
 */
const toolNode = new ToolNode(tools);

/**
 * STEP 4.3: Graph Assembly & Routing
 *
 * The ReAct Loop:
 *   [START] -> [agent] -> (Condition: Did agent call a tool?)
 *                             |-- YES --> [tools] -> (Loop back to [agent])
 *                             |-- NO  --> [END]
 */
const workflow = new StateGraph(MessagesAnnotation)
  // 1. Register our nodes
  .addNode("agent", callAgent)
  .addNode("tools", toolNode)

  // 2. Define standard flow starting at the Agent node
  .addEdge(START, "agent")

  // 3. Conditional Edge:
  // `toolsCondition` checks if the last AIMessage has tool_calls.
  // - If it has tool calls, it routes to the "tools" node.
  // - If it has no tool calls, it routes to END.
  .addConditionalEdges("agent", toolsCondition)

  // 4. Loop Edge:
  // After tools execute, route control BACK to the agent so the model
  // can review the tool results and either answer or call another tool.
  .addEdge("tools", "agent");

/**
 * STEP 4.4: Graph Compilation
 *
 * Compiling freezes the graph architecture into an executable Runnable application.
 */
const app = workflow.compile();

// ---------------------------------------------------------------------------
// 5. NEXT.JS APP ROUTER POST HANDLER (/api/chat)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chat_id, message } = body;

    // Validation
    if (!chat_id || !message) {
      return NextResponse.json(
        { error: "Both 'chat_id' and 'message' are required in request body." },
        { status: 400 }
      );
    }

    // Check environment key
    const hasKeys =
      Boolean(process.env.GROQ_API_KEY) ||
      Boolean(process.env.GOOGLE_API_KEY) ||
      Boolean(process.env.GEMINI_API_KEY);

    if (!hasKeys) {
      return NextResponse.json(
        {
          error:
            "No LLM API Key detected. Please set GROQ_API_KEY or GOOGLE_API_KEY in your .env.local file.",
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // STEP 5.1: Save new User message to Supabase
    // -------------------------------------------------------------------------
    const { error: insertUserError } = await supabase.from("messages").insert({
      chat_id,
      role: "user",
      content: message,
    });

    if (insertUserError) {
      console.error("Supabase insert error:", insertUserError);
      return NextResponse.json(
        {
          error: `Failed to save message to Supabase: ${insertUserError.message}. Make sure Supabase tables are created.`,
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // STEP 5.2: Fetch complete chat history for this chat_id from Supabase
    // -------------------------------------------------------------------------
    const { data: dbMessages, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch chat history: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------------------
    // STEP 5.3: Convert Supabase records into LangChain Message instances
    // -------------------------------------------------------------------------
    const langchainMessages: BaseMessage[] = [];

    // System prompt guiding tool usage
    langchainMessages.push(
      new SystemMessage(
        "You are an expert AI assistant with access to web tools. " +
          "If the user asks for real-time information or URLs, use 'tavily_search' or 'web_scraper'. " +
          "Always provide concise, helpful, and markdown-formatted answers."
      )
    );

    for (const msg of dbMessages || []) {
      if (msg.role === "user") {
        langchainMessages.push(new HumanMessage(msg.content));
      } else if (msg.role === "assistant") {
        langchainMessages.push(new AIMessage(msg.content));
      }
    }

    // -------------------------------------------------------------------------
    // STEP 5.4: Execute the LangGraph ReAct Workflow
    // -------------------------------------------------------------------------
    const finalState = await app.invoke({
      messages: langchainMessages,
    });

    // -------------------------------------------------------------------------
    // STEP 5.5: Extract Final Response & Tools Used
    // -------------------------------------------------------------------------
    const messages = finalState.messages;
    const lastMessage = messages[messages.length - 1];

    let reply = "";
    if (typeof lastMessage.content === "string") {
      reply = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      reply = lastMessage.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (typeof part === "object" && part !== null && "text" in part) {
            return String((part as { text?: unknown }).text ?? "");
          }
          return "";
        })
        .join("\n");
    }

    // Detect which tools were called during this run
    const toolsUsed: string[] = [];
    for (const msg of messages) {
      // Check if message requested tool calls
      if (isAIMessage(msg) && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          const toolName = tc.name;
          if (toolName && !toolsUsed.includes(toolName)) {
            toolsUsed.push(toolName);
          }
        }
      }
    }

    // Format human-friendly names (e.g. "Tavily Search", "Web Scraper")
    const friendlyToolNames = toolsUsed.map((name) => {
      if (name.includes("tavily")) return "Tavily Internet Search";
      if (name.includes("scraper")) return "Web Scraper (Jina Reader)";
      return name;
    });

    // -------------------------------------------------------------------------
    // STEP 5.6: Save the Agent's Final Response to Supabase
    // -------------------------------------------------------------------------
    const { error: insertAssistantError } = await supabase
      .from("messages")
      .insert({
        chat_id,
        role: "assistant",
        content: reply,
      });

    if (insertAssistantError) {
      console.warn(
        "Could not save assistant response to Supabase:",
        insertAssistantError.message
      );
    }

    // -------------------------------------------------------------------------
    // STEP 5.7: Return the response and tool metadata to frontend
    // -------------------------------------------------------------------------
    return NextResponse.json({
      reply,
      toolsUsed: friendlyToolNames,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "An unexpected error occurred in the agent.";
    console.error("API route error:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
