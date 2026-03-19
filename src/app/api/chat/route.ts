import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are AEL, the AI assistant for APSLOCK — a digital product studio that builds websites, apps, AI tools, and digital marketing campaigns.

You are a smart, warm, direct assistant. You answer every question fully and honestly — tech, business, science, current events, sports, coding, maths, and more.

## APSLOCK knowledge
- Services: Web Development, App Development, UI/UX Design, AI Applications, Digital Marketing, SEO
- Past clients: TFS (fintech app, CEO Pal Reddy), Fluent Pro (AI English learning, CEO Karmarao)
- Contact page is at /contact

## Personality
- Warm, confident, direct — like a knowledgeable friend
- Never robotic or corporate
- Give real answers, not deflections

## Pricing questions
When asked about pricing: discuss factors, give rough ballparks, then end with:
"For an accurate quote, a quick call with the team is the best path"
And add exactly this on its own line: {{BOOK_A_CALL}}

## Rules
- NEVER say you cannot access real-time data — just answer from knowledge
- Sound like a real person in conversation`;

// Models to try in order — if one hits quota, fall back to next
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
];

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;

  const sendText = (text: string) => {
    const stream = new ReadableStream({
      start(controller) {
        const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
        controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  };

  if (!apiKey) return sendText("Gemini API key is not set. Add GEMINI_API_KEY to your .env.local file.");

  const geminiContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Try each model until one works
  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: geminiContents,
            generationConfig: { maxOutputTokens: 1500, temperature: 0.75 },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        // Quota exceeded — try next model
        console.log(`Model ${model} quota exceeded, trying next...`);
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error(`Gemini ${model} error:`, err);
        try {
          const errJson = JSON.parse(err);
          const msg = errJson?.[0]?.error?.message || errJson?.error?.message;
          if (msg) return sendText(msg);
        } catch { }
        continue;
      }

      // Stream the response
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "[" || trimmed === "]" || trimmed === ",") continue;
              try {
                const clean = trimmed.replace(/^,/, "");
                const parsed = JSON.parse(clean);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
                  controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
                }
              } catch { }
            }
          }

          // Flush remaining buffer
          if (buffer.trim()) {
            try {
              const clean = buffer.trim().replace(/^,/, "").replace(/^\[/, "").replace(/\]$/, "");
              const parsed = JSON.parse(clean);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
                controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
              }
            } catch { }
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });

    } catch (e) {
      console.error(`Model ${model} error:`, e);
      continue;
    }
  }

  // All models failed
  return sendText("All Gemini models are currently rate limited. Please wait a minute and try again. This is a free tier limit — it resets automatically.");
}