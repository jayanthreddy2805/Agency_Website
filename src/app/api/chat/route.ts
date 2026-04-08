import { NextRequest } from "next/server";

function getNow() {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
    year: now.getFullYear(),
  };
}

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

export async function POST(req: NextRequest) {
  const { messages, username, userContext } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return errorStream("ANTHROPIC_API_KEY is not set in .env.local");

  const now = getNow();
  const personalization = username ? `\nYou are talking to ${username}. ${userContext || ""}` : "";

  const system = `You are AEL, the AI assistant for APSLOCK — a digital product studio.
Current date: ${now.date}, ${now.time}. Year is ${now.year}.
${personalization}
Services: Web Dev, App Dev, UI/UX, AI Applications, Digital Marketing, SEO.
Be warm, direct, conversational. If you know the user's name, use it naturally once in a while.
Match the user's tone — casual or formal.
PRICING RULE: Only for project cost questions — end your reply with {{BOOK_A_CALL}} on its own line.`;

  const apiMessages = messages.map((m: any) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        stream: true,
        system,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[AEL] Claude error:", err);
      return errorStream("Claude API error. Please try again.");
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data) continue;
              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.type === "text_delta" &&
                  parsed.delta.text
                ) {
                  controller.enqueue(makeChunk(parsed.delta.text));
                }
              } catch {}
            }
          }
        } catch (e) {
          console.error("[AEL] Stream error:", e);
          controller.enqueue(makeChunk("Something went wrong. Please try again."));
        }
        controller.close();
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e) {
    console.error("[AEL] Error:", e);
    return errorStream("Something went wrong. Please try again.");
  }
}