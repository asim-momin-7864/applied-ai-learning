//* chat history , data formating, text filteration module
import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { SINGLE_CHAT_ID, supabase } from "@/lib/supabase";

// type of Stored Messages
export type StoredMessagesType = {
  role: "user" | "assistant";
  content: string;
};

// load chat history from supabase function
export async function getHistory(): Promise<StoredMessagesType[]> {
  //
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", SINGLE_CHAT_ID)
    .order("created_at", {
      ascending: true,
    });

  // check
  if (error) {
    throw error;
  }

  return (data ?? []) as StoredMessagesType[];
}

// convert DB raw output into langgraph messages type function
export function convertToLangGraphMessages(
  history: StoredMessagesType[],
): BaseMessage[] {
  return history.map((m) => {
    if (m.role === "user") {
      return new HumanMessage(m.content);
    }

    return new AIMessage(m.content);
  });
}

// convert langgraph (output) into plain object (Filter text only data for UI) function
export function getTextFromLanggraphMessage(message: BaseMessage): string {
  // if simple text
  if (typeof message.content === "string") {
    return message.content;
  }

  // complex object multiple type of content)
  return message.content
    .map((part) => {
      // if string
      if (typeof part === "string") {
        return part;
      }

      // if text filed in object, then take only that
      if ("text" in part) {
        return part.text;
      }

      return "";
    })
    .join("");
}
