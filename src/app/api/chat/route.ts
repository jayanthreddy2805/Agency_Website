import { NextRequest } from "next/server";

// Shared memory key - same as VoiceAEL
const SYSTEM_PROMPT = `You are AEL, the AI assistant for APSLOCK — a digital product studio.

You are smart, warm, direct. You answer every question fully — tech, business, science, current events, sports, coding, anything. You have access to real-time web search for live data.

APSLOCK knowledge:
- Services: Web Development, App Development, UI/UX Design, AI Applications, Digital Marketing, SEO
- Clients: TFS fintech app (CEO Pal Reddy), Fluent Pro AI English learning (CEO Karmarao)
- Contact: /contact page

Personality: warm, confident, like a knowledgeable friend. Never robotic.

Pricing: discuss factors, give ballparks, end with "For an accurate quote, a quick call is the best path" then on its own line: {{BOOK_A_CALL}}

Rules:
- Use web search results when provided to answer live questions
- Never refuse any topic
- Sound like a real person`;

async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    if (data.answer) return `Web search result: ${data.answer}`;
    const results = data.results?.slice(0, 2).map((r: any) => `${r.title}: ${r.content?.slice(0, 200)}`).join("\n");
    return results ? `Web search results:\n${results}` : "";
  } catch { return ""; }
}

function needsWebSearch(text: string): boolean {
  return /weather|news|today|current|latest|score|match|cricket|ipl|football|stock|price|live|now|2024|2025|2026/i.test(text);
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  const sendError = (text: string) => {
    const stream = new ReadableStream({
      start(controller) {
        const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
        controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  };

  if (!groqKey) return sendError("GROQ_API_KEY is not set in your .env.local file.");

  // Check if last message needs web search
  const lastMsg = messages[messages.length - 1]?.content || "";
  let searchContext = "";
  if (tavilyKey && needsWebSearch(lastMsg)) {
    searchContext = await searchWeb(lastMsg, tavilyKey);
  }

  const systemWithSearch = searchContext
    ? `${SYSTEM_PROMPT}\n\nCurrent real-time data:\n${searchContext}`
    : SYSTEM_PROMPT;

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
        temperature: 0.75,
        stream: true,
        messages: [
          { role: "system", content: systemWithSearch },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq chat error:", err);
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
                const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
                controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
              }
            } catch { }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return sendError("Connection error. Please check your API key.");
  }
}