//* tool for tavily
import { TavilySearch } from "@langchain/tavily";

export const tavilySearchTool = new TavilySearch({
  maxResults: 3,
  // You can set other constructor parameters here, e.g.:
  // topic: "general",
  // includeAnswer: false,
  // includeRawContent: false,
  // includeImages: false,
  // searchDepth: "basic",
});

// all agent tools array
export const tools = [tavilySearchTool];
