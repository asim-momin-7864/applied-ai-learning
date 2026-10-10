//* route for ingestion pipeline

import { embedMany } from "ai";
import { ollama, supabase } from "@/lib/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { NextRequest } from "next/server";

//
export async function POST(req: NextRequest) {
  const { subject, body } = await req.json();

  // initialize text splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  // chunking - chunks array
  const chunksArray = await splitter.splitText(body);

  // generate 768-dimention vector per chunk
  const { embeddings } = await embedMany({
    model: ollama.embeddingModel("nomic-embed-text:v1.5"),
    values: chunksArray,
  });

  // map embeddigs with chunks - making object like our row in sql table to insert
  const rows = chunksArray.map((chunk, idx) => ({
    subject: subject, // as one email - subject will be same for all 1 emails chunks
    content: chunk,
    embedding: embeddings[idx],
  }));

  // insert
  const { error } = await supabase.from("emails").insert(rows);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    { success: true, chunksInserted: rows.length },
    { status: 200 },
  );
}
