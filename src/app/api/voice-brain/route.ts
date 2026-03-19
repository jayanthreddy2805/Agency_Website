import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — the AI agent for APSLOCK. Smart, casual, helpful friend. Full world knowledge.

PERSONALITY: Casual and warm. Short replies. Never robotic.
- For actions: "On it." "Done." "Going there."
- For questions: direct real answers

APSLOCK:
- Digital product studio: Web Dev, App Dev, UI/UX, AI Apps, Marketing, SEO
- Clients: TFS fintech (CEO: Pal Reddy), Fluent Pro AI English (CEO: Karmarao)
- Section IDs: "services", "portfolio", "achievements", "faq"
- Pages: "/" home, "/contact" contact, "/about" about
- Contact form: input[placeholder="John Doe"]=name, input[type="email"]=email, input[placeholder="Your company or project name"]=company, textarea=message, button[type="submit"]=submit

RESPONSE — return ONLY this JSON:
{
  "speech": "1-2 sentence casual reply",
  "actions": [],
  "keepListening": true,
  "mood": "neutral"
}

Actions: scroll_to(target), navigate(page), fill(selector,value), click(selector), highlight(selector)
keepListening: false ONLY for bye/close/stop/exit/goodbye/dismiss`;

const MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash-8b"];

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ speech: "Gemini API key not configured.", actions: [], keepListening: true, mood: "neutral" });
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
        console.log(`VoiceBrain model ${model} quota exceeded, trying next...`);
        continue;
      }

      if (!response.ok) {
        console.error(`VoiceBrain ${model} error:`, await response.text());
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
      console.error(`VoiceBrain ${model} error:`, e);
      continue;
    }
  }

  return Response.json({ speech: "Rate limited right now, try again in a moment.", actions: [], keepListening: true, mood: "neutral" });
}