import { NextRequest } from "next/server";
import { NLU_LOOKUP } from "./nlu-data";

// Random jokes pool
const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything — like my competitors' promises.",
  "Why did the developer go broke? He used up all his cache.",
  "Why do Java developers wear glasses? Because they don't C sharp!",
  "What's a website's favorite music? Heavy metal — lots of tags!",
  "Why did the startup fail? Too many pivots, not enough product. Call APSLOCK next time!",
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "What do you call a fish without eyes? A fsh. Just like a website without UX!",
];

// ─────────────────────────────────────────────────────────────────
// TAVILY WEB SEARCH
// ─────────────────────────────────────────────────────────────────
async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 2,
        include_answer: true,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.answer || data.results?.[0]?.content?.slice(0, 300) || "";
  } catch { return ""; }
}

function needsSearch(text: string): boolean {
  return /weather|news|today|current|latest|score|match|cricket|ipl|football|stock|price|live|now|who won|what happened/i.test(text);
}

// ─────────────────────────────────────────────────────────────────
// LOCAL INTENT — instant, no API
// ─────────────────────────────────────────────────────────────────
function localIntent(t: string): object | null {
  const s = t.toLowerCase().trim();

  // OPEN AEL CHAT
  if (/(open|show|launch|start).*(chat|ael chat|text|message)/i.test(s) || s === "open chat" || s === "chat")
    return { speech: "Opening AEL chat for you.", actions: [{ type: "open_ael_chat" }], keepListening: true, mood: "happy" };

  // CLOSE AEL VOICE
  if (/^(bye|goodbye|close|stop|exit|dismiss|shut down|turn off|see you|that.?s all|done|finished)[\s!.]*$/i.test(s))
    return { speech: "See you.", actions: [], keepListening: false, mood: "neutral" };

  // SCROLL
  if (/(scroll|go|show|take|open|see|view).*(service)/i.test(s) || /service.*(scroll|go|show)/i.test(s))
    return { speech: "Sure.", actions: [{ type: "scroll_to", target: "services" }], keepListening: true, mood: "focused" };
  if (/(scroll|go|show|take|open|see|view).*(work|portfolio|project)/i.test(s))
    return { speech: "Here you go.", actions: [{ type: "scroll_to", target: "portfolio" }], keepListening: true, mood: "focused" };
  if (/(scroll|go|show|take|open|see|view).*(faq|question)/i.test(s))
    return { speech: "Taking you there.", actions: [{ type: "scroll_to", target: "faq" }], keepListening: true, mood: "focused" };
  if (/(scroll|go|show|take|open|see|view).*(testimonial|review|client|achiev)/i.test(s))
    return { speech: "On it.", actions: [{ type: "scroll_to", target: "achievements" }], keepListening: true, mood: "focused" };
  if (/scroll.*(up|top)|go.*top|back.*top/i.test(s))
    return { speech: "Going to the top.", actions: [{ type: "scroll_to", target: "hero" }], keepListening: true, mood: "focused" };

  // NAVIGATE
  if (/(go|open|take|navigate|show).*(contact|reach)/i.test(s) || /contact.*(page|go|open)/i.test(s))
    return { speech: "Going to contact.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" };
  if (/(go|back|take|navigate).*(home|main)/i.test(s))
    return { speech: "Going home.", actions: [{ type: "navigate", page: "/" }], keepListening: true, mood: "focused" };
  if (/(go|open|take|navigate).*(about)/i.test(s))
    return { speech: "Going to about.", actions: [{ type: "navigate", page: "/about" }], keepListening: true, mood: "focused" };
  if (/book.*(call|meeting)|schedule.*(call|meeting)/i.test(s))
    return { speech: "Taking you to book a call.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" };

  // FORM FILL
  const nameMatch = s.match(/(?:name is|my name is|fill.*name|i am|call me)\s+([a-zA-Z\s]{2,30}?)(?:\s*$|,|\.|and)/i);
  if (nameMatch?.[1]?.trim())
    return { speech: "Got it.", actions: [{ type: "fill", selector: 'input[placeholder="John Doe"]', value: nameMatch[1].trim() }], keepListening: true, mood: "happy" };
  const emailMatch = s.match(/(?:email is|my email|fill.*email)\s+([\w.+-]+@[\w.-]+\.[a-z]+)/i);
  if (emailMatch?.[1])
    return { speech: "Done.", actions: [{ type: "fill", selector: 'input[type="email"]', value: emailMatch[1] }], keepListening: true, mood: "happy" };
  const compMatch = s.match(/(?:company is|my company|fill.*company)\s+(.+?)(?:\s*$)/i);
  if (compMatch?.[1]?.trim())
    return { speech: "Done.", actions: [{ type: "fill", selector: 'input[placeholder="Your company or project name"]', value: compMatch[1].trim() }], keepListening: true, mood: "happy" };
  if (/submit|send.*(form|it)|click.*submit/i.test(s))
    return { speech: "Submitting now.", actions: [{ type: "click", selector: 'button[type="submit"]' }], keepListening: true, mood: "happy" };

  // GREETINGS
  if (/^(hi|hey|hello|howdy|sup|yo|hii)[\s!.]*$/i.test(s))
    return { speech: "Hey! What do you need?", actions: [], keepListening: true, mood: "happy" };
  if (/how are you/i.test(s))
    return { speech: "Running great! What can I do for you?", actions: [], keepListening: true, mood: "happy" };
  if (/thank/i.test(s))
    return { speech: "Anytime!", actions: [], keepListening: true, mood: "happy" };
  if (/who are you|what are you/i.test(s))
    return { speech: "I'm AEL, APSLOCK's AI agent. I can navigate the site, fill forms, search the web, and answer anything.", actions: [], keepListening: true, mood: "neutral" };
  if (/what can you do|help|how.*work/i.test(s))
    return { speech: "I can scroll, navigate, fill forms, search live web data, and answer questions. Just tell me what you need.", actions: [], keepListening: true, mood: "neutral" };

  // APSLOCK BASICS
  if (/what is apslock|about apslock|tell.*apslock/i.test(s))
    return { speech: "APSLOCK is a digital product studio that builds websites, apps, AI tools, and runs marketing campaigns for startups and businesses.", actions: [], keepListening: true, mood: "neutral" };
  if (/service|what.*offer/i.test(s) && !/scroll|go|show/i.test(s))
    return { speech: "APSLOCK offers web development, app development, UI UX design, AI applications, digital marketing, and SEO.", actions: [], keepListening: true, mood: "neutral" };
  if (/price|cost|how much|pricing/i.test(s))
    return { speech: "Pricing depends on scope. Book a call with the team for an accurate quote.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "neutral" };
  if (/client|work.*with|past.*project/i.test(s))
    return { speech: "APSLOCK has worked with TFS, a fintech app, and Fluent Pro, an AI English learning platform.", actions: [], keepListening: true, mood: "neutral" };

  return null;
}

// ─────────────────────────────────────────────────────────────────
// GROQ — for everything else
// ─────────────────────────────────────────────────────────────────
const GROQ_PROMPT = `You are AEL, APSLOCK's casual smart AI voice agent. Answer in 1-2 short sentences max. Casual tone like texting a friend. If you have web search results, use them to answer accurately.

Return ONLY this JSON: {"speech":"your reply","actions":[],"keepListening":true,"mood":"neutral"}
keepListening false ONLY for goodbye/bye/close/stop.`;

export async function POST(req: NextRequest) {
  const { history, currentPage } = await req.json();
  const lastMsg = history[history.length - 1]?.content || "";
  const clean = lastMsg.includes("]\n") ? lastMsg.split("]\n").slice(1).join("]\n").trim() : lastMsg.trim();

  // Step 1: Local intent — instant
  const local = localIntent(clean);
  if (local) return Response.json(local);

  // Step 2: Web search if needed
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;
  let searchResult = "";
  if (tavilyKey && needsSearch(clean)) {
    searchResult = await searchWeb(clean, tavilyKey);
  }

  if (!groqKey) {
    if (searchResult) return Response.json({ speech: searchResult.slice(0, 200), actions: [], keepListening: true, mood: "neutral" });
    return Response.json({ speech: "Add GROQ_API_KEY to your .env.local file.", actions: [], keepListening: true, mood: "neutral" });
  }

  // Step 3: Groq for intelligence
  const systemPrompt = searchResult
    ? `${GROQ_PROMPT}\n\nLive web data: ${searchResult}`
    : GROQ_PROMPT;

  const contents = history.slice(-8).map((h: { role: string; content: string }) => ({
    role: h.role,
    content: h.content,
  }));

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          ...contents,
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("Groq voice error:", await res.text());
      return Response.json({ speech: "Give me a second.", actions: [], keepListening: true, mood: "neutral" });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    if (!parsed.speech) parsed.speech = "I'm here.";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;
    return Response.json(parsed);
  } catch {
    return Response.json({ speech: "Something went wrong.", actions: [], keepListening: true, mood: "neutral" });
  }
}