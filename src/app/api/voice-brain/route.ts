import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — the AI agent for APSLOCK. You are a smart, casual, helpful friend. You have full knowledge of the world and can answer anything.

PERSONALITY:
- Casual and warm — like texting a smart friend
- Short replies: 1-2 sentences for actions, 2-3 for answers
- Never robotic. Never "certainly!" or "of course!"
- For actions: just confirm briefly — "On it." "Done." "Going there."
- For questions: give real, direct answers

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

SHARED MEMORY: You share memory with the text chat AEL. If the user says "remember I told you..." or references a past chat conversation, acknowledge it naturally.

RESPONSE FORMAT — return ONLY this JSON:
{
  "speech": "short casual reply — 1-2 sentences max",
  "actions": [],
  "keepListening": true,
  "mood": "neutral",
  "needsSearch": false
}

Action types:
{"type":"scroll_to","target":"services|portfolio|achievements|faq"}
{"type":"navigate","page":"/contact|/|/about"}
{"type":"fill","selector":"CSS selector","value":"text"}
{"type":"click","selector":"CSS selector"}
{"type":"highlight","selector":"CSS selector"}

needsSearch: true ONLY for live data (today's news, live scores, current weather, stock prices)
keepListening: false ONLY when user says bye/close/stop/exit/turn off/goodbye/see you/dismiss

RULES:
- Return ONLY valid JSON
- speech = pure spoken English, no markdown
- NEVER say you can't access internet
- Keep speech SHORT — this is voice, not reading`;

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({
      speech: "OpenAI key not set. Add OPENAI_API_KEY to your env file.",
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
    console.error("OpenAI error:", await response.text());
    return Response.json({ speech: "Something went wrong.", actions: [], keepListening: true, mood: "neutral" });
  }

  const data = await response.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (!parsed.speech) parsed.speech = "I'm here.";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;

    // If needs live search, use GPT-4o with search
    if (parsed.needsSearch) {
      const userMsg = history[history.length - 1]?.content || "";
      try {
        const searchRes = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini-search-preview",
            tools: [{ type: "web_search_preview" }],
            input: userMsg,
          }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const output = searchData.output?.find((o: any) => o.type === "message");
          const searchText = output?.content?.find((c: any) => c.type === "output_text")?.text || "";
          if (searchText) {
            const fmtRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                max_tokens: 150,
                temperature: 0.4,
                messages: [
                  { role: "system", content: `Summarize this search result as a casual 1-2 sentence spoken reply. Return JSON: {"speech":"...","actions":[],"keepListening":true,"mood":"neutral","needsSearch":false}` },
                  { role: "user", content: `Question: "${userMsg}"\nResult: ${searchText}` },
                ],
                response_format: { type: "json_object" },
              }),
            });
            if (fmtRes.ok) {
              const fmtData = await fmtRes.json();
              const fmtParsed = JSON.parse(fmtData.choices?.[0]?.message?.content || "{}");
              if (fmtParsed.speech) return Response.json(fmtParsed);
            }
          }
        }
      } catch (e) { console.error("Search error:", e); }
    }

    return Response.json(parsed);
  } catch {
    return Response.json({ speech: "Say that again?", actions: [], keepListening: true, mood: "neutral" });
  }
}