"use client";
import { useState } from "react";

const services = [
  { num: "01", tag: "Development", title: "Web\nDevelopment",   desc: "Fast, responsive websites built to convert visitors into customers. Crafted with precision.",     img: "/web.png",    color: "#ea580c", strip: "Web Dev"    },
  { num: "02", tag: "Mobile",      title: "App\nDevelopment",   desc: "Native & cross-platform apps that users love. Built for performance and scale.",                   img: "/app.png",    color: "#059669", strip: "App Dev"    },
  { num: "03", tag: "Design",      title: "UI / UX\nDesign",    desc: "Interfaces that feel intuitive, delightful and keep users coming back for more.",                  img: "/uiux.png",   color: "#7c3aed", strip: "UI/UX"      },
  { num: "04", tag: "Identity",    title: "Logo\nDesigning",    desc: "Bold identities that are unique, memorable and built to last a lifetime.",                         img: "/logo.png",   color: "#1d4ed8", strip: "Branding"   },
  { num: "05", tag: "Growth",      title: "Digital\nMarketing", desc: "Campaigns that drive real, measurable growth for your business.",                                  img: "/market.png", color: "#0891b2", strip: "Marketing"  },
];

export default function Services() {
  const [active, setActive] = useState(0);

  return (
    <section className="s-section">
      <div className="s-grid" />

      <div className="s-head">
        <div className="s-head-left">
          <span className="s-eye">What we offer</span>
          <h2 className="s-h2">Our Services</h2>
        </div>
        <div className="s-hint">Hover to explore <span className="s-arrow">→</span></div>
      </div>

      <div className="panel">
        {services.map((svc, i) => (
          <div key={i} className={`svc${i === active ? " active" : ""}`} onMouseEnter={() => setActive(i)}>
            <div className="svc-line" />
            <div className="svc-bg" style={{ backgroundImage: `url('${svc.img}')`, backgroundColor: svc.color }} />
            <div className="svc-overlay" />
            <div className="svc-strip">
              <div className="strip-num">{svc.num}</div>
              <div className="strip-name">{svc.strip}</div>
            </div>
            <div className="svc-content">
              <div className="svc-tag">{svc.num} — {svc.tag}</div>
              <h3 className="svc-title">{svc.title.split("\n").map((line, j) => (<span key={j}>{line}{j === 0 && <br />}</span>))}</h3>
              <p className="svc-desc">{svc.desc}</p>
              <div className="svc-btn">Explore →</div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap');

        .s-section {
          background: #edf0f8;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .s-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px);
          background-size: 28px 28px;
          z-index: 0; pointer-events: none;
        }
        .s-head {
          padding: 80px 60px 24px; position: relative; z-index: 2;
          display: flex; align-items: flex-end; justify-content: space-between;
        }
        .s-eye {
          display: inline-block; font-size: 9px; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; color: #3b82f6;
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
          padding: 5px 14px; border-radius: 999px; margin-bottom: 12px;
        }
        .s-h2 { font-family: 'Clash Display', sans-serif; font-size: 44px; font-weight: 700; color: #0f172a; letter-spacing: -2px; line-height: 1; margin: 0; }
        .s-hint { font-size: 11px; color: #94a3b8; font-weight: 500; display: flex; align-items: center; gap: 6px; padding-bottom: 6px; }
        .s-arrow { display: inline-block; animation: nudge 1.5s ease-in-out infinite; }
        @keyframes nudge { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }

        .panel { display: flex; height: 520px; position: relative; z-index: 2; }
        .svc { position: relative; overflow: hidden; cursor: pointer; flex: 0.5; border-right: 1px solid rgba(0,0,0,0.06); transition: flex 0.65s cubic-bezier(0.4,0,0.2,1); }
        .svc:last-child { border-right: none; }
        .svc.active { flex: 4; }
        .svc-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,#3b82f6,#6366f1); transform: scaleX(0); transform-origin: left; transition: transform 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1); z-index: 4; }
        .svc.active .svc-line { transform: scaleX(1); }
        .svc-bg { position: absolute; inset: 0; background-size: cover; background-position: center; transform: scale(1.05); transition: transform 0.65s cubic-bezier(0.4,0,0.2,1), opacity 0.5s; opacity: 0.12; }
        .svc.active .svc-bg { opacity: 1; transform: scale(1); }
        .svc-overlay { position: absolute; inset: 0; background: linear-gradient(to right,rgba(8,12,20,0.78) 0%,rgba(8,12,20,0.2) 60%,transparent 100%); opacity: 0; transition: opacity 0.5s; z-index: 1; }
        .svc.active .svc-overlay { opacity: 1; }
        .svc-strip { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; opacity: 1; transition: opacity 0.3s; z-index: 2; }
        .svc.active .svc-strip { opacity: 0; pointer-events: none; }
        .strip-num { font-family: 'Clash Display', sans-serif; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; }
        .strip-name { font-family: 'Clash Display', sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); letter-spacing: 1px; white-space: nowrap; }
        .svc-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 36px; opacity: 0; transform: translateY(20px); transition: all 0.5s 0.2s cubic-bezier(0.4,0,0.2,1); z-index: 3; }
        .svc.active .svc-content { opacity: 1; transform: translateY(0); }
        .svc-tag { font-size: 9px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
        .svc-title { font-family: 'Clash Display', sans-serif; font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -1px; line-height: 1.1; margin-bottom: 10px; }
        .svc-desc { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.7; font-weight: 300; max-width: 300px; margin-bottom: 20px; }
        .svc-btn { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 20px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Sora', sans-serif; }
        .svc-btn:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </section>
  );
}
