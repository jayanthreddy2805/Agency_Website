import { NextRequest } from "next/server";

// Gemini doesn't have STT — we use Web Speech API in the browser (free, built into Chrome)
// This route is kept as a passthrough that returns empty so VoiceAEL falls back to browser STT
export async function POST(req: NextRequest) {
  return Response.json({ transcript: "", error: "Use browser Web Speech API" });
}