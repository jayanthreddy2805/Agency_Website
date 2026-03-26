import { NextRequest } from "next/server";

const LLAMA = "llama-3.3-70b-versatile";
const DEEPSEEK_MODEL = "deepseek-reasoner";
const DEEPSEEK_BASE = "https://api.deepseek.com";

// ─── Real-time date/time ──────────────────────────────────────────────
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

function isSimpleQuery(text: string): boolean {
  return /^(hi|hello|hey|how are you|what is apslock|what do you do|your services|book a call|tell me about yourself)\s*[?!.]?$/i.test(
    text.trim()
  );
}

// ─── Smart query builder ──────────────────────────────────────────────
function buildSearchQuery(userMsg: string, context: string): string {
  const msg = userMsg.toLowerCase();
  if (/\btime\b/.test(msg)) {
    const loc = (userMsg + " " + context).match(/in ([A-Z][a-zA-Z\s]+?)(?:\s*[?.!,]|$)/)?.[1]?.trim();
    return loc ? `current time in ${loc} right now` : `current time ${userMsg}`;
  }
  if (/weather|temperature|rain|sunny|cloudy|forecast|humidity|celsius|fahrenheit/i.test(msg)) {
    const loc = (userMsg + " " + context).match(/in ([A-Z][a-zA-Z\s,]+?)(?:\s*[?.!]|$)/i)?.[1]?.trim();
    return loc ? `current weather ${loc} today temperature celsius` : `current weather today ${userMsg}`;
  }
  if (/\bdate\b|\btoday\b|\bday\b|\bmonth\b|\byear\b/.test(msg)) return `today's date ${new Date().getFullYear()}`;
  if (/score|match|ipl|cricket|football|soccer|nba|nfl|tennis|f1/i.test(msg)) return `${userMsg} latest score result today ${new Date().getFullYear()}`;
  if (/stock|share|price|crypto|bitcoin|ethereum|market|sensex|nifty/i.test(msg)) return `${userMsg} current price today`;
  if (/news|latest|recent|happened|update|announced|launched/i.test(msg)) return `${userMsg} ${new Date().getFullYear()} latest news`;
  if (/who is|who are|ceo|founder|president|prime minister/i.test(msg)) return `${userMsg} ${new Date().getFullYear()}`;
  return userMsg;
}

// ─── STEP 0: Query Optimizer ──────────────────────────────────────────
interface OptimizedQueries {
  tavilyQuery: string;
  llamaQuery: string;
  deepseekContext: string;
}

async function optimizeQuery(
  userInput: string,
  history: any[],
  groqKey: string,
  now: ReturnType<typeof getNow>,
  userContext: string
): Promise<OptimizedQueries> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: LLAMA,
        max_tokens: 400,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `You are a query optimization expert. Take a user's raw input and rewrite it into THREE optimized versions.
Current date: ${now.date}, ${now.time}. Year: ${now.year}.
${userContext ? `\nUSER CONTEXT:\n${userContext}` : ""}

OUTPUT EXACTLY THIS JSON — nothing else:
{
  "tavilyQuery": "optimized search engine query — keyword focused, specific, includes year/location if relevant, max 15 words",
  "llamaQuery": "optimized question for LLaMA AI — full context, conversational, makes intent crystal clear, includes all implicit details",
  "deepseekContext": "precise analytical context for DeepSeek — what exactly needs to be verified, what facts matter most"
}`,
          },
          ...history.slice(-4),
          {
            role: "user",
            content: `Raw input: "${userInput}"\n\nRewrite into three optimized versions. If casual or vague, infer what user actually wants.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error("Optimizer failed");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log(`[Optimizer] Tavily: "${parsed.tavilyQuery}"`);
    console.log(`[Optimizer] LLaMA: "${parsed.llamaQuery}"`);
    return {
      tavilyQuery: parsed.tavilyQuery || userInput,
      llamaQuery: parsed.llamaQuery || userInput,
      deepseekContext: parsed.deepseekContext || userInput,
    };
  } catch (e) {
    console.error("[Optimizer] Failed:", e);
    return { tavilyQuery: userInput, llamaQuery: userInput, deepseekContext: userInput };
  }
}

// ─── STEP 1A: Tavily ─────────────────────────────────────────────────
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
    if (!res.ok) return "";
    const data = await res.json();
    const parts: string[] = [];
    if (data.answer) parts.push(`Direct answer: ${data.answer}`);
    if (data.results?.length) {
      parts.push(...data.results.slice(0, 3).map((r: any) => `• ${r.title}: ${r.content?.slice(0, 300)}`));
    }
    return parts.join("\n");
  } catch { return ""; }
}

// ─── STEP 1B: LLaMA raw answer ───────────────────────────────────────
async function fetchLlamaRawAnswer(
  optimizedQuery: string,
  history: any[],
  groqKey: string,
  now: ReturnType<typeof getNow>,
  userContext: string
): Promise<string> {
  try {
    console.log(`[LLaMA Raw] Query: "${optimizedQuery}"`);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: LLAMA,
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a knowledgeable AI. Answer the question from training knowledge only.
Current date: ${now.date}, ${now.time}. Year: ${now.year}. Never say 2024.
${userContext ? `\nUSER CONTEXT (use this to personalize):\n${userContext}` : ""}
Be factual and direct. This answer will be verified by a reasoning model.
APSLOCK: digital product studio — Web Dev, App Dev, UI/UX, AI, Marketing, SEO.`,
          },
          ...history,
          { role: "user", content: optimizedQuery },
        ],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch { return ""; }
}

// ─── STEP 2: DeepSeek R1 Analyzer ────────────────────────────────────
async function analyzeWithDeepSeek(
  originalQuestion: string,
  deepseekContext: string,
  tavilyAnswer: string,
  llamaAnswer: string,
  deepseekKey: string,
  now: ReturnType<typeof getNow>
): Promise<{ verifiedAnswer: string; reasoning: string }> {
  try {
    console.log(`[DeepSeek R1] Analyzing...`);
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        max_tokens: 1200,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `You are an expert answer analyzer and verifier.

RULES:
- If Tavily has live/current data → strongly prefer it
- If Tavily is empty/irrelevant → use LLaMA
- If both agree → merge best parts
- If contradicting → Tavily for recent facts, LLaMA for timeless knowledge
- Always verify answer addresses what user actually asked

Current date: ${now.date}, ${now.time}. Year: ${now.year}.

OUTPUT EXACTLY:
REASONING: [one sentence — which answer you chose and why]
VERIFIED_ANSWER: [clean verified answer text only]`,
          },
          {
            role: "user",
            content: `ORIGINAL QUESTION: "${originalQuestion}"
ANALYTICAL CONTEXT: "${deepseekContext}"

=== ANSWER A: LIVE WEB SEARCH (Tavily) ===
${tavilyAnswer || "No live web data returned."}

=== ANSWER B: AI TRAINING KNOWLEDGE (LLaMA) ===
${llamaAnswer || "No training answer available."}

Analyze both. Output REASONING then VERIFIED_ANSWER.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { verifiedAnswer: tavilyAnswer || llamaAnswer || "", reasoning: "Fallback: DeepSeek unavailable" };
    }
    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const reasoningMatch = content.match(/REASONING:\s*(.+?)(?=VERIFIED_ANSWER:|$)/si);
    const answerMatch = content.match(/VERIFIED_ANSWER:\s*([\s\S]+?)$/si);
    const reasoning = reasoningMatch?.[1]?.trim() || "DeepSeek analyzed both answers";
    const verifiedAnswer = answerMatch?.[1]?.trim() || content;
    console.log(`[DeepSeek R1] Reasoning: ${reasoning}`);
    return { verifiedAnswer, reasoning };
  } catch (e) {
    return { verifiedAnswer: tavilyAnswer || llamaAnswer || "", reasoning: "Fallback: DeepSeek error" };
  }
}

// ─── Stream helpers ───────────────────────────────────────────────────
function makeChunk(text: string): Uint8Array {
  const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
  return new TextEncoder().encode(`data: ${formatted}\n\n`);
}

function errorStream(text: string): Response {
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(makeChunk(text)); controller.close(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

async function pipeGroqStream(rawBody: ReadableStream, controller: ReadableStreamDefaultController) {
  const reader = rawBody.getReader();
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
        if (text) controller.enqueue(makeChunk(text));
      } catch {}
    }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, username, userContext, debugMode } = await req.json();
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (!groqKey) return errorStream("GROQ_API_KEY is not set in .env.local");

  const now = getNow();
  const lastMsg = messages[messages.length - 1]?.content || "";
  const history = messages.slice(0, -1);
  const recentContext = messages.slice(-4).map((m: any) => m.content).join(" ");

  // Build personalization string
  const personalization = username
    ? `\nYou are talking to ${username}. ${userContext || ""}`
    : "";

  try {
    // ── Simple greetings — skip full pipeline ──
    if (isSimpleQuery(lastMsg)) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
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
${personalization}
Services: Web Dev, App Dev, UI/UX, AI Applications, Digital Marketing, SEO.
Be warm, direct, conversational. If you know the user's name, use it naturally.
PRICING RULE: Only for project cost questions — end with {{BOOK_A_CALL}} on its own line.`,
            },
            ...messages,
          ],
        }),
      });
      if (!response.ok) return errorStream("Having trouble connecting.");
      const stream = new ReadableStream({
        async start(controller) {
          await pipeGroqStream(response.body!, controller);
          controller.close();
        },
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    }

    // ── Full pipeline ──
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // STEP 0: Query Optimizer
          if (debugMode) {
            controller.enqueue(makeChunk(`🔍 **Query Optimizer** — understanding your question...\n`));
          }
          const optimized = await optimizeQuery(lastMsg, history, groqKey, now, userContext || "");
          if (debugMode) {
            controller.enqueue(makeChunk(`↳ Tavily query: *"${optimized.tavilyQuery}"*\n`));
            controller.enqueue(makeChunk(`↳ LLaMA query: *"${optimized.llamaQuery}"*\n\n`));
          }

          // STEP 1: Parallel Tavily + LLaMA
          if (debugMode) {
            controller.enqueue(makeChunk(`⚡ **Running Tavily + LLaMA in parallel...**\n`));
          }
          const [tavilyAnswer, llamaAnswer] = await Promise.all([
            tavilyKey ? fetchTavilyAnswer(optimized.tavilyQuery, tavilyKey) : Promise.resolve(""),
            fetchLlamaRawAnswer(optimized.llamaQuery, history, groqKey, now, userContext || ""),
          ]);

          if (debugMode) {
            controller.enqueue(makeChunk(`\n🌐 **Tavily Answer:**\n${tavilyAnswer || "No live data found."}\n\n`));
            controller.enqueue(makeChunk(`🤖 **LLaMA Answer:**\n${llamaAnswer || "No training answer."}\n\n`));
          }

          // STEP 2: DeepSeek Analyzer
          if (debugMode) {
            controller.enqueue(makeChunk(`🔬 **DeepSeek R1 Analyzing...**\n`));
          }
          let verifiedAnswer: string;
          let reasoning: string;

          if (deepseekKey) {
            const result = await analyzeWithDeepSeek(lastMsg, optimized.deepseekContext, tavilyAnswer, llamaAnswer, deepseekKey, now);
            verifiedAnswer = result.verifiedAnswer;
            reasoning = result.reasoning;
          } else {
            verifiedAnswer = tavilyAnswer || llamaAnswer;
            reasoning = "No DeepSeek key — using best available";
          }

          if (debugMode) {
            controller.enqueue(makeChunk(`↳ Reasoning: *${reasoning}*\n\n---\n✅ **Final Answer:**\n\n`));
          }

          // STEP 3: LLaMA Formatter — streamed
          const formatterRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
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
${personalization}

A verified accurate answer has been prepared. Your job:
- Reformat it naturally — warm, conversational, like a knowledgeable friend
- Keep ALL facts exactly accurate — do NOT change any data
- If you know the user's name, use it naturally once in a while (not every message)
- Match the user's conversation style — if they're casual, be casual; if formal, be slightly more formal
- Reference past conversation context when relevant to make it feel continuous
- NEVER sound like a bot reading a report
- Be concise but complete

APSLOCK: Web Dev, App Dev, UI/UX, AI Applications, Marketing, SEO.
PRICING RULE: Only for project cost questions — end with {{BOOK_A_CALL}} on its own line.`,
                },
                ...history,
                {
                  role: "user",
                  content: `My question: "${lastMsg}"\n\nVerified answer to reformat naturally:\n${verifiedAnswer}`,
                },
              ],
            }),
          });

          if (!formatterRes.ok) {
            controller.enqueue(makeChunk(verifiedAnswer));
            controller.close();
            return;
          }

          await pipeGroqStream(formatterRes.body!, controller);
          controller.close();
        } catch (e) {
          console.error("[AEL Stream] Error:", e);
          controller.enqueue(makeChunk("Something went wrong. Please try again."));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e) {
    console.error("[AEL] Pipeline error:", e);
    return errorStream("Something went wrong. Please try again.");
  }
}