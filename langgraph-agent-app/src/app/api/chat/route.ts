//* chat api

import { NextResponse } from "next/server";
import { graph } from "@/lib/agent/graph";

// our modules
import {
  convertToLangGraphMessages,
  getHistory,
  getTextFromLanggraphMessage,
} from "@/lib/chat-history";

import { SINGLE_CHAT_ID, supabase } from "@/lib/supabase";

// GET api/chat
export async function GET() {
  try {
    const messages = await getHistory();
    return NextResponse.json({
      messages,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Cloud not load chat history.",
      },
      {
        status: 500,
      },
    );
  }
}

// POST api/chat
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userMessage = body.message as string;

    //
    if (!userMessage.trim()) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        },
      );
    }

    // save the users message
    const { error: userError } = await supabase.from("messages").insert({
      chat_id: SINGLE_CHAT_ID,
      role: "user",
      content: userMessage.trim(),
    });

    // check
    if (userError) {
      throw userError;
    }

    // get history (so we get new inserted data too)
    const history = await getHistory();

    // convert DB raw data into langchain format
    const messages = convertToLangGraphMessages(history);

    // run langgraph
    const result = await graph.invoke({
      messages,
    });

    // read final message
    const lastMessage = result.messages[result.messages.length - 1];

    const answer = getTextFromLanggraphMessage(lastMessage);

    // save answer to DB
    const { error: assistantError } = await supabase.from("messages").insert({
      chat_id: SINGLE_CHAT_ID,
      role: "assistant",
      content: answer,
    });

    // error
    if (assistantError) {
      throw assistantError;
    }

    // res
    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error("API /api/chat error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "The agent could not complete the request.";
    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}
