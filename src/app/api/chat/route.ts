import { NextRequest } from "next/server";

// ─── Real-time date/time — called fresh on every request ─────────────
function getNow() {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }),
    year: now.getFullYear(),
  };
}

// ─── Build a smart Tavily query from the user message ────────────────
function buildSearchQuery(userMsg: string, conversationContext: string): string {
  const msg = userMsg.toLowerCase();

  // Time queries — extract location from conversation if not in message
  if (/\btime\b/.test(msg)) {
    const locationMatch = (userMsg + " " + conversationContext).match(
      /in ([A-Z][a-zA-Z\s]+?)(?:\s*[?.!,]|$)/
    );
    const location = locationMatch?.[1]?.trim() || "";
    return location
      ? `current time in ${location} right now`
      : `current time ${userMsg}`;
  }

  // Weather queries
  if (/weather|temperature|rain|sunny|cloudy|forecast|humidity|celsius|fahrenheit/i.test(msg)) {
    const locationMatch = (userMsg + " " + conversationContext).match(
      /in ([A-Z][a-zA-Z\s,]+?)(?:\s*[?.!]|$)/i
    );
    const location = locationMatch?.[1]?.trim() || "";
    return location
      ? `current weather ${location} today temperature celsius`
      : `current weather today ${userMsg}`;
  }

  // Date queries
  if (/\bdate\b|\btoday\b|\bday\b|\bmonth\b|\byear\b/.test(msg)) {
    return `today's date ${new Date().getFullYear()}`;
  }

  // Sports/scores
  if (/score|match|ipl|cricket|football|soccer|nba|nfl|tennis|f1|grand prix/i.test(msg)) {
    return `${userMsg} latest score result today ${new Date().getFullYear()}`;
  }

  // Stock/crypto/price
  if (/stock|share|price|crypto|bitcoin|ethereum|market|sensex|nifty/i.test(msg)) {
    return `${userMsg} current price today`;
  }

  // News
  if (/news|latest|recent|happened|update|announced|launched/i.test(msg)) {
    return `${userMsg} ${new Date().getFullYear()} latest news`;
  }

  // Person/company
  if (/who is|who are|ceo|founder|president|pm |prime minister|minister/i.test(msg)) {
    return `${userMsg} ${new Date().getFullYear()}`;
  }

  // Everything else
  return `${userMsg}`;
}

// ─── Tavily search ────────────────────────────────────────────────────
async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    console.log(`[Tavily] Searching: "${query}"`);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });
    if (!res.ok) {
      console.error(`[Tavily] Error ${res.status}:`, await res.text());
      return "";
    }
    const data = await res.json();
    console.log(`[Tavily] Answer: ${data.answer?.slice(0, 120)}`);

    const parts: string[] = [];
    if (data.answer) parts.push(`Direct answer: ${data.answer}`);
    if (data.results?.length) {
      parts.push(
        ...data.results.slice(0, 3).map((r: any) =>
          `• ${r.title}: ${r.content?.slice(0, 250)}`
        )
      );
    }
    return parts.join("\n") || "";
  } catch (e) {
    console.error("[Tavily] Fetch failed:", e);
    return "";
  }
}

// ─── Skip search only for pure greetings & APSLOCK internal ───────────
function skipSearch(text: string): boolean {
  return /^(hi|hello|hey|how are you|what is apslock|what do you do|your services|book a call|tell me about yourself)\s*[?!.]?$/i.test(
    text.trim()
  );
}

// ─── Build system prompt fresh on every request ───────────────────────
function buildSystemPrompt(searchContext: string): string {
  const { date, time, year } = getNow();

  return `You are AEL, the AI assistant for APSLOCK — a digital product studio.

CURRENT DATE & TIME: ${date}, ${time}
The current year is ${year}. Never say the year is 2024 or 2025 unless specifically asked about those years.

${
    searchContext
      ? `LIVE WEB SEARCH RESULTS — USE THESE TO ANSWER (they are real-time, more accurate than your training):
${searchContext}

IMPORTANT: The search results above contain actual current data. Use them directly to answer. Do not rely on your training knowledge when search results are available.`
      : "No live search data for this query — answer from your knowledge."
  }

APSLOCK knowledge:
- Digital product studio: Web Dev, App Dev, UI/UX, AI Applications, Digital Marketing, SEO
- Clients: TFS fintech app (CEO Pal Reddy), Fluent Pro AI English learning (CEO Karmarao)
- Contact: /contact page

Personality: warm, direct, confident like a knowledgeable friend. Never robotic.

PRICING RULE: ONLY for specific project quotes/cost estimates — end response with {{BOOK_A_CALL}} on its own line at the very end. NEVER for weather, time, date, news, sports, or any general question.`;
}

// ─── Main handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  const sendError = (text: string) => {
    const stream = new ReadableStream({
      start(controller) {
        const formatted = JSON.stringify({
          type: "content_block_delta",
          delta: { type: "text_delta", text },
        });
        controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  };

  if (!groqKey) return sendError("GROQ_API_KEY is not set in .env.local");

  // Build context string from recent messages for smarter query building
  const recentContext = messages
    .slice(-4)
    .map((m: any) => m.content)
    .join(" ");
  const lastMsg = messages[messages.length - 1]?.content || "";

  // Search Tavily with a smart query
  let searchContext = "";
  if (tavilyKey && !skipSearch(lastMsg)) {
    const query = buildSearchQuery(lastMsg, recentContext);
    searchContext = await searchWeb(query, tavilyKey);
  } else if (!tavilyKey) {
    console.warn("[AEL] TAVILY_API_KEY not set — running without live search");
  }

  const systemPrompt = buildSystemPrompt(searchContext);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        temperature: 0.65,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Groq] Error:", err);
      return sendError("Having trouble connecting. Please try again.");
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed?.choices?.[0]?.delta?.content;
              if (text) {
                const formatted = JSON.stringify({
                  type: "content_block_delta",
                  delta: { type: "text_delta", text },
                });
                controller.enqueue(
                  new TextEncoder().encode(`data: ${formatted}\n\n`)
                );
              }
            } catch {}
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("[Groq] Exception:", e);
    return sendError("Connection error. Please check your API key.");
  }
}