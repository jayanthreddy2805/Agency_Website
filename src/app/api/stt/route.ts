import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    if (!audio) return Response.json({ transcript: "", error: "No audio" });

    const groqForm = new FormData();
    groqForm.append("file", audio, "audio.webm");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", "en");
    groqForm.append("response_format", "json");
    groqForm.append("temperature", "0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!response.ok) return Response.json({ transcript: "", error: await response.text() });
    const data = await response.json();
    return Response.json({ transcript: data.text?.trim() || "" });
  } catch (e) {
    return Response.json({ transcript: "", error: String(e) });
  }
}