import { VertexAI } from "@google-cloud/vertexai";
import type { GoogleAuthOptions } from "google-auth-library";

let vertexAI: VertexAI | null = null;

export function getVertexAI(): VertexAI {
  if (!vertexAI) {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.VERTEX_AI_LOCATION ?? "us-central1";

    if (!projectId) {
      throw new Error("GCP_PROJECT_ID environment variable is required");
    }

    // On Vercel: parse JSON credentials from env var
    // Locally: falls back to GOOGLE_APPLICATION_CREDENTIALS file path
    const googleAuthOptions: GoogleAuthOptions = {};
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      googleAuthOptions.credentials = JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      );
    }

    vertexAI = new VertexAI({ project: projectId, location, googleAuthOptions });
  }
  return vertexAI;
}

export function getGenerativeModel(modelId = "gemini-2.5-flash") {
  const vertex = getVertexAI();
  return vertex.getGenerativeModel({ model: modelId });
}
