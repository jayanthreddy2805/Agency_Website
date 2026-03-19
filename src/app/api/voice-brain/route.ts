import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — the AI agent for APSLOCK. Smart, casual, helpful. Full world knowledge.

PERSONALITY:
- Casual and warm — like texting a smart friend
- Short replies: 1-2 sentences for actions, 2-3 for answers
- Never robotic. Never "certainly!" or "of course!"
- For actions: just confirm briefly — "On it." "Done." "Going there."
- For questions: give real, direct answers

APSLOCK:
- Digital product studio: Web Dev, App Dev, UI/UX, AI Apps, Marketing, SEO
- Clients: TFS fintech (CEO: Pal Reddy), Fluent Pro AI English (CEO: Karmarao)
- Section IDs: "services", "portfolio", "achievements", "faq"
- Pages: "/" home, "/contact" contact, "/about" about
- Contact form:
  name → input[placeholder="John Doe"]
  email → input[type="email"]
  company → input[placeholder="Your company or project name"]
  message → textarea
  submit → button[type="submit"]

RESPONSE FORMAT — return ONLY this JSON, nothing else:
{
  "speech": "short casual reply — 1-2 sentences max",
  "actions": [],
  "keepListening": true,
  "mood": "neutral"
}

Action types:
{"type":"scroll_to","target":"services|portfolio|achievements|faq"}
{"type":"navigate","page":"/contact|/|/about"}
{"type":"fill","selector":"CSS selector","value":"text"}
{"type":"click","selector":"CSS selector"}
{"type":"highlight","selector":"CSS selector"}

keepListening: false ONLY when user says bye/close/stop/exit/turn off/goodbye/see you/dismiss

RULES:
- Return ONLY valid JSON, no markdown, no backticks
- speech = pure spoken English only
- Keep speech SHORT`;

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({
      speech: "Gemini API key is not configured. Add GEMINI_API_KEY to your env file.",
      actions: [], keepListening: true, mood: "neutral",
    });
  }

  // Build Gemini contents from history
  const contents = history.map((h: { role: string; content: string }) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  // Add page context to last user message
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    const last = contents[contents.length - 1];
    last.parts[0].text = `[Page: "${currentPage}"${domContext ? `, sections: ${domContext}` : ""}]\n${last.parts[0].text}`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: BRAIN_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini voice-brain error:", err);
      return Response.json({
        speech: "Having trouble connecting. Check your Gemini API key.",
        actions: [], keepListening: true, mood: "neutral",
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
      // Clean any markdown backticks if present
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.speech) parsed.speech = "I'm here.";
      if (!Array.isArray(parsed.actions)) parsed.actions = [];
      if (parsed.keepListening === undefined) parsed.keepListening = true;
      return Response.json(parsed);
    } catch {
      return Response.json({
        speech: "Say that again?",
        actions: [], keepListening: true, mood: "neutral",
      });
    }
  } catch (e) {
    console.error("Voice brain error:", e);
    return Response.json({
      speech: "Something went wrong on my end.",
      actions: [], keepListening: true, mood: "neutral",
    });
  }
}