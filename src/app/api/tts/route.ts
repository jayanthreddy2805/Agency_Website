import { NextRequest } from "next/server";

// ElevenLabs removed — free tier blocks library voices.
// VoiceAEL uses browser Web Speech API instead (built into Chrome, free, works great).
// This route returns fallback instantly so VoiceAEL falls back to browser TTS.
export async function POST(req: NextRequest) {
  return Response.json({ fallback: true });
}