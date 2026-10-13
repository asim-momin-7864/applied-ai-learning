//* model selection logic
import { ChatGoogle } from "@langchain/google";
import { Ollama } from "@langchain/ollama";

// const llm = new Ollama({
//   model: "llama3", // Default value
//   temperature: 0,
//   maxRetries: 2,
//   // other params...
// });

// const llm = new ChatGoogle({
//   model: "gemini-3.7-flash",
//   maxRetries: 2,
//   // apiKey: "...", // Optional if GOOGLE_API_KEY is set
// });

// const llm = new ChatGoogle({
//   model: "gemini-3.7-flash",
//   platformType: "gcp",
//   credentials: {
//     type: "service_account",
//     project_id: "your-project-id",
//     private_key_id: "your-private-key-id",
//     private_key: "your-private-key",
//     client_email: "your-service-account-email",
//     client_id: "your-client-id",
//     auth_uri: "https://accounts.google.com/o/oauth2/auth",
//     token_uri: "https://oauth2.googleapis.com/token",
//     auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//     client_x509_cert_url: "your-cert-url",
//   },
// });

// function to select model

export function createModel() {
  if (process.env.PROVIDER === "gemini") {
    return new ChatGoogle({
      model: process.env.GEMINI_MODEL as string,
      apiKey: process.env.GOOGLE_API_KEY as string,
    });
  } else {
    return new Ollama({
      model: process.env.OLLAMA_MODEL as string,
      baseUrl: process.env.OLLAMA_BASE_URL as string,
      temperature: 0,
      maxRetries: 2,
    });
  }
}
