"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type Mood = "neutral" | "happy" | "focused" | "thinking";
type Phase = "dormant" | "listening" | "processing" | "speaking";

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
  needsSearch?: boolean;
}

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

// Persistent memory keys
const MEMORY_KEY = "ael_memory";
const HISTORY_KEY = "ael_history";
const MAX_MEMORY = 20; // last 20 exchanges remembered across sessions

function saveMemory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_MEMORY)));
  } catch { }
}

function loadMemory(): HistoryEntry[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveUserInfo(key: string, value: string) {
  try {
    const mem = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
    mem[key] = value;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
  } catch { }
}

function loadUserInfo(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
  } catch { return {}; }
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
  const [interimCaption, setInterimCaption] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [isSearching, setIsSearching] = useState(false);

  const history = useRef<HistoryEntry[]>([]);
  const phaseRef = useRef<Phase>("dormant");
  const pathnameRef = useRef(pathname);
  const recRef = useRef<any>(null);
  const wakeRecRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);
  useEffect(() => {
    mountedRef.current = true;
    // Load memory from previous sessions
    history.current = loadMemory();
    return () => { mountedRef.current = false; };
  }, []);

  // ── CLOSE ─────────────────────────────────────────────────────────
  const closeAEL = useCallback(() => {
    try { recRef.current?.stop(); recRef.current?.abort(); } catch { }
    window.speechSynthesis.cancel();
    processingRef.current = false;
    setIsSearching(false);
    setVisible(false);
    setPhase("dormant");
    setCaption("");
    setInterimCaption("");
  }, []);

  // ── SPEAK ─────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (!mountedRef.current) { resolve(); return; }
      setPhase("speaking");
      setCaption(text);
      setInterimCaption("");
      setIsSearching(false);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("audio")) {
            const arrayBuffer = await res.arrayBuffer();
            if (arrayBuffer.byteLength > 100) {
              try {
                // Use AudioContext — bypasses Chrome autoplay restrictions
                // Reuse same context across calls to avoid suspension
                if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
                  audioCtxRef.current = new AudioContext();
                }
                const ctx = audioCtxRef.current;
                if (ctx.state === "suspended") await ctx.resume();

                const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
                const source = ctx.createBufferSource();
                source.buffer = decoded;
                source.connect(ctx.destination);
                source.onended = () => resolve();
                source.start(0);
                return;
              } catch (audioErr) {
                console.error("AudioContext decode error:", audioErr);
                // Fall through to browser TTS
              }
            }
          }
        }
      } catch (e) {
        console.error("TTS fetch error:", e);
      }

      // Browser TTS fallback
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.0; utt.pitch = 1.0; utt.volume = 1.0;
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
      switch (a.type) {
        case "scroll_to": {
          if (pathnameRef.current !== "/") {
            router.push("/");
            await new Promise(r => setTimeout(r, 900));
          }
          const el = document.getElementById(a.target!);
          if (el) humanScroll(el.getBoundingClientRect().top + window.scrollY - 80);
          break;
        }
        case "navigate": {
          router.push(a.page!);
          await new Promise(r => setTimeout(r, 700));
          break;
        }
        case "fill": {
          await new Promise(r => setTimeout(r, 350));
          const el = document.querySelector(a.selector!) as HTMLInputElement | HTMLTextAreaElement | null;
          if (el) {
            el.focus();
            el.value = a.value!;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            // Extract and save user info for memory
            if (a.selector?.includes("John Doe")) saveUserInfo("name", a.value!);
            if (a.selector?.includes("email")) saveUserInfo("email", a.value!);
          }
          break;
        }
        case "click": {
          await new Promise(r => setTimeout(r, 250));
          const el = document.querySelector(a.selector!) as HTMLElement | null;
          if (el) el.click();
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
      if (actions.length > 1) await new Promise(r => setTimeout(r, 150));
    }
  }, [router]);

  // ── PROCESS WITH BRAIN ────────────────────────────────────────────
  const processWith = useCallback(async (transcript: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    setPhase("processing");
    setCaption(transcript);
    setInterimCaption("");

    // Build message with user context from memory
    const userInfo = loadUserInfo();
    const contextNote = Object.keys(userInfo).length > 0
      ? `[User info from memory: ${JSON.stringify(userInfo)}]\n`
      : "";

    history.current.push({ role: "user", content: contextNote + transcript });
    saveMemory(history.current);

    const domContext = ["services", "portfolio", "achievements", "faq"]
      .filter(id => !!document.getElementById(id)).join(", ");

    try {
      const res = await fetch("/api/voice-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history.current.slice(-16),
          currentPage: pathnameRef.current,
          domContext,
        }),
      });

      const brain: BrainResponse = await res.json();
      if (!mountedRef.current) { processingRef.current = false; return; }

      // If it needs web search — show searching state
      if (brain.needsSearch) {
        setIsSearching(true);
        setCaption("Searching the web...");
      }

      setMood(brain.mood || "neutral");
      history.current.push({ role: "assistant", content: brain.speech });
      saveMemory(history.current);

      await speak(brain.speech);
      if (brain.actions?.length) await executeActions(brain.actions);

      processingRef.current = false;
      setIsSearching(false);

      if (brain.keepListening === false) {
        closeAEL();
      } else {
        setCaption("");
        setInterimCaption("");
        setPhase("listening");
        startListening();
      }
    } catch {
      processingRef.current = false;
      setIsSearching(false);
      await speak("Something went wrong, try again.");
      setCaption("");
      setPhase("listening");
      startListening();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, executeActions, closeAEL]);

  // ── START LISTENING ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setCaption("Use Chrome for voice.");
      return;
    }
    try { recRef.current?.abort(); } catch { }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;
    recRef.current = rec;

    let finalTranscript = "";
    setPhase("listening");
    setInterimCaption("");

    rec.onresult = (e: any) => {
      finalTranscript = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      setInterimCaption(finalTranscript || interim);
    };

    rec.onend = () => {
      if (finalTranscript.trim().length > 1 && !processingRef.current) {
        processWith(finalTranscript.trim());
      } else if (phaseRef.current === "listening") {
        setInterimCaption("");
        setTimeout(() => {
          if (phaseRef.current === "listening" && mountedRef.current) startListening();
        }, 250);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech") {
        if (phaseRef.current === "listening" && mountedRef.current) setTimeout(startListening, 200);
      } else if (e.error === "not-allowed") {
        setCaption("Allow mic access in Chrome settings.");
      }
    };

    try { rec.start(); } catch { setTimeout(startListening, 400); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processWith]);

  // ── ACTIVATE ─────────────────────────────────────────────────────
  const activateAEL = useCallback(() => {
    if (phaseRef.current !== "dormant") return;
    processingRef.current = false;
    try { wakeRecRef.current?.stop(); } catch { }

    setVisible(true);
    setPhase("listening");
    setCaption("");
    setInterimCaption("");
    // Keep history — don't reset, so AEL remembers across opens

    setTimeout(() => startListening(), 120);
  }, [startListening]);

  // ── WAKE WORD ─────────────────────────────────────────────────────
  const startWakeDetection = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const wake = () => {
      if (!mountedRef.current || phaseRef.current !== "dormant") return;
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
            if (
              t.includes("ael") || t.includes("ale") ||
              t === "el" || t === "al" || t === "l" || t === "a l" ||
              t.includes("ayel") || t.includes("ayal") ||
              t.includes("hey l") || t.includes("hey el") ||
              t.includes("a.e.l") || t.includes("ail") ||
              t === "hell" || t === "heal" || t === "heel" ||
              t === "hey" || t === "hello" || t === "hi" ||
              t === "yo" || t === "wake up" || t === "activate" ||
              t === "hey ael" || t === "hi ael" || t === "ok ael" ||
              t === "start" || t.includes("assistant")
            ) {
              activateAEL();
              return;
            }
          }
        }
      };

      rec.onend = () => { if (mountedRef.current && phaseRef.current === "dormant") setTimeout(wake, 200); };
      rec.onerror = () => { if (mountedRef.current && phaseRef.current === "dormant") setTimeout(wake, 800); };
      try { rec.start(); } catch { setTimeout(wake, 800); }
    };

    setTimeout(wake, 1200);
  }, [activateAEL]);

  // ── INIT ──────────────────────────────────────────────────────────
  useEffect(() => {
    (window as any).__activateAEL = activateAEL;
    return () => { delete (window as any).__activateAEL; };
  }, [activateAEL]);

  useEffect(() => {
    startWakeDetection();
    return () => {
      mountedRef.current = false;
      try { wakeRecRef.current?.stop(); } catch { }
      try { recRef.current?.stop(); } catch { }
      window.speechSynthesis.cancel();
    };
  }, [startWakeDetection]);

  useEffect(() => {
    if (!visible) {
      processingRef.current = false;
      setTimeout(() => { if (mountedRef.current) startWakeDetection(); }, 500);
    }
  }, [visible, startWakeDetection]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && visible) closeAEL(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [visible, closeAEL]);

  if (!visible) return null;

  const moodColors: Record<Mood, string> = {
    neutral: "#3b82f6", happy: "#10b981", focused: "#8b5cf6", thinking: "#f59e0b",
  };
  const orbColor = moodColors[mood];
  const isListening = phase === "listening";
  const isProcessing = phase === "processing";
  const isSpeaking = phase === "speaking";

  return (
    <>
      <style>{`
        @keyframes ael-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.8);opacity:0}}
        @keyframes ael-orb{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.85}}
        @keyframes ael-bar{0%,100%{height:4px}50%{height:28px}}
        @keyframes ael-panel{from{opacity:0;transform:translate(-50%,calc(50% + 16px))}to{opacity:1;transform:translate(-50%,50%)}}
        @keyframes ael-spin{to{transform:rotate(360deg)}}
        @keyframes ael-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ael-search{0%,100%{opacity:.4}50%{opacity:1}}
        .ael-panel{animation:ael-panel .3s cubic-bezier(.16,1,.3,1) both}
        .ael-r1{animation:ael-ring 2s ease-out infinite}
        .ael-r2{animation:ael-ring 2s ease-out .7s infinite}
        .ael-r3{animation:ael-ring 2s ease-out 1.4s infinite}
        .ael-orb-pulse{animation:ael-orb 1.6s ease-in-out infinite}
        .ael-bar{animation:ael-bar .55s ease-in-out infinite}
        .ael-bar:nth-child(1){animation-delay:0s}.ael-bar:nth-child(2){animation-delay:.07s}
        .ael-bar:nth-child(3){animation-delay:.14s}.ael-bar:nth-child(4){animation-delay:.21s}
        .ael-bar:nth-child(5){animation-delay:.28s}.ael-bar:nth-child(6){animation-delay:.21s}
        .ael-bar:nth-child(7){animation-delay:.14s}.ael-bar:nth-child(8){animation-delay:.07s}
        .ael-bar:nth-child(9){animation-delay:0s}
        .ael-spin{animation:ael-spin .9s linear infinite}
        .ael-fade{animation:ael-fade .2s ease both}
        .ael-search-dot{animation:ael-search 1.2s ease-in-out infinite}
        .ael-search-dot:nth-child(2){animation-delay:.2s}
        .ael-search-dot:nth-child(3){animation-delay:.4s}
      `}</style>

      <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)"}} onClick={closeAEL}/>

      <div className="ael-panel" onClick={e=>e.stopPropagation()} style={{
        position:"fixed", bottom:"50%", left:"50%",
        transform:"translate(-50%,50%)",
        zIndex:9999, width:"min(420px,calc(100vw - 32px))",
        background:"#07101f", borderRadius:24, padding:"36px 28px 26px",
        border:`1.5px solid ${orbColor}35`,
        boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 0 1px ${orbColor}10`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:18,
        fontFamily:"'Sora',sans-serif",
      }}>

        {/* Close */}
        <button onClick={closeAEL} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.18)",fontSize:20,lineHeight:1,padding:4,transition:"color .2s"}}
          onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.6)")}
          onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.18)")}>✕</button>

        {/* Memory indicator */}
        {history.current.length > 0 && (
          <div style={{position:"absolute",top:16,left:18,display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#8b5cf6",opacity:.6}}/>
            <span style={{fontSize:9,color:"rgba(255,255,255,0.25)",letterSpacing:"1px"}}>MEMORY ON</span>
          </div>
        )}

        {/* Orb */}
        <div style={{position:"relative",width:84,height:84,display:"flex",alignItems:"center",justifyContent:"center",marginTop:4}}>
          {isListening && ["ael-r1","ael-r2","ael-r3"].map((c,i)=>(
            <div key={i} className={c} style={{position:"absolute",width:84,height:84,borderRadius:"50%",border:`1px solid ${orbColor}`,opacity:0,pointerEvents:"none"}}/>
          ))}
          <div className={isListening?"ael-orb-pulse":""} style={{
            width:66, height:66, borderRadius:"50%",
            background:`radial-gradient(circle at 35% 30%,${orbColor}ee,${orbColor}44)`,
            border:`2px solid ${orbColor}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background .4s, border-color .4s",
          }}>
            {isProcessing?(
              <svg className="ael-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.22-8.56" strokeLinecap="round"/></svg>
            ):isSpeaking?(
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white" opacity=".5"/>
                <path d="M5 10v2a7 7 0 0 0 14 0v-2" strokeLinecap="round"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ):(
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
            )}
          </div>
        </div>

        {/* Wave bars */}
        {isListening&&(
          <div style={{display:"flex",alignItems:"center",gap:3,height:32}}>
            {Array.from({length:9},(_,i)=>(
              <div key={i} className="ael-bar" style={{width:4,height:4,borderRadius:2,background:orbColor}}/>
            ))}
          </div>
        )}

        {/* Searching indicator */}
        {isSearching&&(
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>searching web</span>
            {[0,1,2].map(i=>(
              <div key={i} className="ael-search-dot" style={{width:4,height:4,borderRadius:"50%",background:orbColor}}/>
            ))}
          </div>
        )}

        {/* Live interim caption — what user is saying */}
        {interimCaption&&isListening&&(
          <div key={interimCaption} className="ael-fade" style={{fontSize:13,color:"rgba(255,255,255,0.45)",textAlign:"center",lineHeight:1.6,maxWidth:320,fontStyle:"italic"}}>
            "{interimCaption}"
          </div>
        )}

        {/* AEL response caption */}
        {caption&&!interimCaption&&(
          <div key={caption} className="ael-fade" style={{fontSize:15,color:"rgba(255,255,255,0.9)",textAlign:"center",lineHeight:1.7,maxWidth:340,fontWeight:400}}>
            {caption}
          </div>
        )}

        {/* Idle state */}
        {isListening&&!interimCaption&&!caption&&(
          <div style={{fontSize:12,color:"rgba(255,255,255,0.18)",textAlign:"center"}}>say something...</div>
        )}

        {/* Conversation dots */}
        {history.current.length>0&&(
          <div style={{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap",justifyContent:"center",maxWidth:200}}>
            {history.current.slice(-16).map((h,i)=>(
              <div key={i} style={{width:5,height:5,borderRadius:"50%",background:h.role==="user"?"#3b82f6":"#8b5cf6",opacity:.25+i*.05,flexShrink:0}}/>
            ))}
          </div>
        )}

        <div style={{fontSize:9,fontWeight:700,letterSpacing:"4px",color:"rgba(255,255,255,0.1)",textTransform:"uppercase"}}>
          AEL · APSLOCK
        </div>
      </div>
    </>
  );
}