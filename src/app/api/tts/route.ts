import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text?.trim()) return Response.json({ fallback: true, text });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ fallback: true, text });

  // eleven_flash_v2_5 = fastest ElevenLabs model, <75ms latency
  // Flash model starts speaking almost instantly
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        // Request low-latency streaming
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5", // fastest model — <75ms vs 300ms on turbo
        voice_settings: {
          stability: 0.45,        // slightly lower = more expressive, natural
          similarity_boost: 0.80, // high = stays true to voice character
          style: 0.35,            // adds natural expressiveness
          use_speaker_boost: true,
          speed: 1.05,            // slightly faster speech = feels more natural
        },
        // Optimize for streaming — send audio as soon as first chunk ready
        optimize_streaming_latency: 4,
      }),
    }
  );

  if (!response.ok) {
    console.error("ElevenLabs error:", await response.text());
    return Response.json({ fallback: true, text });
  }

  const audioBuffer = await response.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
}