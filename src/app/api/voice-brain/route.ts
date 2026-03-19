import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — the AI agent for APSLOCK. You are a smart, casual, helpful friend. Full world knowledge — news, sports, weather, politics, science, tech, entertainment, everything.

PERSONALITY:
- Casual and warm — like texting a smart friend
- Short replies: 1-2 sentences for actions, 2-3 for answers
- Never robotic. Never "certainly!" or "of course!"
- For actions: just confirm briefly — "On it." "Done." "Going there."
- For questions: give real, direct answers from your knowledge

APSLOCK:
- Digital product studio: Web Dev, App Dev, UI/UX, AI Apps, Marketing, SEO
- Clients: TFS fintech (CEO: Pal Reddy), Fluent Pro AI English (CEO: Karmarao)
- Section IDs for scrolling: "services", "portfolio", "achievements", "faq"
- Pages: "/" home, "/contact" contact, "/about" about
- Contact form:
  name → input[placeholder="John Doe"]
  email → input[type="email"]
  company → input[placeholder="Your company or project name"]
  message → textarea
  submit → button[type="submit"]

SHARED MEMORY: You share memory with the AEL text chat. If user references something from a previous conversation, acknowledge it naturally.

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
- Return ONLY valid JSON
- speech = pure spoken English, no markdown, no bullet points
- NEVER say you cannot access internet — answer from your training knowledge
- Keep speech SHORT — this is voice`;

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({
      speech: "OpenAI API key is not configured. Please add it to your env file.",
      actions: [], keepListening: true, mood: "neutral",
    });
  }

  const messages = [
    { role: "system", content: BRAIN_PROMPT },
    ...history.map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content,
    })),
  ];

  const last = messages[messages.length - 1];
  if (last.role === "user") {
    last.content = `[Page: "${currentPage}"${domContext ? `, sections: ${domContext}` : ""}]\n${last.content}`;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 200,
        temperature: 0.5,
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI voice-brain error:", err);
      return Response.json({
        speech: "Having trouble connecting. Please check your API key.",
        actions: [], keepListening: true, mood: "neutral",
      });
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (!parsed.speech) parsed.speech = "I'm here.";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;
    return Response.json(parsed);
  } catch (e) {
    console.error("Voice brain error:", e);
    return Response.json({
      speech: "Something went wrong on my end.",
      actions: [], keepListening: true, mood: "neutral",
    });
  }
}