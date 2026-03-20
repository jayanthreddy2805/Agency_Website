import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────
// LOCAL INTENT ENGINE — handles commands instantly, no API needed
// Only falls through to Gemini for real questions/conversation
// ─────────────────────────────────────────────────────────────────
function localIntent(text: string, page: string): object | null {
  const t = text.toLowerCase().trim();

  // ── SCROLL COMMANDS ──────────────────────────────────────────────
  if (/serv(ice)?s?/i.test(t) && /(scroll|go|show|take|open|see|view)/i.test(t))
    return { speech: "Sure.", actions: [{ type: "scroll_to", target: "services" }], keepListening: true, mood: "focused" };
  if (/(our work|portfolio|work|project)/i.test(t) && /(scroll|go|show|take|open|see|view)/i.test(t))
    return { speech: "Here you go.", actions: [{ type: "scroll_to", target: "portfolio" }], keepListening: true, mood: "focused" };
  if (/(faq|question)/i.test(t) && /(scroll|go|show|take|open|see|view)/i.test(t))
    return { speech: "Taking you there.", actions: [{ type: "scroll_to", target: "faq" }], keepListening: true, mood: "focused" };
  if (/(testimonial|review|client|achiev)/i.test(t) && /(scroll|go|show|take|open|see|view)/i.test(t))
    return { speech: "On it.", actions: [{ type: "scroll_to", target: "achievements" }], keepListening: true, mood: "focused" };

  // ── NAVIGATE COMMANDS ────────────────────────────────────────────
  if (/(contact|reach|touch)/i.test(t) && /(go|open|take|navigate|page)/i.test(t))
    return { speech: "Going to contact.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" };
  if (/(home|back|main)/i.test(t) && /(go|back|take|navigate)/i.test(t))
    return { speech: "Going home.", actions: [{ type: "navigate", page: "/" }], keepListening: true, mood: "focused" };
  if (/(about)/i.test(t) && /(go|open|take|navigate|page)/i.test(t))
    return { speech: "Going to about.", actions: [{ type: "navigate", page: "/about" }], keepListening: true, mood: "focused" };

  // ── SCROLL UP/DOWN ───────────────────────────────────────────────
  if (/scroll (up|top)/i.test(t))
    return { speech: "Going to top.", actions: [{ type: "scroll_to", target: "hero" }], keepListening: true, mood: "focused" };
  if (/scroll down/i.test(t))
    return { speech: "Scrolling down.", actions: [{ type: "scroll_to", target: "faq" }], keepListening: true, mood: "focused" };

  // ── FORM FILL ────────────────────────────────────────────────────
  const nameMatch = t.match(/(?:my name is|name is|fill.*name.*?(?:as|is|with)?|i am)\s+([a-zA-Z\s]+?)(?:\s|$)/i);
  if (nameMatch?.[1])
    return { speech: "Got it.", actions: [{ type: "fill", selector: 'input[placeholder="John Doe"]', value: nameMatch[1].trim() }], keepListening: true, mood: "happy" };

  const emailMatch = t.match(/(?:email is|my email|fill.*email.*?(?:as|is|with)?)\s+([\w.+-]+@[\w.-]+\.[a-z]+)/i);
  if (emailMatch?.[1])
    return { speech: "Done.", actions: [{ type: "fill", selector: 'input[type="email"]', value: emailMatch[1] }], keepListening: true, mood: "happy" };

  const compMatch = t.match(/(?:company is|my company|fill.*company.*?(?:as|is|with)?)\s+(.+?)(?:\s*$)/i);
  if (compMatch?.[1])
    return { speech: "Done.", actions: [{ type: "fill", selector: 'input[placeholder="Your company or project name"]', value: compMatch[1].trim() }], keepListening: true, mood: "happy" };

  // ── SUBMIT ───────────────────────────────────────────────────────
  if (/submit|send (the )?form|send it/i.test(t))
    return { speech: "Submitting now.", actions: [{ type: "click", selector: 'button[type="submit"]' }], keepListening: true, mood: "happy" };

  // ── CLOSE ───────────────────────────────────────────────────────
  if (/^(bye|goodbye|close|stop|exit|dismiss|shut down|turn off|see you|that'?s? all)$/i.test(t))
    return { speech: "See you.", actions: [], keepListening: false, mood: "neutral" };

  // ── GREETINGS — no API needed ────────────────────────────────────
  if (/^(hi|hey|hello|howdy|sup|yo)[\s!.]*$/i.test(t))
    return { speech: "Hey! What do you need?", actions: [], keepListening: true, mood: "happy" };
  if (/how are you/i.test(t))
    return { speech: "Running great, thanks! What can I do for you?", actions: [], keepListening: true, mood: "happy" };
  if (/what can you do|help me|what do you do/i.test(t))
    return { speech: "I can scroll the page, navigate sections, fill forms, answer questions about APSLOCK — just tell me what you need.", actions: [], keepListening: true, mood: "neutral" };
  if (/who are you|what are you/i.test(t))
    return { speech: "I'm AEL, APSLOCK's AI agent. Ask me anything.", actions: [], keepListening: true, mood: "neutral" };
  if (/thank/i.test(t))
    return { speech: "Anytime!", actions: [], keepListening: true, mood: "happy" };

  // ── APSLOCK BASICS — no API needed ──────────────────────────────
  if (/what (is|does) apslock/i.test(t) || /about apslock/i.test(t))
    return { speech: "APSLOCK is a digital product studio. We build websites, apps, AI tools, and run digital marketing campaigns for startups and businesses.", actions: [], keepListening: true, mood: "neutral" };
  if (/service/i.test(t) && !/scroll|go|show/i.test(t))
    return { speech: "APSLOCK offers web development, app development, UI/UX design, AI applications, digital marketing, and SEO.", actions: [], keepListening: true, mood: "neutral" };
  if (/contact|reach out|get in touch/i.test(t) && !/go|open|navigate/i.test(t))
    return { speech: "You can reach APSLOCK through the contact page. Want me to take you there?", actions: [], keepListening: true, mood: "neutral" };
  if (/book|call|meeting/i.test(t))
    return { speech: "I'll take you to the contact page to book a call.", actions: [{ type: "navigate", page: "/contact" }], keepListening: true, mood: "focused" };

  // Not handled locally — send to Gemini
  return null;
}

// ─────────────────────────────────────────────────────────────────
// GEMINI — only for real questions and conversation
// ─────────────────────────────────────────────────────────────────
const BRAIN_PROMPT = `You are AEL, a smart casual AI friend on the APSLOCK website. Answer questions naturally and briefly. 1-2 sentences max. Casual tone.

APSLOCK: digital product studio — Web Dev, App Dev, UI/UX, AI Apps, Marketing, SEO.
Clients: TFS fintech (CEO Pal Reddy), Fluent Pro AI English (CEO Karmarao).

Return ONLY this JSON:
{"speech":"your reply","actions":[],"keepListening":true,"mood":"neutral"}

keepListening: false ONLY for bye/close/stop/goodbye.`;

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

export async function POST(req: NextRequest) {
  const { history, currentPage, domContext } = await req.json();
  const lastMsg = history[history.length - 1]?.content || "";

  // ── Step 1: Try local intent first (instant, no API) ──────────────
  const local = localIntent(lastMsg, currentPage);
  if (local) {
    return Response.json(local);
  }

  // ── Step 2: Only call Gemini for things local can't handle ────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ speech: "Add GEMINI_API_KEY to your .env.local file.", actions: [], keepListening: true, mood: "neutral" });
  }

  const contents = history.slice(-8).map((h: { role: string; content: string }) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text =
      `[Page: "${currentPage}"]\n${contents[contents.length - 1].parts[0].text}`;
  }

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: BRAIN_PROMPT }] },
            contents,
            generationConfig: { maxOutputTokens: 150, temperature: 0.5, responseMimeType: "application/json" },
          }),
        }
      );

      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      if (!res.ok) continue;

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.speech) parsed.speech = "I'm here.";
      if (!Array.isArray(parsed.actions)) parsed.actions = [];
      if (parsed.keepListening === undefined) parsed.keepListening = true;
      return Response.json(parsed);
    } catch { continue; }
  }

  return Response.json({ speech: "Give me a second, I'm thinking.", actions: [], keepListening: true, mood: "thinking" });
}