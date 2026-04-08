import { NextRequest } from "next/server";
import { NLU_LOOKUP } from "./nlu-data";

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything — like my competitors' promises.",
  "Why did the developer go broke? He used up all his cache.",
  "Why do Java developers wear glasses? Because they don't C sharp!",
  "What's a website's favorite music? Heavy metal — lots of tags!",
  "Why did the startup fail? Too many pivots, not enough product. Call APSLOCK next time!",
];

function getNow() {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
    year: now.getFullYear(),
  };
}

function localIntent(t: string): object | null {
  const s = t.toLowerCase().trim();

  if (
    /(open|show|launch|start).*(chat|ael chat|text|message)/i.test(s) ||
    s === "open chat" || s === "chat"
  )
    return { speech: "Opening AEL chat for you.", actions: [{ type: "open_ael_chat" }], keepListening: true, mood: "happy" };

  if (/^(bye|goodbye|close|stop|exit|dismiss|shut down|turn off|see you|that.?s all|done|finished)[\s!.]*$/i.test(s))
    return { speech: "See you.", actions: [], keepListening: false, mood: "neutral" };

  if (/(scroll|go|show|take|open|see|view).*(service)/i.test(s))
    return { speech: "Sure.", actions: [{ type: "scroll_to", target: "services" }], keepListening: true, mood: "focused" };
  if (/(scroll|go|show|take|open|see|view).*(work|portfolio|project)/i.test(s))
    return { speech: "Here you go.", actions: [{ type: "scroll_to", target: "portfolio" }], keepListening: true, mood: "focused" };
  if (/(scroll|go|show|take|open|see|view).*(faq|question)/i.test(s))
    return { speech: "Taking you there.", actions: [{ type: "scroll_to", target: "faq" }], keepListening: true, mood: "focused" };
  if (/(scroll|go|show|take|open|see|view).*(testimonial|review|client|achiev)/i.test(s))
    return { speech: "On it.", actions: [{ type: "scroll_to", target: "achievements" }], keepListening: true, mood: "focused" };
  if (/scroll.*(up|top)|go.*top|back.*top/i.test(s))
    return { speech: "Going to the top.", actions: [{ type: "scroll_to", target: "hero" }], keepListening: true, mood: "focused" };

  if (/(go|open|take|navigate|show).*(contact|reach)/i.test(s))
    return { speech: "Going to contact.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" };
  if (/(go|back|take|navigate).*(home|main)/i.test(s))
    return { speech: "Going home.", actions: [{ type: "navigate", page: "/" }], keepListening: true, mood: "focused" };
  if (/book.*(call|meeting)|schedule.*(call|meeting)/i.test(s))
    return { speech: "Taking you to book a call.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" };

  const nameMatch = s.match(/(?:name is|my name is|fill.*name|i am|call me)\s+([a-zA-Z\s]{2,30}?)(?:\s*$|,|\.|and)/i);
  if (nameMatch?.[1]?.trim())
    return { speech: "Got it.", actions: [{ type: "fill", selector: 'input[placeholder="John Doe"]', value: nameMatch[1].trim() }], keepListening: true, mood: "happy" };

  const emailMatch = s.match(/(?:email is|my email|fill.*email)\s+([\w.+-]+@[\w.-]+\.[a-z]+)/i);
  if (emailMatch?.[1])
    return { speech: "Done.", actions: [{ type: "fill", selector: 'input[type="email"]', value: emailMatch[1] }], keepListening: true, mood: "happy" };

  if (/submit|send.*(form|it)|click.*submit/i.test(s))
    return { speech: "Submitting now.", actions: [{ type: "click", selector: 'button[type="submit"]' }], keepListening: true, mood: "happy" };

  if (/^(hi|hey|hello|howdy|sup|yo|hii)[\s!.]*$/i.test(s))
    return { speech: "Hey! What do you need?", actions: [], keepListening: true, mood: "happy" };
  if (/how are you/i.test(s))
    return { speech: "Running great! What can I do for you?", actions: [], keepListening: true, mood: "happy" };
  if (/thank/i.test(s))
    return { speech: "Anytime!", actions: [], keepListening: true, mood: "happy" };

  if (/what is apslock|about apslock/i.test(s))
    return { speech: "APSLOCK is a digital product studio that builds websites, apps, AI tools, and runs marketing campaigns for startups and businesses.", actions: [], keepListening: true, mood: "neutral" };
  if (/service|what.*offer/i.test(s) && !/scroll|go|show/i.test(s))
    return { speech: "APSLOCK offers web development, app development, UI UX design, AI applications, digital marketing, and SEO.", actions: [], keepListening: true, mood: "neutral" };
  if (/price|cost|how much|pricing/i.test(s))
    return { speech: "Pricing depends on scope. Book a call with the team for an accurate quote.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "neutral" };

  return null;
}

function buildSystemPrompt(): string {
  const { date, time, year } = getNow();
  return `You are AEL, APSLOCK's voice AI agent. Answer in 1-3 short sentences maximum. Casual, warm tone.
CURRENT DATE & TIME: ${date}, ${time}. Current year is ${year}.
APSLOCK is a digital product studio: Web Dev, App Dev, UI/UX, AI, Marketing, SEO.
Return ONLY valid JSON with no markdown, no code fences, nothing else:
{"speech":"your reply here","actions":[],"keepListening":true,"mood":"neutral"}
Set keepListening to false ONLY for goodbye/bye/close/stop intents.
mood options: neutral, happy, focused, thinking`;
}

export async function POST(req: NextRequest) {
  const { history, currentPage } = await req.json();
  const lastMsg = history[history.length - 1]?.content || "";
  const clean = lastMsg.includes("]\n")
    ? lastMsg.split("]\n").slice(1).join("]\n").trim()
    : lastMsg.trim();

  // Step 1: Local intent — zero API cost
  const local = localIntent(clean);
  if (local) return Response.json(local);

  // Step 2: NLU lookup — zero API cost
  const nluKey = clean.toLowerCase().trim();
  if (NLU_LOOKUP[nluKey]) {
    const [intent, response] = NLU_LOOKUP[nluKey];
    if (intent === "J") {
      const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
      return Response.json({ speech: joke, actions: [], keepListening: true, mood: "happy" });
    }
    if (intent === "X") {
      return Response.json({ speech: response, actions: [], keepListening: false, mood: "neutral" });
    }
    if (response !== "__SEARCH__" && response !== "__CONTACT__") {
      return Response.json({ speech: response, actions: [], keepListening: true, mood: "neutral" });
    }
    if (response === "__CONTACT__") {
      return Response.json({ speech: "Let me take you to our contact page.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" });
    }
  }

  // Step 3: Claude — only reached for things not covered above
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ speech: "Add ANTHROPIC_API_KEY to your .env.local file.", actions: [], keepListening: true, mood: "neutral" });
  }

  const contents = history.slice(-8).map((h: { role: string; content: string }) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: buildSystemPrompt(),
        messages: contents,
      }),
    });

    if (!res.ok) {
      console.error("[VoiceAEL] Claude error:", await res.text());
      return Response.json({ speech: "Give me a second.", actions: [], keepListening: true, mood: "neutral" });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";

    let parsed: any;
    try {
      const stripped = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(stripped);
    } catch {
      parsed = { speech: text.slice(0, 200), actions: [], keepListening: true, mood: "neutral" };
    }

    if (!parsed.speech) parsed.speech = "I'm here.";
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (parsed.keepListening === undefined) parsed.keepListening = true;

    return Response.json(parsed);
  } catch {
    return Response.json({ speech: "Something went wrong.", actions: [], keepListening: true, mood: "neutral" });
  }
}