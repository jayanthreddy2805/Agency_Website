"use client";

import { Send, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  hasEscalation?: boolean;
  synthetic?: boolean;
};

type Stage = "closed" | "flash" | "intro" | "sand" | "booking" | "chat";

const TowerSVG = ({ width, height }: { width: number; height: number }) => (
  <svg width={width} height={height} viewBox="0 0 130 210" xmlns="http://www.w3.org/2000/svg">
    <polygon points="65,2 57,38 73,38" fill="#333333"/>
    <rect x="61" y="35" width="8" height="18" fill="#333333"/>
    <rect x="44" y="53" width="42" height="10" rx="1" fill="#333333"/>
    <rect x="48" y="49" width="5" height="7" rx="1" fill="#333333"/>
    <rect x="57" y="47" width="5" height="8" rx="1" fill="#333333"/>
    <rect x="68" y="47" width="5" height="8" rx="1" fill="#333333"/>
    <rect x="77" y="49" width="5" height="7" rx="1" fill="#333333"/>
    <rect x="42" y="63" width="46" height="5" fill="#333333"/>
    <rect x="43" y="68" width="44" height="4" fill="#333333" opacity="0.12"/>
    <rect x="43" y="75" width="44" height="1.5" fill="#333333"/>
    <rect x="43" y="77" width="44" height="4" fill="#333333" opacity="0.12"/>
    <rect x="43" y="84" width="44" height="1.5" fill="#333333"/>
    <rect x="43" y="86" width="44" height="4" fill="#333333" opacity="0.12"/>
    <rect x="43" y="93" width="44" height="1.5" fill="#333333"/>
    <rect x="43" y="95" width="44" height="4" fill="#333333" opacity="0.12"/>
    <rect x="43" y="102" width="44" height="1.5" fill="#333333"/>
    <rect x="38" y="104" width="54" height="5" fill="#333333"/>
    <rect x="39" y="109" width="52" height="4" fill="#333333" opacity="0.12"/>
    <rect x="39" y="116" width="52" height="1.5" fill="#333333"/>
    <rect x="39" y="118" width="52" height="4" fill="#333333" opacity="0.12"/>
    <rect x="39" y="125" width="52" height="1.5" fill="#333333"/>
    <rect x="39" y="127" width="52" height="4" fill="#333333" opacity="0.12"/>
    <rect x="39" y="134" width="52" height="1.5" fill="#333333"/>
    <rect x="39" y="136" width="52" height="4" fill="#333333" opacity="0.12"/>
    <rect x="39" y="143" width="52" height="1.5" fill="#333333"/>
    <rect x="34" y="145" width="62" height="5" fill="#333333"/>
    <rect x="35" y="150" width="60" height="4" fill="#333333" opacity="0.12"/>
    <rect x="35" y="157" width="60" height="1.5" fill="#333333"/>
    <rect x="35" y="159" width="60" height="4" fill="#333333" opacity="0.12"/>
    <rect x="35" y="166" width="60" height="1.5" fill="#333333"/>
    <rect x="34" y="168" width="62" height="8" fill="#333333"/>
    <rect x="30" y="176" width="70" height="6" fill="#333333"/>
    <rect x="26" y="182" width="78" height="4" fill="#333333"/>
    <line x1="55" y1="63" x2="55" y2="168" stroke="#333333" strokeWidth="1" opacity="0.4"/>
    <line x1="65" y1="63" x2="65" y2="168" stroke="#333333" strokeWidth="1" opacity="0.3"/>
    <line x1="75" y1="63" x2="75" y2="168" stroke="#333333" strokeWidth="1" opacity="0.4"/>
  </svg>
);

export default function AEL() {
  const [stage, setStage] = useState<Stage>("closed");
  const [showBox, setShowBox] = useState(false);
  const [showSmile, setShowSmile] = useState(false);
  const [showAEL, setShowAEL] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [typedAEL, setTypedAEL] = useState("");
  const [typedSub, setTypedSub] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [bookName, setBookName] = useState("");
  const [bookEmail, setBookEmail] = useState("");
  const [bookProject, setBookProject] = useState("");
  const [bookSubmitted, setBookSubmitted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage !== "flash") return;
    const t = setTimeout(() => {
      setStage("intro");
      setShowBox(false); setShowSmile(false);
      setShowAEL(false); setShowSub(false);
      setTypedAEL(""); setTypedSub("");
    }, 450);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "intro") return;
    const t1 = setTimeout(() => setShowBox(true), 80);
    const t2 = setTimeout(() => setShowSmile(true), 580);
    const t3 = setTimeout(() => {
      setShowAEL(true);
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTypedAEL("AEL".slice(0, i));
        if (i >= 3) clearInterval(iv);
      }, 120);
    }, 1280);
    const t4 = setTimeout(() => {
      setShowSub(true);
      let i = 0;
      const sub = "your AI assistant";
      const iv = setInterval(() => {
        i++;
        setTypedSub(sub.slice(0, i));
        if (i >= sub.length) {
          clearInterval(iv);
          setTimeout(() => setStage("sand"), 650);
        }
      }, 60);
    }, 1880);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [stage]);

  useEffect(() => {
    if (stage !== "sand") return;
    const t = setTimeout(() => setStage("chat"), 1500);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (stage === "chat") setTimeout(() => inputRef.current?.focus(), 200);
  }, [stage]);

  const openAEL = () => setStage("flash");

  const closeAEL = () => {
    if (stage === "chat" && messages.length > 0) {
      setBookSubmitted(false);
      setStage("booking");
      return;
    }
    setStage("closed");
    setShowBox(false); setShowSmile(false);
    setShowAEL(false); setShowSub(false);
    setTypedAEL(""); setTypedSub("");
  };

  const dismissToClose = () => {
    setStage("closed");
    setShowBox(false); setShowSmile(false);
    setShowAEL(false); setShowSub(false);
    setTypedAEL(""); setTypedSub("");
    setMessages([]);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim() || !bookEmail.trim()) return;
    setBookSubmitted(true);
    setTimeout(() => dismissToClose(), 2200);
  };

  const send = async () => {
    if (!input.trim() || thinking || streaming) return;
    const userText = input.trim();
    setInput("");
    setThinking(true);
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    const apiMessages = [
      ...messages.filter((m) => !m.synthetic).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!response.ok) throw new Error("API error");
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      let messageAdded = false;
      setThinking(false);
      setStreaming(true);
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
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              fullReply += parsed.delta.text;
              const hasEscalation = fullReply.includes("{{BOOK_A_CALL}}");
              const displayText = fullReply.replace("{{BOOK_A_CALL}}", "").trimEnd();
              if (!messageAdded) {
                setMessages((prev) => [...prev, { role: "assistant", content: displayText, hasEscalation }]);
                messageAdded = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: displayText, hasEscalation };
                  return updated;
                });
              }
            }
          } catch { }
        }
      }
      setStreaming(false);
    } catch {
      setThinking(false);
      setStreaming(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ✅ Fixed: useMemo with closing ), [])
  const sandParticles = useMemo(() => Array.from({ length: 140 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 5 + 1.5,
    delay: Math.random() * 0.6,
    duration: Math.random() * 0.55 + 0.65,
    dx: -(Math.random() * 200 + 80),
    dy: (Math.random() - 0.5) * 90,
    opacity: Math.random() * 0.7 + 0.3,
    color: i % 4 === 0 ? "#6b6b6b" : i % 4 === 1 ? "#f5f2ed" : i % 4 === 2 ? "#9a9090" : "#d0ccc6",
  })), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        @keyframes flashFill {
          0%   { opacity: 0; transform: scaleX(0); transform-origin: right; }
          100% { opacity: 1; transform: scaleX(1); transform-origin: right; }
        }
        @keyframes boxPop {
          0%   { transform: scale(0.55); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          80%  { transform: scale(0.98); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes bgSlideLeft {
          0%   { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0.2; }
        }
        @keyframes sandLeft {
          0%   { transform: translate(0,0) scale(1); opacity: var(--op); filter: blur(0); }
          35%  { opacity: var(--op); filter: blur(0); }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; filter: blur(3px); }
        }
        @keyframes cardDriftLeft {
          0%   { transform: translateX(0) scale(1); opacity: 1; filter: blur(0); }
          30%  { opacity: 1; }
          100% { transform: translateX(-18%) scale(0.92); opacity: 0; filter: blur(4px); }
        }
        @keyframes chatReveal {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bookingReveal {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes drawStroke { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes successPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }

        .flash-fill      { animation: flashFill 0.38s cubic-bezier(0.16,1,0.3,1) forwards; }
        .box-pop         { animation: boxPop 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .text-in         { animation: fadeUpIn 0.4s ease forwards; }
        .bg-slide-left   { animation: bgSlideLeft 1.1s cubic-bezier(0.4,0,0.8,1) forwards; }
        .card-drift-left { animation: cardDriftLeft 1s cubic-bezier(0.3,0,0.8,1) 0.1s forwards; }
        .sand-particle   { animation: sandLeft var(--dur) cubic-bezier(0.2,0,0.9,0.8) var(--delay) forwards; }
        .chat-reveal     { animation: chatReveal 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .booking-reveal  { animation: bookingReveal 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .ael-msg         { animation: msgIn 0.25s ease both; }
        .success-pop     { animation: successPop 0.4s cubic-bezier(0.16,1,0.3,1) both; }

        .td { stroke-dasharray: 1000; stroke-dashoffset: 1000; fill: none; animation: drawStroke 0.6s ease forwards; }
        .td1{animation-delay:0.00s} .td2{animation-delay:0.10s}
        .td3{animation-delay:0.18s} .td4{animation-delay:0.26s}
        .td5{animation-delay:0.34s} .td6{animation-delay:0.42s}
        .td7{animation-delay:0.50s} .td8{animation-delay:0.58s}
        .td9{animation-delay:0.66s} .td10{animation-delay:0.74s}
        .td11{animation-delay:0.82s} .td12{animation-delay:0.88s}
        .tf { opacity: 0; animation: fadeIn 0.3s ease forwards; }
        .tf1{animation-delay:0.05s} .tf2{animation-delay:0.14s}
        .tf3{animation-delay:0.22s} .tf4{animation-delay:0.30s}
        .tf5{animation-delay:0.38s} .tf6{animation-delay:0.46s}
        .tf7{animation-delay:0.54s} .tf8{animation-delay:0.62s}
        .tf9{animation-delay:0.70s} .tf10{animation-delay:0.78s}
        .tf11{animation-delay:0.85s} .tf12{animation-delay:0.91s}

        .ael-input {
          flex: 1; background: #f0ede8; border: 1.5px solid #d8d4ce;
          border-radius: 12px; padding: 11px 15px; font-size: 14px;
          color: #1a1a1a; outline: none; font-family: 'Nunito', sans-serif;
          transition: border-color 0.2s;
        }
        .ael-input:focus { border-color: #999; }
        .ael-input::placeholder { color: #aaa; }
        .ael-scroll::-webkit-scrollbar { width: 3px; }
        .ael-scroll::-webkit-scrollbar-thumb { background: #d8d4ce; border-radius: 4px; }

        .book-input {
          width: 100%; background: #f0ede8; border: 1.5px solid #d8d4ce;
          border-radius: 10px; padding: 10px 14px; font-size: 14px;
          color: #1a1a1a; outline: none; font-family: 'Nunito', sans-serif;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .book-input:focus { border-color: #6b6b6b; }
        .book-input::placeholder { color: #bbb; }
        .book-textarea { resize: none; height: 80px; }
      `}</style>

      {/* ── Floating Tower Button ── */}
      {stage === "closed" && (
        <button onClick={openAEL}
          style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 50, background: "none", border: "none", padding: "0", cursor: "pointer", transition: "transform 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
          <TowerSVG width={36} height={52} />
        </button>
      )}

      {/* ── Flash ── */}
      {stage === "flash" && (
        <div className="flash-fill fixed inset-0 z-50" style={{ background: "#6b6b6b" }} />
      )}

      {/* ── Intro ── */}
      {stage === "intro" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#6b6b6b" }}>
          <div className={showBox ? "box-pop" : ""} style={{ opacity: showBox ? undefined : 0, background: "#f5f2ed", borderRadius: "24px", padding: "48px 56px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", minWidth: "320px" }}>
            {showSmile && (
              <svg width="80" height="130" viewBox="0 0 130 210" xmlns="http://www.w3.org/2000/svg">
                <path className="td td1" d="M65,4 L57,38 L73,38 Z" stroke="#333333" strokeWidth="2" strokeLinejoin="round"/>
                <rect className="tf tf1" x="61" y="35" width="8" height="18" fill="#333333"/>
                <path className="td td2" d="M44,53 L44,63 L86,63 L86,53 Z" stroke="#333333" strokeWidth="2"/>
                <rect className="tf tf2" x="48" y="47" width="5" height="8" rx="1" fill="#333333"/>
                <rect className="tf tf2" x="57" y="45" width="5" height="10" rx="1" fill="#333333"/>
                <rect className="tf tf2" x="68" y="45" width="5" height="10" rx="1" fill="#333333"/>
                <rect className="tf tf2" x="77" y="47" width="5" height="8" rx="1" fill="#333333"/>
                <path className="td td3" d="M43,63 L43,104 L87,104 L87,63" stroke="#333333" strokeWidth="2"/>
                <line className="tf tf3" x1="43" y1="75" x2="87" y2="75" stroke="#333333" strokeWidth="1.2"/>
                <line className="tf tf4" x1="43" y1="84" x2="87" y2="84" stroke="#333333" strokeWidth="1.2"/>
                <line className="tf tf5" x1="43" y1="93" x2="87" y2="93" stroke="#333333" strokeWidth="1.2"/>
                <path className="td td5" d="M38,104 L38,145 L92,145 L92,104 L87,104 L43,104 Z" stroke="#333333" strokeWidth="2"/>
                <line className="tf tf6" x1="38" y1="116" x2="92" y2="116" stroke="#333333" strokeWidth="1.2"/>
                <line className="tf tf6" x1="38" y1="125" x2="92" y2="125" stroke="#333333" strokeWidth="1.2"/>
                <line className="tf tf7" x1="38" y1="134" x2="92" y2="134" stroke="#333333" strokeWidth="1.2"/>
                <path className="td td7" d="M33,145 L33,168 L97,168 L97,145 L92,145 L38,145 Z" stroke="#333333" strokeWidth="2"/>
                <line className="tf tf8" x1="33" y1="157" x2="97" y2="157" stroke="#333333" strokeWidth="1.2"/>
                <path className="td td9" d="M33,168 L33,178 L97,178 L97,168" stroke="#333333" strokeWidth="2"/>
                <ellipse className="tf tf9" cx="47" cy="168" rx="4" ry="5" fill="#333333" opacity="0.15"/>
                <ellipse className="tf tf9" cx="59" cy="168" rx="4" ry="5" fill="#333333" opacity="0.15"/>
                <ellipse className="tf tf9" cx="65" cy="168" rx="4" ry="5" fill="#333333" opacity="0.15"/>
                <ellipse className="tf tf9" cx="71" cy="168" rx="4" ry="5" fill="#333333" opacity="0.15"/>
                <ellipse className="tf tf9" cx="83" cy="168" rx="4" ry="5" fill="#333333" opacity="0.15"/>
                <path className="td td10" d="M29,178 L29,186 L101,186 L101,178 L97,178 L33,178 Z" stroke="#333333" strokeWidth="2"/>
                <rect className="tf tf10" x="29" y="178" width="72" height="8" fill="#333333"/>
                <line className="td td11" x1="55" y1="63" x2="55" y2="168" stroke="#333333" strokeWidth="1" opacity="0.4"/>
                <line className="td td11" x1="65" y1="63" x2="65" y2="168" stroke="#333333" strokeWidth="1" opacity="0.3"/>
                <line className="td td11" x1="75" y1="63" x2="75" y2="168" stroke="#333333" strokeWidth="1" opacity="0.4"/>
                <text className="tf tf12" x="65" y="205" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="13" fill="#333333" letterSpacing="4">AEL</text>
              </svg>
            )}
            {showAEL && (
              <div className="text-in" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: "52px", color: "#333333", letterSpacing: "0.12em", lineHeight: 1 }}>
                {typedAEL}
                {typedAEL.length < 3 && <span style={{ display: "inline-block", width: "3px", height: "0.8em", background: "#333", marginLeft: "3px", verticalAlign: "middle", animation: "blink 0.7s step-end infinite" }} />}
              </div>
            )}
            {showSub && (
              <div className="text-in" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 400, fontSize: "14px", color: "#333333", letterSpacing: "0.04em", minHeight: "20px" }}>
                {typedSub}
                <span style={{ display: "inline-block", width: "2px", height: "1em", background: "#555", marginLeft: "2px", verticalAlign: "middle", animation: "blink 0.8s step-end infinite" }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sand ── */}
      {stage === "sand" && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="bg-slide-left absolute inset-0" style={{ background: "#6b6b6b" }} />
          <div className="card-drift-left absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
            <div style={{ background: "#f5f2ed", borderRadius: "24px", padding: "48px 56px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", minWidth: "320px" }}>
              <TowerSVG width={80} height={130} />
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: "52px", color: "#333333", letterSpacing: "0.12em" }}>AEL</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 400, fontSize: "14px", color: "#333333" }}>your AI assistant</div>
            </div>
          </div>
          {sandParticles.map((p) => (
            <div key={p.id} className="sand-particle" style={{ position: "absolute", top: p.top, left: p.left, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: p.color, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px`, ["--dur" as string]: `${p.duration}s`, ["--delay" as string]: `${p.delay}s`, ["--op" as string]: `${p.opacity}`, pointerEvents: "none" }} />
          ))}
        </div>
      )}

      {/* ── Booking Form ── */}
      {stage === "booking" && (
        <div className="booking-reveal fixed z-50 flex flex-col" style={{ bottom: "16px", right: "16px", width: "min(440px, calc(100vw - 32px))", borderRadius: "20px", background: "#f5f2ed", border: "1.5px solid #ddd9d2", boxShadow: "0 24px 60px rgba(0,0,0,0.14)", overflow: "hidden" }}>
          <div style={{ background: "#edeae4", borderBottom: "1.5px solid #ddd9d2", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div style={{ width: "40px", height: "52px", borderRadius: "10px", background: "#f5f2ed", border: "1.5px solid #d0ccc6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TowerSVG width={22} height={32} />
              </div>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "15px", color: "#6b6b6b" }}>Before you go</div>
                <div style={{ fontSize: "11px", color: "#b0aca6", marginTop: "1px" }}>Let us get you connected</div>
              </div>
            </div>
            <button onClick={dismissToClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0bbb4", padding: "4px", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#555")}
              onMouseLeave={e => (e.currentTarget.style.color = "#c0bbb4")}>
              <X size={17} />
            </button>
          </div>
          <div style={{ padding: "24px 22px" }}>
            {!bookSubmitted ? (
              <>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#555", lineHeight: "1.6", marginBottom: "20px" }}>
                  You left our conversation — no worries. Drop your details and we will reach out to continue where we left off.
                </p>
                <form onSubmit={submitBooking} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input className="book-input" placeholder="Your name" value={bookName} onChange={e => setBookName(e.target.value)} required />
                  <input className="book-input" type="email" placeholder="Email address" value={bookEmail} onChange={e => setBookEmail(e.target.value)} required />
                  <textarea className="book-input book-textarea" placeholder="What are you looking to build? (optional)" value={bookProject} onChange={e => setBookProject(e.target.value)} />
                  <button type="submit" style={{ background: "#6b6b6b", color: "white", border: "none", borderRadius: "12px", padding: "13px", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "opacity 0.2s", marginTop: "4px" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                    Book a Call →
                  </button>
                  <button type="button" onClick={() => setStage("chat")}
                    style={{ background: "none", border: "none", color: "#aaa", fontFamily: "'Nunito', sans-serif", fontSize: "13px", cursor: "pointer", padding: "4px", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#555")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#aaa")}>
                    Continue chatting instead
                  </button>
                </form>
              </>
            ) : (
              <div className="success-pop" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "20px 0", textAlign: "center" }}>
                <TowerSVG width={44} height={68} />
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "18px", color: "#333" }}>Got it, {bookName.split(" ")[0]}!</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#777", lineHeight: "1.6" }}>
                  We will reach out to <strong>{bookEmail}</strong> shortly.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chat Window ── */}
      {stage === "chat" && (
        <div className="chat-reveal fixed z-50 flex flex-col" style={{ bottom: "16px", right: "16px", width: "min(500px, calc(100vw - 32px))", height: "min(760px, calc(100vh - 32px))", borderRadius: "20px", background: "#f5f2ed", border: "1.5px solid #ddd9d2", boxShadow: "0 24px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          <div style={{ background: "#edeae4", borderBottom: "1.5px solid #ddd9d2", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div style={{ width: "40px", height: "52px", borderRadius: "10px", background: "#f5f2ed", border: "1.5px solid #d0ccc6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <TowerSVG width={22} height={32} />
              </div>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "15px", color: "#6b6b6b", letterSpacing: "0.04em" }}>AEL</div>
                <div style={{ fontSize: "11px", color: "#b0aca6", marginTop: "1px" }}>APSLOCK AI Agent</div>
              </div>
            </div>
            <button onClick={closeAEL} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0bbb4", padding: "4px", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#555")}
              onMouseLeave={e => (e.currentTarget.style.color = "#c0bbb4")}>
              <X size={17} />
            </button>
          </div>
          <div className="ael-scroll" style={{ flex: 1, overflowY: "auto", padding: "18px 14px", display: "flex", flexDirection: "column", gap: "10px", background: "#f5f2ed" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "12px" }}>
                <TowerSVG width={40} height={60} />
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "13px", color: "#b0aca6" }}>Ask me anything</span>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="ael-msg" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "5px" }}>
                <div style={{ maxWidth: "78%", padding: "11px 15px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "#6b6b6b" : "#edeae4", color: msg.role === "user" ? "#fff" : "#2a2a2a", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", fontFamily: "'Nunito', sans-serif", border: msg.role === "user" ? "none" : "1.5px solid #ddd9d2", boxShadow: msg.role === "user" ? "0 2px 10px rgba(107,107,107,0.25)" : "0 1px 4px rgba(0,0,0,0.04)" }}>
                  {msg.content}
                </div>
                {msg.hasEscalation && (
                  <a href="/contact" style={{ display: "inline-block", background: "#6b6b6b", color: "white", fontSize: "12px", fontWeight: 700, fontFamily: "'Nunito', sans-serif", padding: "9px 18px", borderRadius: "20px", textDecoration: "none", marginTop: "2px", transition: "opacity 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                    Book a Call →
                  </a>
                )}
              </div>
            ))}
            {thinking && (
              <div className="ael-msg" style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "13px 18px", background: "#edeae4", border: "1.5px solid #ddd9d2", borderRadius: "18px 18px 18px 4px", display: "flex", gap: "6px", alignItems: "center" }}>
                  {[0, 160, 320].map((d) => (
                    <span key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c0bbb4", display: "inline-block", animation: `dotBounce 1s ${d}ms ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "12px 14px", borderTop: "1.5px solid #ddd9d2", background: "#edeae4", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask anything..." disabled={thinking || streaming} className="ael-input" />
            <button onClick={send} disabled={!input.trim() || thinking || streaming}
              style={{ width: "40px", height: "40px", borderRadius: "12px", background: input.trim() ? "#6b6b6b" : "#d8d4ce", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s, transform 0.15s", flexShrink: 0, boxShadow: input.trim() ? "0 2px 10px rgba(107,107,107,0.3)" : "none" }}
              onMouseEnter={e => { if (input.trim()) e.currentTarget.style.transform = "scale(1.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              <Send size={15} color={input.trim() ? "#fff" : "#aaa"} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}