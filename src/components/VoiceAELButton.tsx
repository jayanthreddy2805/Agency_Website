"use client";

export default function VoiceAELButton() {
  const activate = () => {
    if (typeof window !== "undefined") {
      (window as any).__activateAEL?.();
    }
  };

  return (
    <div
      onClick={activate}
      style={{
        position: "fixed", bottom: "84px", left: "24px", zIndex: 49,
        display: "flex", alignItems: "center", gap: "8px",
        background: "rgba(15,23,42,0.88)", backdropFilter: "blur(10px)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: "999px", padding: "7px 16px 7px 11px",
        fontFamily: "'Sora',sans-serif",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.7)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(59,130,246,0.35)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
      }}
    >
      <style>{`
        @keyframes ael-btn-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#10b981", boxShadow: "0 0 10px #10b981",
        animation: "ael-btn-pulse 2s ease-in-out infinite",
      }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>
        Say <span style={{ color: "#60a5fa", fontWeight: 700 }}>AEL</span>
        <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 6 }}>or click</span>
      </span>
    </div>
  );
}