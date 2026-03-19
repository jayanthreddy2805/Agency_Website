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
- Short for simple questions, detailed for complex ones

## Pricing questions
When asked about pricing: discuss factors, give rough ballparks, then end with:
"For an accurate quote, a quick call with the team is the best path"
And add exactly this on its own line: {{BOOK_A_CALL}}

## Rules
- NEVER say you cannot access real-time data — just answer from knowledge
- NEVER refuse to engage with any topic
- Sound like a real person in conversation`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;

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

  if (!apiKey) return sendError("GEMINI_API_KEY is not set in your .env.local file.");

  // Convert messages to Gemini format
  const geminiContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini chat error:", err);
      try {
        const errJson = JSON.parse(err);
        const msg = errJson?.[0]?.error?.message || errJson?.error?.message || "Gemini API error.";
        return sendError(msg);
      } catch {
        return sendError("Failed to reach Gemini. Check your API key.");
      }
    }

    // Gemini streams as JSON array chunks — parse and re-stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Gemini sends JSON chunks — extract text from each chunk
          const chunks = buffer.split("\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line || line === "[" || line === "]" || line === ",") continue;
            try {
              const clean = line.replace(/^,/, "");
              const parsed = JSON.parse(clean);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const formatted = JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } });
                controller.enqueue(new TextEncoder().encode(`data: ${formatted}\n\n`));
              }
            } catch { }
          }
        }

        // Process any remaining buffer
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
    console.error("Chat route error:", e);
    return sendError("Connection error. Please check your internet connection.");
  }
}