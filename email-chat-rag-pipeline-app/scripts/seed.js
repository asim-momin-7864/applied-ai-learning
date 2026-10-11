import fs from "fs";
import path from "path";

async function seed() {
  const filePath = path.join(__dirname, "..", "test-data.txt");
  if (!fs.existsSync(filePath)) {
    console.error("❌ test-data.txt not found!");
    process.exit(1);
  }

  const rawText = fs.readFileSync(filePath, "utf-8");
  const emailBlocks = rawText.split("--- EMAIL ").slice(1);

  console.log(
    `🚀 Found ${emailBlocks.length} emails in test-data.txt. Starting ingestion into http://localhost:3000/api/ingest...\n`,
  );

  let successCount = 0;

  for (const block of emailBlocks) {
    const subjectMatch = block.match(/SUBJECT:\s*(.+)/);
    const bodyMatch = block.match(/BODY:\s*([\s\S]+?)(?=\n\n---|\n\n====|$)/);

    if (!subjectMatch || !bodyMatch) continue;

    const subject = subjectMatch[1].trim();
    const body = bodyMatch[1].trim();

    try {
      const res = await fetch("http://localhost:3000/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      const json = await res.json();
      if (res.ok) {
        successCount++;
        console.log(
          `✅ [${successCount}/${emailBlocks.length}] Ingested: "${subject}" (${json.chunksInserted} chunks)`,
        );
      } else {
        console.error(`❌ Failed: "${subject}" - ${json.error}`);
      }
    } catch (err) {
      console.error(`❌ Network error for "${subject}":`, err.message);
      console.error(
        "   Make sure Next.js dev server is running on http://localhost:3000 (npm run dev)",
      );
      process.exit(1);
    }

    // Small delay between requests to keep local Ollama smooth
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  console.log(
    `\n🎉 Seeding complete! Successfully ingested ${successCount} emails.`,
  );
}

seed();
