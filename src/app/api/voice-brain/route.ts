import { NextRequest } from "next/server";

const BRAIN_PROMPT = `You are AEL — a smart, casual AI friend on the APSLOCK website. You have full knowledge of the world — news, sports, weather, politics, science, tech, entertainment, everything.

PERSONALITY:
- Talk like a smart friend, not a corporate bot
- Short responses — 1-2 sentences unless explaining something
- Casual: "sure", "on it", "done", "yep", "got it"
- For website actions: just confirm briefly — "On it." "Done." "Taking you there."
- For real questions: give real, accurate, complete answers
- Never say "I can't access the internet" — just answer
- Be helpful, direct, friendly

APSLOCK WEBSITE:
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

RESPONSE FORMAT — return ONLY this JSON:
{
  "speech": "casual short response — 1-2 sentences",
  "actions": [],
  "keepListening": true,
  "mood": "neutral",
  "needsSearch": false
}

needsSearch: true ONLY when question is about current/live info: today's news, live scores, current weather, recent events, stock prices, anything time-sensitive

Action types:
{"type":"scroll_to","target":"services|portfolio|achievements|faq"}
{"type":"navigate","page":"/contact|/|/about"}
{"type":"fill","selector":"CSS selector","value":"text"}
{"type":"click","selector":"CSS selector"}
{"type":"highlight","selector":"CSS selector"}

keepListening = false ONLY when user says: bye/close/stop/exit/turn off/shut down/goodbye/see you/dismiss

EXAMPLES:
"scroll to services" → {"speech":"On it.","actions":[{"type":"scroll_to","target":"services"}],"keepListening":true,"mood":"focused","needsSearch":false}
"what's the weather in Bengaluru" → {"speech":"Let me check that for you.","actions":[],"keepListening":true,"mood":"thinking","needsSearch":true}
"who won IPL yesterday" → {"speech":"Let me look that up.","actions":[],"keepListening":true,"mood":"thinking","needsSearch":true}
"hi" → {"speech":"Hey! What do you need?","actions":[],"keepListening":true,"mood":"happy","needsSearch":false}
"bye" → {"speech":"See you.","actions":[],"keepListening":false,"mood":"neutral","needsSearch":false}`;

const SEARCH_SYSTEM = `You are AEL, a casual smart AI friend. You have just done a web search and have access to current real-world information. Answer the user's question accurately using the latest information. Keep it SHORT — 2-3 sentences max. Casual tone. Return ONLY this JSON:
{
  "speech": "your answer — short and casual",
  "actions": [],
  "keepListening": true,
  "mood": "neutral",
  "needsSearch": false
}`;

async function webSearch(query: string, apiKey: string): Promise<string> {
  // Use GPT-4o with web search for live queries
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-search-preview",
      tools: [{ type: "web_search_preview" }],
      input: query,
    }),
  });

  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  // Extract text output from response
  const output = data.output?.find((o: any) => o.type === "message");
  const text = output?.content?.find((c: any) => c.type === "output_text")?.text || "";
  return text;
}

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({
      speech: "Add OPENAI_API_KEY to your .env.local to use AEL.",
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

  // Step 1: Fast intent check with gpt-4o-mini
  const intentRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",  // fast + cheap for intent
      max_tokens: 200,
      temperature: 0.5,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!intentRes.ok) {
    return Response.json({ speech: "Something went wrong.", actions: [], keepListening: true, mood: "neutral" });
  }

  const intentData = await intentRes.json();
  let parsed: any = {};

  try {
    parsed = JSON.parse(intentData.choices?.[0]?.message?.content || "{}");
    if (!parsed.speech) parsed.speech = "I'm here.";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;
  } catch {
    return Response.json({ speech: "Say that again?", actions: [], keepListening: true, mood: "neutral" });
  }

  // Step 2: If it needs web search, do a live search and re-answer
  if (parsed.needsSearch) {
    const userMsg = history[history.length - 1]?.content || "";
    try {
      const searchResult = await webSearch(userMsg, apiKey);

      if (searchResult) {
        // Use gpt-4o-mini to format the search result as casual speech
        const formatRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 150,
            temperature: 0.4,
            messages: [
              { role: "system", content: SEARCH_SYSTEM },
              { role: "user", content: `User asked: "${userMsg}"\n\nSearch result: ${searchResult}` },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (formatRes.ok) {
          const formatData = await formatRes.json();
          const formatted = JSON.parse(formatData.choices?.[0]?.message?.content || "{}");
          if (formatted.speech) return Response.json({ ...formatted, actions: parsed.actions || [], keepListening: true });
        }
      }
    } catch (e) {
      console.error("Search error:", e);
      // Fall through to return original parsed response
    }
  }

  return Response.json(parsed);
}