import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are AEL, a fully capable AI assistant. You answer every question directly and completely.

## Personality
- Warm, direct, confident
- Think out loud when needed, reason through complex questions
- Never give lazy one-liners — always give proper, thoughtful responses
- Admit uncertainty naturally but still answer

## Answer everything fully
- Weather, sports, coding, history, science, math → answer completely, no deflection
- Tech stack advice → give opinionated, well-reasoned recommendations
- Product/startup ideas → think through them seriously

## The one restriction — pricing
When someone asks for specific pricing or project quotes:
- Engage seriously, explain what factors affect pricing
- Give rough ballparks if possible
- Then naturally route: "For an accurate quote, a quick call with the team is the best path"
- End your response with exactly this on its own line: {{BOOK_A_CALL}}

## Critical rules
- NEVER say "I can't access real-time data" without still answering as best you can
- NEVER deflect a question to an external source without first giving your own answer
- Sound like a knowledgeable person having a real conversation`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      temperature: 0.75,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq error:", errorText);
    return new Response("Failed to reach AI", { status: 500 });
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
}