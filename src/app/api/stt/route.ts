import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    if (!audio) return Response.json({ transcript: "", error: "No audio" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ transcript: "", error: "No OPENAI_API_KEY set" });

    const form = new FormData();
    form.append("file", audio, "audio.webm");
    form.append("model", "whisper-1");
    form.append("language", "en");
    form.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Whisper error:", err);
      return Response.json({ transcript: "", error: err });
    }

    const data = await response.json();
    return Response.json({ transcript: data.text?.trim() || "" });
  } catch (e) {
    return Response.json({ transcript: "", error: String(e) });
  }
}