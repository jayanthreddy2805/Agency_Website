"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type Mood = "neutral" | "happy" | "focused" | "thinking";
type Phase = "dormant" | "waking" | "listening" | "processing" | "speaking";

interface BrainAction {
  type: "scroll_to" | "navigate" | "fill" | "click" | "highlight";
  target?: string;
  page?: string;
  selector?: string;
  value?: string;
}

interface BrainResponse {
  speech: string;
  actions: BrainAction[];
  keepListening: boolean;
  mood: Mood;
}

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

function humanScroll(targetY: number, duration = 1400) {
  const startY = window.scrollY;
  const dist = targetY - startY;
  let start: number | null = null;
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (ts: number) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    window.scrollTo(0, startY + dist * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function VoiceAEL() {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<Phase>("dormant");
  const [visible, setVisible] = useState(false);
  const [caption, setCaption] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [bars, setBars] = useState(false);

  const history = useRef<HistoryEntry[]>([]);
  const phaseRef = useRef<Phase>("dormant");
  const pathnameRef = useRef(pathname);
  const recRef = useRef<any>(null);
  const wakeRecRef = useRef<any>(null);
  const activeRef = useRef(true);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // ── SPEAK ─────────────────────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      setPhase("speaking");
      setCaption(text);
      setBars(false);

      // Try ElevenLabs
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("audio")) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
            return;
          }
        }
      } catch { /* fallthrough to browser TTS */ }

      // Browser TTS
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9;
      utt.pitch = 1.0;
      utt.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v =>
        v.name.includes("Samantha") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Microsoft Aria") ||
        v.name.includes("Karen")
      );
      if (pick) utt.voice = pick;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      window.speechSynthesis.speak(utt);
    });
  }, []);

  // ── EXECUTE ACTIONS ───────────────────────────────────────────────
  const executeActions = useCallback(async (actions: BrainAction[]) => {
    for (const a of actions) {
      console.log("Executing action:", a);

      switch (a.type) {
        case "scroll_to": {
          if (pathnameRef.current !== "/") {
            router.push("/");
            await new Promise(r => setTimeout(r, 1000));
          }
          const el = document.getElementById(a.target!);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 80;
            humanScroll(y);
          } else {
            console.warn("Section not found:", a.target);
          }
          break;
        }

        case "navigate": {
          router.push(a.page!);
          await new Promise(r => setTimeout(r, 800));
          break;
        }

        case "fill": {
          await new Promise(r => setTimeout(r, 400));
          const el = document.querySelector(a.selector!) as HTMLInputElement | HTMLTextAreaElement | null;
          if (el) {
            el.focus();
            el.value = a.value!;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            console.warn("Field not found:", a.selector);
          }
          break;
        }

        case "click": {
          await new Promise(r => setTimeout(r, 300));
          const el = document.querySelector(a.selector!) as HTMLElement | null;
          if (el) {
            el.click();
          }
          break;
        }

        case "highlight": {
          const el = document.querySelector(a.selector!) as HTMLElement | null;
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.style.outline = "3px solid #3b82f6";
            el.style.boxShadow = "0 0 0 6px rgba(59,130,246,0.2)";
            setTimeout(() => { el.style.outline = ""; el.style.boxShadow = ""; }, 3000);
          }
          break;
        }
      }

      if (actions.length > 1) await new Promise(r => setTimeout(r, 300));
    }
  }, [router]);

  // ── SEND TO BRAIN ────────────────────────────────────────────────
  const processWith = useCallback(async (transcript: string) => {
    console.log("Processing:", transcript);
    setPhase("processing");
    setCaption(`"${transcript}"`);
    setBars(false);

    history.current.push({ role: "user", content: transcript });

    const domContext = ["services", "portfolio", "achievements", "faq"]
      .filter(id => !!document.getElementById(id))
      .join(", ");

    try {
      const res = await fetch("/api/voice-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history.current.slice(-14),
          currentPage: pathnameRef.current,
          domContext,
        }),
      });

      const brain: BrainResponse = await res.json();
      console.log("Brain response:", brain);

      setMood(brain.mood || "neutral");
      history.current.push({ role: "assistant", content: brain.speech });

      // Speak first
      await speak(brain.speech);

      // Then execute any actions
      if (brain.actions && brain.actions.length > 0) {
        await executeActions(brain.actions);
      }

      // Keep listening or close
      if (brain.keepListening !== false) {
        setCaption("Listening...");
        setPhase("listening");
        setBars(true);
        startListening();
      } else {
        setCaption("");
        setVisible(false);
        setPhase("dormant");
        setBars(false);
      }
    } catch (err) {
      console.error("Brain error:", err);
      await speak("Something went wrong. Please try again.");
      setCaption("Listening...");
      setPhase("listening");
      setBars(true);
      startListening();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, executeActions]);

  // ── START LISTENING (Web Speech — fast, reliable) ────────────────
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setCaption("Voice not supported in this browser. Use Chrome.");
      return;
    }

    // Stop any existing recognition
    try { recRef.current?.stop(); } catch { }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    recRef.current = rec;
    let finalTranscript = "";
    let interimTranscript = "";

    setPhase("listening");
    setBars(true);
    setCaption("Listening...");

    rec.onstart = () => {
      console.log("Listening started");
      finalTranscript = "";
      interimTranscript = "";
    };

    rec.onresult = (e: any) => {
      finalTranscript = "";
      interimTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      setCaption(finalTranscript || interimTranscript || "Listening...");
    };

    rec.onend = () => {
      console.log("Recognition ended, final:", finalTranscript);
      setBars(false);
      if (finalTranscript.trim().length > 1) {
        processWith(finalTranscript.trim());
      } else {
        // Nothing heard — restart listening
        if (phaseRef.current === "listening") {
          setCaption("Didn't catch that, say something...");
          setTimeout(() => {
            if (phaseRef.current === "listening") {
              startListening();
            }
          }, 800);
        }
      }
    };

    rec.onerror = (e: any) => {
      console.log("Recognition error:", e.error);
      if (e.error === "no-speech") {
        // Restart on no-speech
        if (phaseRef.current === "listening") {
          startListening();
        }
      } else if (e.error === "not-allowed") {
        setCaption("Microphone blocked. Please allow mic access in browser settings.");
        setBars(false);
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error("Could not start recognition:", err);
      setTimeout(startListening, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processWith]);

  // ── ACTIVATE AEL ─────────────────────────────────────────────────
  const activateAEL = useCallback(async () => {
    if (phaseRef.current !== "dormant") return;

    console.log("AEL activating...");
    setVisible(true);
    setPhase("waking");
    setCaption("AEL online...");

    // Stop wake listener
    try { wakeRecRef.current?.stop(); } catch { }

    const greetings = [
      "At your service. What can I do for you?",
      "Yes? I'm listening.",
      "AEL online. What do you need?",
      "Ready. Go ahead.",
      "Here. What would you like?",
    ];
    const g = greetings[Math.floor(Math.random() * greetings.length)];

    await speak(g);
    startListening();
  }, [speak, startListening]);

  // ── WAKE WORD DETECTION ───────────────────────────────────────────
  const startWakeDetection = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const wake = () => {
      if (!activeRef.current || phaseRef.current !== "dormant") return;

      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.maxAlternatives = 5;
      wakeRecRef.current = rec;

      rec.onresult = (e: any) => {
        if (phaseRef.current !== "dormant") return;
        for (let i = 0; i < e.results.length; i++) {
          for (let j = 0; j < e.results[i].length; j++) {
            const t = e.results[i][j].transcript.toLowerCase().trim();
            console.log("Wake heard:", t);
            if (
              t.includes("ael") || t.includes("ale") ||
              t === "el" || t === "al" ||
              t.includes("ayel") || t.includes("ayal") ||
              t.includes("hey") || t === "hell" ||
              t.includes("a.e.l") || t.includes("ail")
            ) {
              activateAEL();
              return;
            }
          }
        }
      };

      rec.onend = () => {
        if (activeRef.current && phaseRef.current === "dormant") {
          setTimeout(wake, 200);
        }
      };

      rec.onerror = () => {
        if (activeRef.current && phaseRef.current === "dormant") {
          setTimeout(wake, 800);
        }
      };

      try { rec.start(); } catch { setTimeout(wake, 800); }
    };

    setTimeout(wake, 1500);
  }, [activateAEL]);

  // ── EXPOSE GLOBAL ACTIVATE (for button click) ─────────────────────
  useEffect(() => {
    (window as any).__activateAEL = activateAEL;
    return () => { delete (window as any).__activateAEL; };
  }, [activateAEL]);

  // ── START WAKE DETECTION ON MOUNT ────────────────────────────────
  useEffect(() => {
    activeRef.current = true;
    startWakeDetection();
    return () => {
      activeRef.current = false;
      try { wakeRecRef.current?.stop(); } catch { }
      try { recRef.current?.stop(); } catch { }
    };
  }, [startWakeDetection]);

  // ── DISMISS ON ESCAPE ────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !visible) return;
      try { recRef.current?.stop(); } catch { }
      window.speechSynthesis.cancel();
      setVisible(false);
      setPhase("dormant");
      setBars(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [visible]);

  // ── RESTART WAKE DETECTION WHEN CLOSED ──────────────────────────
  useEffect(() => {
    if (!visible && phaseRef.current === "dormant") {
      setTimeout(() => {
        if (activeRef.current && phaseRef.current === "dormant") {
          startWakeDetection();
        }
      }, 500);
    }
  }, [visible, startWakeDetection]);

  // ── RENDER ───────────────────────────────────────────────────────
  if (!visible) return null;

  const moodColors: Record<Mood, string> = {
    neutral: "#3b82f6",
    happy: "#10b981",
    focused: "#8b5cf6",
    thinking: "#f59e0b",
  };

  const phaseLabels: Record<Phase, string> = {
    dormant: "Dormant",
    waking: "Waking up",
    listening: "Listening",
    processing: "Thinking",
    speaking: "Speaking",
  };

  const orbColor = moodColors[mood];

  return (
    <>
      <style>{`
        @keyframes ael-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.18);opacity:.7}}
        @keyframes ael-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.5);opacity:0}}
        @keyframes ael-bar{0%,100%{height:3px}50%{height:30px}}
        @keyframes ael-up{from{transform:translateX(-50%) translateY(calc(50% + 20px));opacity:0}to{transform:translateX(-50%) translateY(50%);opacity:1}}
        @keyframes ael-spin{to{transform:rotate(360deg)}}
        .ael-panel{animation:ael-up .4s cubic-bezier(.16,1,.3,1) both}
        .ael-orb-pulse{animation:ael-pulse 1.8s ease-in-out infinite}
        .ael-r1{animation:ael-ring 2s ease-out infinite}
        .ael-r2{animation:ael-ring 2s ease-out .7s infinite}
        .ael-r3{animation:ael-ring 2s ease-out 1.4s infinite}
        .ael-bar{animation:ael-bar .5s ease-in-out infinite}
        .ael-bar:nth-child(1){animation-delay:0s}
        .ael-bar:nth-child(2){animation-delay:.07s}
        .ael-bar:nth-child(3){animation-delay:.14s}
        .ael-bar:nth-child(4){animation-delay:.21s}
        .ael-bar:nth-child(5){animation-delay:.28s}
        .ael-bar:nth-child(6){animation-delay:.21s}
        .ael-bar:nth-child(7){animation-delay:.14s}
        .ael-bar:nth-child(8){animation-delay:.07s}
        .ael-bar:nth-child(9){animation-delay:0s}
        .ael-spin{animation:ael-spin 1s linear infinite}
      `}</style>

      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        onClick={() => {
          try { recRef.current?.stop(); } catch { }
          window.speechSynthesis.cancel();
          setVisible(false); setPhase("dormant"); setBars(false);
        }}
      />

      {/* Panel */}
      <div
        className="ael-panel"
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed",
          bottom: "50%",
          left: "50%",
          transform: "translateX(-50%) translateY(50%)",
          zIndex: 9999,
          width: "min(500px, calc(100vw - 32px))",
          background: "#06101e",
          borderRadius: 28,
          padding: "40px 32px 32px",
          border: `1.5px solid ${orbColor}40`,
          boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 60px ${orbColor}15`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          fontFamily: "'Sora', sans-serif",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => {
            try { recRef.current?.stop(); } catch { }
            window.speechSynthesis.cancel();
            setVisible(false); setPhase("dormant"); setBars(false);
          }}
          style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 22, lineHeight: 1, transition: "color .2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "white")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >✕</button>

        {/* Orb with rings */}
        <div style={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {["ael-r1", "ael-r2", "ael-r3"].map((c, i) => (
            <div key={i} className={c} style={{ position: "absolute", width: 96, height: 96, borderRadius: "50%", border: `1.5px solid ${orbColor}`, opacity: 0, pointerEvents: "none" }} />
          ))}
          <div
            className="ael-orb-pulse"
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `radial-gradient(circle at 36% 30%, ${orbColor}, ${orbColor}55)`,
              border: `2px solid ${orbColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              if (phase === "listening") {
                // Manually stop and process what was heard
                try { recRef.current?.stop(); } catch { }
              }
            }}
          >
            {phase === "processing" ? (
              <svg className="ael-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
            ) : phase === "speaking" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white" opacity=".4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            )}
          </div>
        </div>

        {/* Wave bars when listening */}
        {bars && phase === "listening" && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="ael-bar" style={{ width: 4, height: 3, borderRadius: 2, background: orbColor }} />
            ))}
          </div>
        )}

        {/* Status label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: orbColor }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: orbColor,
            animation: phase === "listening" ? "ael-pulse 0.9s ease-in-out infinite" : "none",
          }} />
          {phaseLabels[phase]}
        </div>

        {/* Caption */}
        <div style={{
          fontSize: 15, color: "rgba(255,255,255,0.9)",
          textAlign: "center", lineHeight: 1.7,
          maxWidth: 360, minHeight: 44,
          fontWeight: 400,
        }}>
          {caption}
        </div>

        {/* Conversation dots */}
        {history.current.length > 0 && (
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {history.current.slice(-10).map((h, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: h.role === "user" ? "#3b82f6" : "#8b5cf6",
                opacity: 0.4 + i * 0.06,
              }} />
            ))}
          </div>
        )}

        {/* Hint when listening */}
        {phase === "listening" && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.6 }}>
            Try: "scroll to services" · "go to contact" · "what does APSLOCK do"
          </div>
        )}

        {/* Brand */}
        <div style={{ position: "absolute", bottom: 14, fontSize: 9, fontWeight: 700, letterSpacing: "4px", color: "rgba(255,255,255,0.12)", textTransform: "uppercase" }}>
          AEL — APSLOCK AI
        </div>
      </div>
    </>
  );
}