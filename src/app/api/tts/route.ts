import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text?.trim()) return Response.json({ fallback: true });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ fallback: true });

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  // Try models in order — flash first (fastest), turbo as fallback
  const models = ["eleven_turbo_v2_5", "eleven_turbo_v2", "eleven_monolingual_v1"];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
            "Accept": "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: model,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error(`ElevenLabs ${model} error:`, err);
        continue; // try next model
      }

      const audioBuffer = await response.arrayBuffer();
      if (audioBuffer.byteLength === 0) {
        console.error(`ElevenLabs ${model} returned empty audio`);
        continue;
      }

      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-cache",
        },
      });
    } catch (e) {
      console.error(`ElevenLabs ${model} exception:`, e);
      continue;
    }
  }

  // All models failed — return fallback signal
  return Response.json({ fallback: true });
}