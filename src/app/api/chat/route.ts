import { NextRequest } from "next/server";

const getCurrentDateString = () => {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

const SYSTEM_PROMPT = `You are AEL, the AI assistant for APSLOCK — a digital product studio.

TODAY'S DATE: ${getCurrentDateString()}. Always use this date when answering date, time, or current event questions. Never say it is 2024 — it is 2026.

You are smart, warm, direct. You answer every question fully using the latest web search results provided to you. Always prefer web search data over your training knowledge for anything factual or current.

APSLOCK knowledge:
- Services: Web Development, App Development, UI/UX Design, AI Applications, Digital Marketing, SEO
- Clients: TFS fintech app (CEO Pal Reddy), Fluent Pro AI English learning (CEO Karmarao)
- Contact: /contact page

Personality: warm, confident, like a knowledgeable friend. Never robotic.

When you have web search results, always use them to answer — they are more up to date than your training.

PRICING RULE: Only when someone asks for a specific price quote or cost estimate for a project, end your response with {{BOOK_A_CALL}} on its own line at the very end — nothing after it. Do NOT add {{BOOK_A_CALL}} for weather, time, date, news, sports, general knowledge or casual questions.

Rules:
- ALWAYS use web search results when provided — they are real-time data
- Never refuse any topic
- Sound like a real person
- For date/time questions: use today's date above and be precise`;

async function searchWeb(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 4,
        include_answer: true,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    if (data.answer) return `Web search result: ${data.answer}`;
    const results = data.results
      ?.slice(0, 3)
      .map((r: any) => `${r.title}: ${r.content?.slice(0, 300)}`)
      .join("\n");
    return results ? `Web search results:\n${results}` : "";
  } catch { return ""; }
}

// Skip search only for pure APSLOCK internal questions or greetings
function skipSearch(text: string): boolean {
  return /^(hi|hello|hey|how are you|what is apslock|what do you do|your services|book a call|contact|tell me about yourself)\s*[?!.]?$/i.test(text.trim());
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

  const lastMsg = messages[messages.length - 1]?.content || "";
  let searchContext = "";
  if (tavilyKey && !skipSearch(lastMsg)) {
    searchContext = await searchWeb(lastMsg, tavilyKey);
  }

  const systemWithSearch = searchContext
    ? `${SYSTEM_PROMPT}\n\n---\nLIVE WEB DATA (use this to answer — more accurate than your training):\n${searchContext}\n---`
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