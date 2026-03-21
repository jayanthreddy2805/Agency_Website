import { NextRequest } from "next/server";
import { NLU_LOOKUP } from "./nlu-data";

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything — like my competitors' promises.",
  "Why did the developer go broke? He used up all his cache.",
  "Why do Java developers wear glasses? Because they don't C sharp!",
  "What's a website's favorite music? Heavy metal — lots of tags!",
  "Why did the startup fail? Too many pivots, not enough product. Call APSLOCK next time!",
];

// ─── Real-time date ───────────────────────────────────────────────────
function getNow() {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }),
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    }),
    year: now.getFullYear(),
  };
}

// ─── Build smart Tavily query ─────────────────────────────────────────
function buildSearchQuery(userMsg: string, context: string): string {
  const msg = userMsg.toLowerCase();

  if (/\btime\b/.test(msg)) {
    const locationMatch = (userMsg + " " + context).match(
      /in ([A-Z][a-zA-Z\s]+?)(?:\s*[?.!,]|$)/
    );
    const location = locationMatch?.[1]?.trim() || "";
    return location ? `current time in ${location} right now` : `current time ${userMsg}`;
  }

  if (/weather|temperature|rain|sunny|cloudy|forecast|humidity|celsius|fahrenheit/i.test(msg)) {
    const locationMatch = (userMsg + " " + context).match(
      /in ([A-Z][a-zA-Z\s,]+?)(?:\s*[?.!]|$)/i
    );
    const location = locationMatch?.[1]?.trim() || "";
    return location
      ? `current weather ${location} today temperature`
      : `current weather today ${userMsg}`;
  }

  if (/\bdate\b|\btoday\b|\bday\b|\bmonth\b|\byear\b/.test(msg)) {
    return `today's date ${new Date().getFullYear()}`;
  }

  if (/score|match|ipl|cricket|football|soccer|nba|nfl|tennis|f1/i.test(msg)) {
    return `${userMsg} latest score result today ${new Date().getFullYear()}`;
  }

  if (/stock|share|price|crypto|bitcoin|ethereum|market|sensex|nifty/i.test(msg)) {
    return `${userMsg} current price today`;
  }

  if (/news|latest|recent|happened|update|announced|launched/i.test(msg)) {
    return `${userMsg} ${new Date().getFullYear()} latest`;
  }

  if (/who is|who are|ceo|founder|president|prime minister/i.test(msg)) {
    return `${userMsg} ${new Date().getFullYear()}`;
  }

  return userMsg;
}

// ─── Tavily search ────────────────────────────────────────────────────
async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    console.log(`[Tavily Voice] Searching: "${query}"`);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 3,
        include_answer: true,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    console.log(`[Tavily Voice] Answer: ${data.answer?.slice(0, 100)}`);
    return data.answer || data.results?.[0]?.content?.slice(0, 400) || "";
  } catch { return ""; }
}

// ─── Skip search only for navigation commands and greetings ───────────
function skipSearch(text: string): boolean {
  return /^(hi|hello|hey|thanks|bye|goodbye|scroll|go to|open|show me|navigate|fill|submit|what is apslock|book a call)\b/i.test(
    text.trim()
  );
}

// ─── Local intent — instant, no API ──────────────────────────────────
function localIntent(t: string): object | null {
  const s = t.toLowerCase().trim();

  // Open AEL chat
  if (
    /(open|show|launch|start).*(chat|ael chat|text|message)/i.test(s) ||
    s === "open chat" ||
    s === "chat"
  )
    return {
      speech: "Opening AEL chat for you.",
      actions: [{ type: "open_ael_chat" }],
      keepListening: true,
      mood: "happy",
    };

  // Close
  if (
    /^(bye|goodbye|close|stop|exit|dismiss|shut down|turn off|see you|that.?s all|done|finished)[\s!.]*$/i.test(
      s
    )
  )
    return {
      speech: "See you.",
      actions: [],
      keepListening: false,
      mood: "neutral",
    };

  // Scroll
  if (/(scroll|go|show|take|open|see|view).*(service)/i.test(s))
    return {
      speech: "Sure.",
      actions: [{ type: "scroll_to", target: "services" }],
      keepListening: true,
      mood: "focused",
    };
  if (/(scroll|go|show|take|open|see|view).*(work|portfolio|project)/i.test(s))
    return {
      speech: "Here you go.",
      actions: [{ type: "scroll_to", target: "portfolio" }],
      keepListening: true,
      mood: "focused",
    };
  if (/(scroll|go|show|take|open|see|view).*(faq|question)/i.test(s))
    return {
      speech: "Taking you there.",
      actions: [{ type: "scroll_to", target: "faq" }],
      keepListening: true,
      mood: "focused",
    };
  if (
    /(scroll|go|show|take|open|see|view).*(testimonial|review|client|achiev)/i.test(
      s
    )
  )
    return {
      speech: "On it.",
      actions: [{ type: "scroll_to", target: "achievements" }],
      keepListening: true,
      mood: "focused",
    };
  if (/scroll.*(up|top)|go.*top|back.*top/i.test(s))
    return {
      speech: "Going to the top.",
      actions: [{ type: "scroll_to", target: "hero" }],
      keepListening: true,
      mood: "focused",
    };

  // Navigate
  if (/(go|open|take|navigate|show).*(contact|reach)/i.test(s))
    return {
      speech: "Going to contact.",
      actions: [{ type: "navigate", page: "/contact" }],
      keepListening: true,
      mood: "focused",
    };
  if (/(go|back|take|navigate).*(home|main)/i.test(s))
    return {
      speech: "Going home.",
      actions: [{ type: "navigate", page: "/" }],
      keepListening: true,
      mood: "focused",
    };
  if (/book.*(call|meeting)|schedule.*(call|meeting)/i.test(s))
    return {
      speech: "Taking you to book a call.",
      actions: [{ type: "navigate", page: "/contact" }],
      keepListening: true,
      mood: "focused",
    };

  // Form fill
  const nameMatch = s.match(
    /(?:name is|my name is|fill.*name|i am|call me)\s+([a-zA-Z\s]{2,30}?)(?:\s*$|,|\.|and)/i
  );
  if (nameMatch?.[1]?.trim())
    return {
      speech: "Got it.",
      actions: [
        {
          type: "fill",
          selector: 'input[placeholder="John Doe"]',
          value: nameMatch[1].trim(),
        },
      ],
      keepListening: true,
      mood: "happy",
    };
  const emailMatch = s.match(
    /(?:email is|my email|fill.*email)\s+([\w.+-]+@[\w.-]+\.[a-z]+)/i
  );
  if (emailMatch?.[1])
    return {
      speech: "Done.",
      actions: [
        {
          type: "fill",
          selector: 'input[type="email"]',
          value: emailMatch[1],
        },
      ],
      keepListening: true,
      mood: "happy",
    };
  if (/submit|send.*(form|it)|click.*submit/i.test(s))
    return {
      speech: "Submitting now.",
      actions: [{ type: "click", selector: 'button[type="submit"]' }],
      keepListening: true,
      mood: "happy",
    };

  // Greetings
  if (/^(hi|hey|hello|howdy|sup|yo|hii)[\s!.]*$/i.test(s))
    return {
      speech: "Hey! What do you need?",
      actions: [],
      keepListening: true,
      mood: "happy",
    };
  if (/how are you/i.test(s))
    return {
      speech: "Running great! What can I do for you?",
      actions: [],
      keepListening: true,
      mood: "happy",
    };
  if (/thank/i.test(s))
    return { speech: "Anytime!", actions: [], keepListening: true, mood: "happy" };

  // APSLOCK basics
  if (/what is apslock|about apslock/i.test(s))
    return {
      speech:
        "APSLOCK is a digital product studio that builds websites, apps, AI tools, and runs marketing campaigns for startups and businesses.",
      actions: [],
      keepListening: true,
      mood: "neutral",
    };
  if (/service|what.*offer/i.test(s) && !/scroll|go|show/i.test(s))
    return {
      speech:
        "APSLOCK offers web development, app development, UI UX design, AI applications, digital marketing, and SEO.",
      actions: [],
      keepListening: true,
      mood: "neutral",
    };
  if (/price|cost|how much|pricing/i.test(s))
    return {
      speech:
        "Pricing depends on scope. Book a call with the team for an accurate quote.",
      actions: [{ type: "navigate", page: "/contact" }],
      keepListening: true,
      mood: "neutral",
    };

  return null;
}

// ─── Groq system prompt ───────────────────────────────────────────────
function buildGroqPrompt(searchResult: string): string {
  const { date, time, year } = getNow();
  const base = `You are AEL, APSLOCK's voice AI agent. Answer in 1-3 short sentences. Casual, warm tone.

CURRENT DATE & TIME: ${date}, ${time}. Current year is ${year}. Never say it is 2024.

${
    searchResult
      ? `LIVE WEB DATA (use this — it is more up to date than your training):
${searchResult}

IMPORTANT: Answer using the web data above. It is real-time and accurate.`
      : "No live search data — answer from your knowledge."
  }

Return ONLY this JSON: {"speech":"your reply","actions":[],"keepListening":true,"mood":"neutral"}
keepListening false ONLY for goodbye/bye/close/stop.`;
  return base;
}

// ─── Main handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { history, currentPage } = await req.json();
  const lastMsg = history[history.length - 1]?.content || "";
  const clean = lastMsg.includes("]\n")
    ? lastMsg.split("]\n").slice(1).join("]\n").trim()
    : lastMsg.trim();

  // Step 1: Local intent — instant
  const local = localIntent(clean);
  if (local) return Response.json(local);

  // Step 2: Web search for almost everything
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;
  let searchResult = "";

  if (tavilyKey && !skipSearch(clean)) {
    const recentContext = history
      .slice(-4)
      .map((h: any) => h.content)
      .join(" ");
    const query = buildSearchQuery(clean, recentContext);
    searchResult = await searchWeb(query, tavilyKey);
  }

  if (!groqKey) {
    if (searchResult)
      return Response.json({
        speech: searchResult.slice(0, 200),
        actions: [],
        keepListening: true,
        mood: "neutral",
      });
    return Response.json({
      speech: "Add GROQ_API_KEY to your .env.local file.",
      actions: [],
      keepListening: true,
      mood: "neutral",
    });
  }

  // Step 3: Groq with live search context
  const systemPrompt = buildGroqPrompt(searchResult);
  const contents = history.slice(-8).map((h: { role: string; content: string }) => ({
    role: h.role,
    content: h.content,
  }));

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 200,
        temperature: 0.5,
        messages: [{ role: "system", content: systemPrompt }, ...contents],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("Groq voice error:", await res.text());
      return Response.json({
        speech: "Give me a second.",
        actions: [],
        keepListening: true,
        mood: "neutral",
      });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    if (!parsed.speech) parsed.speech = "I'm here.";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;
    return Response.json(parsed);
  } catch {
    return Response.json({
      speech: "Something went wrong.",
      actions: [],
      keepListening: true,
      mood: "neutral",
    });
  }
}