"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ael_voice_enabled";

export default function VoiceAELButton() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "false") setEnabled(false);
  }, []);

  // Wait for VoiceAEL to expose __activateAEL
  useEffect(() => {
    if (!enabled) { setReady(false); return; }
    const check = setInterval(() => {
      if (typeof (window as any).__activateAEL === "function") {
        setReady(true);
        clearInterval(check);
      }
    }, 200);
    setTimeout(() => clearInterval(check), 8000);
    return () => clearInterval(check);
  }, [enabled]);

  const activate = () => {
    if (!enabled) return;
    (window as any).__activateAEL?.();
  };

  const toggleEnabled = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (!next) setReady(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "96px",
        left: "24px",
        zIndex: 9997,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <style>{`
        @keyframes ael-dot-pulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 6px #10b981; }
          50% { transform: scale(1.3); box-shadow: 0 0 14px #10b981, 0 0 28px #10b98155; }
        }
      `}</style>

      {/* Main button */}
      <button
        onClick={activate}
        disabled={!enabled || !ready}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: enabled ? "rgba(8,15,30,0.95)" : "rgba(20,20,20,0.85)",
          backdropFilter: "blur(12px)",
          border: `1.5px solid ${enabled && ready ? "rgba(59,130,246,0.5)" : "rgba(80,80,80,0.3)"}`,
          borderRadius: "999px",
          padding: "10px 18px 10px 13px",
          cursor: enabled && ready ? "pointer" : "default",
          transition: "all 0.25s ease",
          boxShadow: enabled && ready ? "0 4px 24px rgba(59,130,246,0.2)" : "0 2px 12px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={e => {
          if (!enabled || !ready) return;
          e.currentTarget.style.transform = "scale(1.04)";
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.8)";
          e.currentTarget.style.boxShadow = "0 6px 32px rgba(59,130,246,0.35)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.borderColor = enabled && ready ? "rgba(59,130,246,0.5)" : "rgba(80,80,80,0.3)";
          e.currentTarget.style.boxShadow = enabled && ready ? "0 4px 24px rgba(59,130,246,0.2)" : "0 2px 12px rgba(0,0,0,0.3)";
        }}
      >
        {/* Status dot */}
        <div style={{
          width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
          background: !enabled ? "#4b5563" : ready ? "#10b981" : "#f59e0b",
          animation: enabled && ready ? "ael-dot-pulse 2s ease-in-out infinite" : "none",
          boxShadow: enabled && ready ? "0 0 8px #10b981" : "none",
          transition: "background 0.3s",
        }} />

        {/* Text */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, lineHeight: 1,
            color: enabled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.3)",
            transition: "color 0.3s",
          }}>
            {!enabled ? "AEL disabled" : ready ? "AEL" : "AEL loading..."}
          </span>
          {enabled && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.3px", lineHeight: 1 }}>
              {ready ? "click or say AEL" : "initializing..."}
            </span>
          )}
        </div>

        {/* Mic icon */}
        {enabled && ready && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 2 }}>
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10a7 7 0 0 0 14 0"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
          </svg>
        )}
      </button>

      {/* Toggle ON/OFF pill */}
      <button
        onClick={toggleEnabled}
        title={enabled ? "Disable voice assistant" : "Enable voice assistant"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(8,15,30,0.95)",
          backdropFilter: "blur(12px)",
          border: `1.5px solid ${enabled ? "rgba(59,130,246,0.3)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: "999px",
          padding: "8px 12px",
          cursor: "pointer",
          transition: "all 0.25s ease",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {/* Toggle track */}
        <div style={{
          width: 28, height: 16, borderRadius: 8, position: "relative",
          background: enabled ? "#3b82f6" : "#374151",
          transition: "background 0.3s",
          flexShrink: 0,
        }}>
          <div style={{
            position: "absolute",
            top: 2, left: enabled ? 14 : 2,
            width: 12, height: 12, borderRadius: "50%",
            background: "white",
            transition: "left 0.25s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.5px",
          color: enabled ? "rgba(255,255,255,0.5)" : "rgba(239,68,68,0.7)",
          whiteSpace: "nowrap",
        }}>
          {enabled ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}