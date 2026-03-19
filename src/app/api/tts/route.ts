import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text?.trim()) return Response.json({ fallback: true });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ fallback: true });

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  // eleven_turbo_v2 works on ALL tiers including free
  // eleven_multilingual_v2 as fallback
  const models = ["eleven_turbo_v2", "eleven_multilingual_v2", "eleven_monolingual_v1"];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: model,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error(`[TTS] ${model} failed ${response.status}:`, err);
        continue;
      }

      const audioBuffer = await response.arrayBuffer();
      if (audioBuffer.byteLength < 100) {
        console.error(`[TTS] ${model} returned empty audio`);
        continue;
      }

      console.log(`[TTS] ${model} success — ${audioBuffer.byteLength} bytes`);
      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-cache",
        },
      });
    } catch (e) {
      console.error(`[TTS] ${model} exception:`, e);
      continue;
    }
  }

  return Response.json({ fallback: true });
}