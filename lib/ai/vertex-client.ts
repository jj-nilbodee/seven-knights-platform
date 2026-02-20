import { VertexAI } from "@google-cloud/vertexai";

let vertexAI: VertexAI | null = null;

export function getVertexAI(): VertexAI {
  if (!vertexAI) {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.VERTEX_AI_LOCATION ?? "us-central1";

    if (!projectId) {
      throw new Error("GCP_PROJECT_ID environment variable is required");
    }

    vertexAI = new VertexAI({ project: projectId, location });
  }
  return vertexAI;
}

export function getGenerativeModel(modelId = "gemini-2.5-flash") {
  const vertex = getVertexAI();
  return vertex.getGenerativeModel({ model: modelId });
}
