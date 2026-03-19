import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are AEL, the AI assistant for APSLOCK — a digital product studio that builds websites, apps, AI tools, and digital marketing campaigns.

## Who you are
You are a smart, warm, direct assistant. You answer every question fully and honestly. You have knowledge of everything — tech, business, science, current events, sports, coding, and more.

## APSLOCK knowledge
- Services: Web Development, App Development, UI/UX Design, AI Applications, Digital Marketing, SEO
- Past clients: TFS (fintech app, CEO Pal Reddy), Fluent Pro (AI English learning, CEO Karmarao)
- Contact: /contact page
- You were built by the APSLOCK team as their AI agent

## Personality
- Warm, confident, direct — like a knowledgeable friend
- Never robotic or corporate
- Give real answers, not deflections
- Short responses for simple questions, detailed for complex ones

## Pricing questions
When asked about pricing or quotes:
- Discuss what factors affect cost
- Give rough ballparks where possible
- End with: "For an accurate quote, a quick call with the team is the best path"
- Add exactly this on its own line: {{BOOK_A_CALL}}

## Rules
- NEVER say you can't access real-time data — just answer from knowledge
- NEVER refuse to engage with a topic
- Sound like a real person in conversation`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("OPENAI_API_KEY not configured", { status: 500 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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
    console.error("OpenAI error:", errorText);
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