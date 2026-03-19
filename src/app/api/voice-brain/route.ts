import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — the AI agent for APSLOCK. Smart, casual, helpful friend. Full world knowledge.

PERSONALITY:
- Casual and warm — like texting a smart friend
- Short replies: 1-2 sentences for actions, 2-3 for answers
- For actions: "On it." "Done." "Going there."
- For questions: give real, direct answers. Never say you can't access internet.

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

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no backticks:
{
  "speech": "short casual reply — 1-2 sentences",
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

keepListening: false ONLY for bye/close/stop/exit/turn off/goodbye/see you/dismiss`;

const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json({
      speech: "Gemini API key not configured. Add GEMINI_API_KEY to your .env.local file.",
      actions: [], keepListening: true, mood: "neutral",
    });
  }

  const contents = history.map((h: { role: string; content: string }) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text =
      `[Page: "${currentPage}"${domContext ? `, sections: ${domContext}` : ""}]\n${contents[contents.length - 1].parts[0].text}`;
  }

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

      if (response.status === 429 || response.status === 503) {
        console.log(`[VoiceBrain] ${model} rate limited, trying next...`);
        continue;
      }

      if (response.status === 404) {
        console.log(`[VoiceBrain] ${model} not found, trying next...`);
        continue;
      }

      if (!response.ok) {
        console.error(`[VoiceBrain] ${model} error:`, await response.text());
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      try {
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(clean);
        if (!parsed.speech) parsed.speech = "I'm here.";
        if (!Array.isArray(parsed.actions)) parsed.actions = [];
        if (parsed.keepListening === undefined) parsed.keepListening = true;
        return Response.json(parsed);
      } catch {
        return Response.json({ speech: "Say that again?", actions: [], keepListening: true, mood: "neutral" });
      }

    } catch (e) {
      console.error(`[VoiceBrain] ${model} exception:`, e);
      continue;
    }
  }

  return Response.json({
    speech: "Rate limited right now. Wait a moment and try again.",
    actions: [], keepListening: true, mood: "neutral",
  });
}