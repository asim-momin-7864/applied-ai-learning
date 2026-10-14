//* graph study
import {
  END,
  START,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";

import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { createModel } from "./model";
import { tools } from "./tools";

// graph state
export const State = MessagesAnnotation;

// agent node
async function agentNode(state: typeof State.State) {
  // binding tool to model
  const llm = createModel().bindTools(tools);

  // send all current message to model
  const response = await llm.invoke(state.messages);

  // return model response to state
  return {
    messages: [response],
  };
}

// tool node
const toolNode = new ToolNode(tools);

//* graph
export const graph = new StateGraph(State)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition, ["tools", END])
  .addEdge("tools", "agent")
  .compile();
