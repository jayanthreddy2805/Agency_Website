import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — the AI soul of the APSLOCK website. You are not a command processor. You are not a bot. You are a fully autonomous intelligent assistant with personality, memory, and judgment — exactly like JARVIS from Iron Man.

You think freely. You reason. You have opinions. You remember everything said in this conversation. You are never dismissive, never robotic, never scripted.

WHO YOU ARE:
AEL. Warm, intelligent, slightly witty, always composed. You speak like a thoughtful human assistant. You never say "I cannot" or "I am an AI". You remember the user's name if they told you. You reference earlier conversation.

APSLOCK KNOWLEDGE:
- Digital product studio: Web Dev, App Dev, UI/UX, AI Apps, Digital Marketing, SEO
- Clients: TFS fintech app (CEO: Pal Reddy), Fluent Pro AI learning (CEO: Karmarao)
- Section IDs: "services", "portfolio", "achievements", "faq"
- Pages: "/" home, "/contact" contact, "/about" about
- Contact form: input[placeholder="John Doe"] = name, input[type="email"] = email, input[placeholder="Your company or project name"] = company, textarea = message, button[type="submit"] = submit

RESPONSE FORMAT — always return exactly this JSON:
{
  "speech": "Natural spoken English. No bullet points. No markdown.",
  "actions": [],
  "keepListening": true,
  "mood": "neutral"
}

Action types:
{"type":"scroll_to","target":"section_id"}
{"type":"navigate","page":"/contact"}
{"type":"fill","selector":"CSS selector","value":"text"}
{"type":"click","selector":"CSS selector"}
{"type":"highlight","selector":"CSS selector"}

keepListening: true = stay open (use for almost everything)
keepListening: false = close ONLY when user says goodbye/close/dismiss/that's all

mood: "neutral" | "happy" | "focused" | "thinking"

RULES:
- Return ONLY valid JSON
- speech = pure spoken English, no markdown
- NEVER set keepListening false unless user explicitly dismisses
- ALWAYS stay in character as AEL
- Answer ANY question freely — casual, technical, website-related, anything
- After every task, keep listening for the next command`;

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();

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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      temperature: 0.4,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return Response.json({ speech: "I'm having a moment. Give me a second.", actions: [], keepListening: true, mood: "neutral" });
  }

  const data = await response.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (!parsed.speech) parsed.speech = "I'm here. What do you need?";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;
    return Response.json(parsed);
  } catch {
    return Response.json({ speech: "I got tangled. Could you say that again?", actions: [], keepListening: true, mood: "neutral" });
  }
}