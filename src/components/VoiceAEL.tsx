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

function humanScroll(targetY: number, duration = 1600) {
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

export function VoiceAELIndicator() {
  return (
    <div style={{
      position:"fixed", bottom:"84px", left:"24px", zIndex:49,
      display:"flex", alignItems:"center", gap:"8px",
      background:"rgba(15,23,42,0.88)", backdropFilter:"blur(10px)",
      border:"1px solid rgba(59,130,246,0.3)",
      borderRadius:"999px", padding:"7px 16px 7px 11px",
      fontFamily:"'Sora',sans-serif",
      boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
    }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 10px #10b981", animation:"ael-pulse 2s ease-in-out infinite" }}/>
      <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", letterSpacing:"0.5px" }}>
        Say <span style={{ color:"#60a5fa", fontWeight:700 }}>AEL</span>
      </span>
    </div>
  );
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
  const isSpeakingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      isSpeakingRef.current = true;
      setPhase("speaking");
      setCaption(text);
      try {
        const res = await fetch("/api/tts", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const ct = res.headers.get("content-type");
          if (ct?.includes("audio")) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => { URL.revokeObjectURL(url); isSpeakingRef.current = false; resolve(); };
            audio.onerror = () => { isSpeakingRef.current = false; resolve(); };
            await audio.play();
            return;
          }
        }
      } catch { /* fallthrough */ }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.92; utt.pitch = 1.0; utt.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v =>
        v.name.includes("Samantha") || v.name.includes("Google UK English Female") ||
        v.name.includes("Microsoft Aria") || v.name.includes("Karen") || v.name.includes("Moira")
      );
      if (pick) utt.voice = pick;
      utt.onend = () => { isSpeakingRef.current = false; resolve(); };
      utt.onerror = () => { isSpeakingRef.current = false; resolve(); };
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const executeActions = useCallback(async (actions: BrainAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case "scroll_to": {
          if (pathnameRef.current !== "/") { router.push("/"); await new Promise(r => setTimeout(r, 900)); }
          const el = document.getElementById(action.target!);
          if (el) humanScroll(el.getBoundingClientRect().top + window.scrollY - 80);
          break;
        }
        case "navigate": {
          router.push(action.page!);
          await new Promise(r => setTimeout(r, 700));
          break;
        }
        case "fill": {
          await new Promise(r => setTimeout(r, 300));
          const el = document.querySelector(action.selector!) as HTMLInputElement | HTMLTextAreaElement | null;
          if (el) {
            el.focus();
            el.value = action.value!;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            el.blur();
          }
          break;
        }
        case "click": {
          await new Promise(r => setTimeout(r, 300));
          const el = document.querySelector(action.selector!) as HTMLElement | null;
          if (el) { el.focus(); await new Promise(r => setTimeout(r, 150)); el.click(); }
          break;
        }
        case "highlight": {
          const el = document.querySelector(action.selector!) as HTMLElement | null;
          if (el) {
            el.scrollIntoView({ behavior:"smooth", block:"center" });
            const prev = el.style.outline;
            el.style.outline = "2px solid #3b82f6";
            el.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.2)";
            setTimeout(() => { el.style.outline = prev; el.style.boxShadow = ""; }, 2500);
          }
          break;
        }
      }
      if (actions.length > 1) await new Promise(r => setTimeout(r, 200));
    }
  }, [router]);

  const startWhisperListening = useCallback(() => {
    if (phaseRef.current === "speaking" || phaseRef.current === "processing") return;
    setPhase("listening"); setBars(true); setCaption("Listening...");

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setBars(false);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 2000) {
          setCaption("Didn't catch that...");
          setTimeout(() => { if (phaseRef.current === "listening") startWhisperListening(); }, 800);
          return;
        }
        setPhase("processing"); setCaption("Processing...");
        const form = new FormData();
        form.append("audio", blob, "audio.webm");
        try {
          const res = await fetch("/api/stt", { method:"POST", body:form });
          const { transcript } = await res.json();
          if (!transcript?.trim() || transcript.trim().length < 2) {
            setCaption("Didn't catch that. Try again.");
            setTimeout(() => { setPhase("listening"); setBars(true); startWhisperListening(); }, 700);
            return;
          }
          await processWith(transcript.trim());
        } catch {
          await speak("I had trouble with that. Try again.");
          setPhase("listening"); setBars(true); startWhisperListening();
        }
      };

      recorder.start();
      const autoStop = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 8000);

      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let silenceStart = Date.now();
        let hasSpeech = false;
        const check = setInterval(() => {
          if (recorder.state !== "recording") { clearInterval(check); audioCtx.close(); return; }
          analyser.getByteFrequencyData(data);
          const vol = data.reduce((a,b) => a+b, 0) / data.length;
          if (vol > 12) { hasSpeech = true; silenceStart = Date.now(); }
          else if (hasSpeech && Date.now() - silenceStart > 1800) {
            clearInterval(check); clearTimeout(autoStop); audioCtx.close();
            if (recorder.state === "recording") recorder.stop();
          }
        }, 100);
      } catch { /* silence detection failed, auto-stop handles it */ }

    }).catch(() => fallbackWebSpeech());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak]);

  const processWith = useCallback(async (transcript: string) => {
    setPhase("processing"); setCaption(`"${transcript}"`); setBars(false);
    history.current.push({ role:"user", content:transcript });
    const domContext = ["services","portfolio","achievements","faq"]
      .filter(id => !!document.getElementById(id)).join(", ");
    try {
      const res = await fetch("/api/voice-brain", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ history: history.current.slice(-14), currentPage: pathnameRef.current, domContext }),
      });
      const brain: BrainResponse = await res.json();
      setMood(brain.mood || "neutral");
      history.current.push({ role:"assistant", content:brain.speech });
      await speak(brain.speech);
      if (brain.actions?.length) await executeActions(brain.actions);
      if (brain.keepListening) {
        setCaption("Listening..."); setPhase("listening"); setBars(true);
        startWhisperListening();
      } else {
        setCaption(""); setVisible(false); setPhase("dormant"); setBars(false);
      }
    } catch {
      await speak("Something went wrong. Please try again.");
      setPhase("listening"); setBars(true); startWhisperListening();
    }
  }, [speak, executeActions, startWhisperListening]);

  const fallbackWebSpeech = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US"; rec.maxAlternatives = 3;
    let final = "";
    setPhase("listening"); setBars(true);
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setCaption(final || interim || "Listening...");
    };
    rec.onend = async () => {
      setBars(false);
      if (final.trim()) { await processWith(final.trim()); }
      else { setCaption("Didn't catch that."); setTimeout(() => { setPhase("listening"); setBars(true); fallbackWebSpeech(); }, 700); }
    };
    rec.onerror = () => { setBars(false); };
    recognitionRef.current = rec;
    try { rec.start(); } catch { }
  }, [processWith]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let active = true;
    let wakeRec: any = null;

    const wake = () => {
      if (!active) return;
      wakeRec = new SR();
      wakeRec.continuous = false; wakeRec.interimResults = false;
      wakeRec.lang = "en-US"; wakeRec.maxAlternatives = 5;
      wakeRec.onresult = (e: any) => {
        if (phaseRef.current !== "dormant") return;
        for (let i = 0; i < e.results.length; i++) {
          for (let j = 0; j < e.results[i].length; j++) {
            const t = e.results[i][j].transcript.toLowerCase().trim();
            // Very broad detection — catches AEL and common mishears
            const isWake =
              t.includes("ael") || t.includes("ale") ||
              t === "el" || t === "al" || t === "l" ||
              t.includes("ayel") || t.includes("ayal") ||
              t.includes("a.e.l") || t.includes("ail") ||
              t === "hey l" || t === "hey el" || t === "hey al" ||
              t.includes("a l") || t.includes("hey a") ||
              t === "hell" || t === "heal" || t === "heel" ||
              t.includes("hail") || t === "oil" || t === "ill" ||
              t.includes("hey") && t.length < 6;
            if (isWake) {
              setVisible(true); setPhase("waking"); setCaption("AEL online...");
              const gs = ["At your service.","Yes? I'm listening.","AEL online. What can I do for you?","Ready. Go ahead.","Here. What do you need?"];
              const g = gs[Math.floor(Math.random() * gs.length)];
              setTimeout(async () => { await speak(g); startWhisperListening(); }, 100);
              return;
            }
          }
        }
      };
      wakeRec.onend = () => { if (active && phaseRef.current === "dormant") setTimeout(wake, 150); };
      wakeRec.onerror = () => { if (active && phaseRef.current === "dormant") setTimeout(wake, 600); };
      try { wakeRec.start(); } catch { setTimeout(wake, 600); }
    };

    const t = setTimeout(wake, 1800);
    return () => { active=false; clearTimeout(t); try { wakeRec?.stop(); } catch { } };
  }, [speak, startWhisperListening]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !visible) return;
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      setVisible(false); setPhase("dormant"); setBars(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [visible]);

  // Expose manual activation globally so indicator button can trigger it
  useEffect(() => {
    (window as any).__activateAEL = () => {
      if (phaseRef.current !== "dormant") return;
      setVisible(true);
      setPhase("waking");
      setCaption("AEL online...");
      const gs = ["At your service.", "Yes? I'm listening.", "Ready. Go ahead.", "What can I do for you?"];
      const g = gs[Math.floor(Math.random() * gs.length)];
      setTimeout(async () => { await speak(g); startWhisperListening(); }, 100);
    };
    return () => { delete (window as any).__activateAEL; };
  }, [speak, startWhisperListening]);

  if (!visible) return null;

  const moodColors: Record<Mood,string> = { neutral:"#3b82f6", happy:"#10b981", focused:"#8b5cf6", thinking:"#f59e0b" };
  const phaseLabels: Record<Phase,string> = { dormant:"Dormant", waking:"Waking up", listening:"Listening", processing:"Thinking", speaking:"Speaking" };
  const orbColor = moodColors[mood];

  return (
    <>
      <style>{`
        @keyframes ael-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.75}}
        @keyframes ael-ring{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.4);opacity:0}}
        @keyframes ael-bar{0%,100%{height:3px}50%{height:32px}}
        @keyframes ael-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes ael-glow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 32px 8px var(--gc)}}
        .ael-panel{animation:ael-up .4s cubic-bezier(.16,1,.3,1) both}
        .ael-orb{animation:ael-pulse 2s ease-in-out infinite,ael-glow 2.5s ease-in-out infinite}
        .ael-r1{animation:ael-ring 2s ease-out infinite}
        .ael-r2{animation:ael-ring 2s ease-out .65s infinite}
        .ael-r3{animation:ael-ring 2s ease-out 1.3s infinite}
        .ael-bar{animation:ael-bar .55s ease-in-out infinite}
        .ael-bar:nth-child(1){animation-delay:0s}.ael-bar:nth-child(2){animation-delay:.08s}
        .ael-bar:nth-child(3){animation-delay:.16s}.ael-bar:nth-child(4){animation-delay:.24s}
        .ael-bar:nth-child(5){animation-delay:.32s}.ael-bar:nth-child(6){animation-delay:.24s}
        .ael-bar:nth-child(7){animation-delay:.16s}.ael-bar:nth-child(8){animation-delay:.08s}
        .ael-bar:nth-child(9){animation-delay:0s}
      `}</style>

      <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)"}}
        onClick={()=>{ mediaRecorderRef.current?.stop(); recognitionRef.current?.stop(); window.speechSynthesis.cancel(); setVisible(false); setPhase("dormant"); setBars(false); }}/>

      <div className="ael-panel" onClick={e=>e.stopPropagation()} style={{
        position:"fixed", bottom:"50%", left:"50%", transform:"translate(-50%,50%)",
        zIndex:9999, width:"min(520px,calc(100vw - 32px))",
        background:"#080f1e", borderRadius:32, padding:"44px 36px 36px",
        border:`1.5px solid ${orbColor}30`,
        boxShadow:`0 40px 100px rgba(0,0,0,0.65),0 0 0 1px ${orbColor}15`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:28,
        fontFamily:"'Sora',sans-serif",
      }}>

        <button onClick={()=>{ mediaRecorderRef.current?.stop(); recognitionRef.current?.stop(); window.speechSynthesis.cancel(); setVisible(false); setPhase("dormant"); setBars(false); }}
          style={{position:"absolute",top:18,right:20,background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:20,transition:"color .2s"}}
          onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")}
          onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.25)")}>✕</button>

        {/* Orb */}
        <div style={{position:"relative",width:100,height:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {["ael-r1","ael-r2","ael-r3"].map((c,i)=>(
            <div key={i} className={c} style={{position:"absolute",width:100,height:100,borderRadius:"50%",border:`1.5px solid ${orbColor}`,opacity:0}}/>
          ))}
          <div className="ael-orb" style={{
            width:74,height:74,borderRadius:"50%",
            background:`radial-gradient(circle at 38% 32%,${orbColor}dd,${orbColor}44)`,
            border:`2px solid ${orbColor}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            ["--gc" as string]:`${orbColor}55`,
          }}>
            {phase==="processing"?(
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/></svg>
            ):(
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
            )}
          </div>
        </div>

        {bars&&(
          <div style={{display:"flex",alignItems:"center",gap:3,height:40}}>
            {Array.from({length:9},(_,i)=>(
              <div key={i} className="ael-bar" style={{width:4,height:3,borderRadius:2,background:orbColor}}/>
            ))}
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:10,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:orbColor}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:orbColor,animation:phase==="listening"?"ael-pulse 1s ease-in-out infinite":"none"}}/>
          {phaseLabels[phase]}
        </div>

        <div style={{fontSize:15,color:"rgba(255,255,255,0.88)",textAlign:"center",lineHeight:1.7,maxWidth:380,minHeight:48,fontWeight:400}}>
          {caption}
        </div>

        {history.current.length>0&&(
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {history.current.slice(-10).map((h,i)=>(
              <div key={i} style={{width:6,height:6,borderRadius:"50%",background:h.role==="user"?"#3b82f6":"#8b5cf6",opacity:0.5+(i*0.05)}}/>
            ))}
          </div>
        )}

        <div style={{position:"absolute",bottom:16,fontSize:9,fontWeight:700,letterSpacing:"4px",color:"rgba(255,255,255,0.15)",textTransform:"uppercase"}}>
          AEL — APSLOCK AI
        </div>
      </div>
    </>
  );
}