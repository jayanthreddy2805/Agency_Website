import { NextRequest } from "next/server";

const LLAMA = "llama-3.3-70b-versatile";
const DEEPSEEK = "deepseek-r1-distill-llama-70b";

// ─── Real-time date/time ──────────────────────────────────────────────
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

// ─── Skip search for greetings & pure internal questions ──────────────
function skipSearch(text: string): boolean {
  return /^(hi|hello|hey|how are you|what is apslock|what do you do|your services|book a call|tell me about yourself)\s*[?!.]?$/i.test(
    text.trim()
  );
}

// ─── Smart Tavily query builder ───────────────────────────────────────
function buildSearchQuery(userMsg: string, context: string): string {
  const msg = userMsg.toLowerCase();

  if (/\btime\b/.test(msg)) {
    const loc = (userMsg + " " + context).match(
      /in ([A-Z][a-zA-Z\s]+?)(?:\s*[?.!,]|$)/
    )?.[1]?.trim();
    return loc ? `current time in ${loc} right now` : `current time ${userMsg}`;
  }

  if (/weather|temperature|rain|sunny|cloudy|forecast|humidity|celsius|fahrenheit/i.test(msg)) {
    const loc = (userMsg + " " + context).match(
      /in ([A-Z][a-zA-Z\s,]+?)(?:\s*[?.!]|$)/i
    )?.[1]?.trim();
    return loc
      ? `current weather ${loc} today temperature celsius`
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
    return `${userMsg} ${new Date().getFullYear()} latest news`;
  }

  if (/who is|who are|ceo|founder|president|prime minister/i.test(msg)) {
    return `${userMsg} ${new Date().getFullYear()}`;
  }

  return userMsg;
}

// ─── STEP 1A: Tavily live web search ─────────────────────────────────
async function fetchTavilyAnswer(query: string, apiKey: string): Promise<string> {
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
      console.error(`[Tavily] Error ${res.status}`);
      return "";
    }
    const data = await res.json();
    const parts: string[] = [];
    if (data.answer) parts.push(`Direct answer: ${data.answer}`);
    if (data.results?.length) {
      parts.push(
        ...data.results.slice(0, 3).map((r: any) =>
          `• ${r.title}: ${r.content?.slice(0, 300)}`
        )
      );
    }
    const result = parts.join("\n");
    console.log(`[Tavily] Returned ${result.length} chars`);
    return result;
  } catch (e) {
    console.error("[Tavily] Failed:", e);
    return "";
  }
}

// ─── STEP 1B: LLaMA raw training knowledge answer ────────────────────
async function fetchLlamaRawAnswer(
  userMsg: string,
  history: any[],
  groqKey: string,
  now: ReturnType<typeof getNow>
): Promise<string> {
  try {
    console.log(`[LLaMA Raw] Fetching training knowledge answer`);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: LLAMA,
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a knowledgeable AI. Answer the user's question from your training knowledge only.
Current date: ${now.date}, ${now.time}. Year is ${now.year}. Never say it is 2024.
Be factual and direct. This answer will be verified by an analyzer — just give your most accurate knowledge-based answer.
APSLOCK is a digital product studio offering Web Dev, App Dev, UI/UX, AI Applications, Marketing, SEO.`,
          },
          ...history,
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[LLaMA Raw] Error:", await res.text());
      return "";
    }
    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || "";
    console.log(`[LLaMA Raw] Returned ${answer.length} chars`);
    return answer;
  } catch (e) {
    console.error("[LLaMA Raw] Failed:", e);
    return "";
  }
}

// ─── STEP 2: DeepSeek R1 Analyzer ────────────────────────────────────
async function analyzeWithDeepSeek(
  userQuestion: string,
  tavilyAnswer: string,
  llamaAnswer: string,
  groqKey: string,
  now: ReturnType<typeof getNow>
): Promise<string> {
  try {
    console.log(`[DeepSeek R1] Analyzing both answers`);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK,
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `You are an expert answer analyzer and verifier. Your job is to:
1. Carefully read the user's question
2. Study both answers provided — one from live web search, one from AI training knowledge
3. Reason step by step about which answer is more accurate, current, and relevant
4. Produce a single verified, accurate, merged best answer

RULES FOR ANALYSIS:
- If Tavily has live/current data (prices, weather, scores, news, time) → strongly prefer it
- If Tavily result is empty or clearly irrelevant → use LLaMA training knowledge
- If both answers agree → confidence is high, use either
- If they contradict → prefer Tavily for recent facts, prefer LLaMA for timeless knowledge
- Always check: does the answer actually address what the user asked?
- Remove any redundancy, inaccuracies, or outdated info

Current date: ${now.date}, ${now.time}. Year: ${now.year}.

Output ONLY the verified best answer text. No explanations of your reasoning. No meta-commentary. Just the clean verified answer that will be given to the user.`,
          },
          {
            role: "user",
            content: `USER QUESTION: "${userQuestion}"

=== ANSWER A: LIVE WEB SEARCH (Tavily) ===
${tavilyAnswer || "No live web data returned for this query."}

=== ANSWER B: AI TRAINING KNOWLEDGE (LLaMA) ===
${llamaAnswer || "No training knowledge answer available."}

Analyze both answers. Reason through which is more accurate and relevant. Then output the single best verified answer.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[DeepSeek R1] Error:", await res.text());
      // Fallback: return best available answer
      return tavilyAnswer || llamaAnswer || "";
    }
    const data = await res.json();
    // DeepSeek R1 sometimes wraps reasoning in <think> tags — strip them
    let answer = data.choices?.[0]?.message?.content || "";
    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    console.log(`[DeepSeek R1] Verified answer: ${answer.length} chars`);
    return answer;
  } catch (e) {
    console.error("[DeepSeek R1] Failed:", e);
    return tavilyAnswer || llamaAnswer || "";
  }
}

// ─── STEP 3: LLaMA Formatter (streamed to user) ───────────────────────
async function formatAndStream(
  userQuestion: string,
  verifiedAnswer: string,
  history: any[],
  groqKey: string,
  now: ReturnType<typeof getNow>
): Promise<ReadableStream> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: LLAMA,
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are AEL, the AI assistant for APSLOCK — a digital product studio.

CURRENT DATE & TIME: ${now.date}, ${now.time}. Year is ${now.year}.

A verified, accurate answer has been prepared for the user's question. Your job is to:
- Take the verified answer and reformat it naturally
- Make it warm, conversational, like a knowledgeable friend
- Keep all the accurate information intact — do NOT change facts
- Match the user's tone and question style
- Be concise but complete
- Never sound robotic

APSLOCK knowledge:
- Services: Web Dev, App Dev, UI/UX Design, AI Applications, Digital Marketing, SEO
- Clients: TFS fintech app (CEO Pal Reddy), Fluent Pro AI English learning (CEO Karmarao)
- Contact: /contact page

PRICING RULE: ONLY for specific project cost/quote questions — end with {{BOOK_A_CALL}} on its own line. NEVER for weather, time, date, news, or general questions.`,
        },
        ...history,
        {
          role: "user",
          content: `My question was: "${userQuestion}"

Here is the verified accurate answer to format naturally:
${verifiedAnswer}

Please reformat this into a natural, warm, conversational response while keeping all facts accurate.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[LLaMA Formatter] Error:", err);
    throw new Error("Formatter failed");
  }

  return response.body!;
}

// ─── Error stream helper ──────────────────────────────────────────────
function errorStream(text: string): Response {
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
}

// ─── Main handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (!groqKey) return errorStream("GROQ_API_KEY is not set in .env.local");

  const now = getNow();
  const lastMsg = messages[messages.length - 1]?.content || "";
  const history = messages.slice(0, -1); // all except last user message
  const recentContext = messages
    .slice(-4)
    .map((m: any) => m.content)
    .join(" ");

  // ── Skip search for greetings ──
  const shouldSearch = tavilyKey && !skipSearch(lastMsg);

  try {
    let tavilyAnswer = "";
    let llamaAnswer = "";

    if (shouldSearch) {
      // STEP 1: Run Tavily + LLaMA in PARALLEL simultaneously
      console.log("[AEL] Running Tavily + LLaMA in parallel...");
      const query = buildSearchQuery(lastMsg, recentContext);

      const [tavilyResult, llamaResult] = await Promise.all([
        fetchTavilyAnswer(query, tavilyKey!),
        fetchLlamaRawAnswer(lastMsg, history, groqKey, now),
      ]);

      tavilyAnswer = tavilyResult;
      llamaAnswer = llamaResult;

      // STEP 2: DeepSeek R1 analyzes both
      console.log("[AEL] DeepSeek R1 analyzing...");
      const verifiedAnswer = await analyzeWithDeepSeek(
        lastMsg,
        tavilyAnswer,
        llamaAnswer,
        groqKey,
        now
      );

      // STEP 3: LLaMA formats and streams to user
      console.log("[AEL] LLaMA formatting final answer...");
      const rawStream = await formatAndStream(
        lastMsg,
        verifiedAnswer,
        history,
        groqKey,
        now
      );

      // Pipe the Groq SSE stream into our response format
      const stream = new ReadableStream({
        async start(controller) {
          const reader = rawStream.getReader();
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
    } else {
      // For greetings / pure APSLOCK questions — skip search, just LLaMA directly
      console.log("[AEL] Simple query — LLaMA direct response");
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: LLAMA,
            max_tokens: 1500,
            temperature: 0.7,
            stream: true,
            messages: [
              {
                role: "system",
                content: `You are AEL, the AI assistant for APSLOCK — a digital product studio.
Current date: ${now.date}, ${now.time}. Year is ${now.year}.
Services: Web Dev, App Dev, UI/UX, AI Applications, Digital Marketing, SEO.
Clients: TFS fintech app, Fluent Pro AI English learning.
Be warm, direct, conversational like a knowledgeable friend.
PRICING RULE: Only for project cost questions — end with {{BOOK_A_CALL}} on its own line.`,
              },
              ...messages,
            ],
          }),
        }
      );

      if (!response.ok) {
        return errorStream("Having trouble connecting. Please try again.");
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
    }
  } catch (e) {
    console.error("[AEL] Pipeline error:", e);
    return errorStream("Something went wrong. Please try again.");
  }
}