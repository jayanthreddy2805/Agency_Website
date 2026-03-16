"use client";
import { useEffect, useRef } from "react";

const testimonials = [
  { name: "Rahul Mehta",  role: "Founder, SwiftCart",       text: "APSLOCK delivered our entire platform in 3 weeks. Quality was outstanding and communication seamless throughout.",      avatar: "RM", color: "#3b82f6" },
  { name: "Priya Sharma", role: "CEO, NovaBrand",            text: "Their UI/UX work transformed our product completely. User engagement went up 60% within the first month of launch.",   avatar: "PS", color: "#8b5cf6" },
  { name: "James Okafor", role: "CTO, FinEdge",              text: "Best dev team we've worked with. They understood our vision immediately and executed it flawlessly. Highly recommend.", avatar: "JO", color: "#06b6d4" },
  { name: "Sara Nair",    role: "Marketing Head, GrowthLab", text: "The digital marketing strategy they built tripled our leads in 2 months. Real results, not just promises.",            avatar: "SN", color: "#10b981" },
  { name: "Aditya Patel", role: "Co-founder, Buildify",      text: "From logo to full website, APSLOCK nailed our brand identity. Every detail was crafted with care and precision.",      avatar: "AP", color: "#f59e0b" },
  { name: "Mei Lin",      role: "Product Manager, Nexio",    text: "The app works flawlessly across all platforms. Our users absolutely love the experience. 10/10 would hire again.",      avatar: "ML", color: "#ef4444" },
];

const N = testimonials.length;
const RX = 480, RY = 80;
const NORMAL_SPEED = 0.18;

export default function TestimonialsCarousel() {
  const angleRef = useRef(0);
  const pausedRef = useRef(false);
  const targetAngleRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (targetAngleRef.current !== null) {
        const target = targetAngleRef.current;
        let diff = target - angleRef.current;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        if (Math.abs(diff) < 0.5) { angleRef.current = target % 360; targetAngleRef.current = null; }
        else { angleRef.current = (angleRef.current + diff * 0.12 + 360) % 360; }
      } else if (!pausedRef.current) {
        angleRef.current = (angleRef.current + NORMAL_SPEED) % 360;
      }

      testimonials.forEach((_, i) => {
        const a = (angleRef.current + (360 / N) * i) % 360;
        const rad = (a * Math.PI) / 180;
        const x = Math.sin(rad) * RX;
        const y = -Math.cos(rad) * RY;
        const depth = (Math.cos(rad) + 1) / 2;
        const scale = 0.58 + depth * 0.44;
        const opacity = depth < 0.15 ? 0 : Math.pow(depth, 1.8);
        const rotateY = -Math.sin(rad) * 36;
        const brightness = 0.55 + depth * 0.45;
        const shadow = depth > 0.7 ? `0 ${Math.round(depth*24)}px ${Math.round(depth*40)}px rgba(0,0,0,${(depth*0.18).toFixed(2)})` : "none";
        const card = document.getElementById(`t-card-${i}`);
        const dot  = document.getElementById(`t-dot-${i}`);
        if (card) {
          card.style.transform = `translateX(${x}px) translateY(${y}px) rotateY(${rotateY}deg) scale(${scale})`;
          card.style.zIndex = String(Math.round(depth * 100));
          card.style.opacity = opacity.toFixed(3);
          card.style.filter = `brightness(${brightness.toFixed(2)})`;
          card.style.boxShadow = shadow;
        }
        if (dot) dot.className = depth > 0.9 ? "t-dot t-dot-active" : "t-dot";
      });
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const goToCard = (i: number) => {
    targetAngleRef.current = (360 - (360 / N) * i + 360) % 360;
  };

  return (
    <section className="ts-section">
      <div className="ts-heading">
        <span className="ts-eyebrow">What clients say</span>
        <h2>Trusted by Founders & Teams</h2>
        <p>Real results from real people who chose APSLOCK.</p>
      </div>

      <div className="ts-stage">
        <div className="ts-track">
          {testimonials.map((t, i) => (
            <div key={i} id={`t-card-${i}`} className="ts-card"
              onMouseEnter={() => { pausedRef.current = true; }}
              onMouseLeave={() => { pausedRef.current = false; }}>
              <div className="ts-card-top">
                <div className="ts-avatar" style={{ background: t.color }}>{t.avatar}</div>
                <div className="ts-stars">★★★★★</div>
              </div>
              <p className="ts-quote">"{t.text}"</p>
              <div className="ts-divider" />
              <div className="ts-name">{t.name}</div>
              <div className="ts-role">{t.role}</div>
              <div className="ts-verified">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="5" fill="#3b82f6"/>
                  <path d="M3 5l1.5 1.5L7 3.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verified client
              </div>
            </div>
          ))}
        </div>
        <div className="ts-floor" />
      </div>

      <div className="ts-dots">
        {testimonials.map((_, i) => (
          <div key={i} id={`t-dot-${i}`} className="t-dot" onClick={() => goToCard(i)} />
        ))}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

        .ts-section {
          padding: 100px 0 90px;
          background: #edf0f8;
          overflow: hidden;
          font-family: 'Sora', sans-serif;
          text-align: center;
          position: relative;
        }
        .ts-section::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .ts-heading { margin-bottom: 64px; padding: 0 20px; position: relative; z-index: 1; }
        .ts-eyebrow { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: #3b82f6; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); padding: 5px 14px; border-radius: 999px; margin-bottom: 16px; }
        .ts-heading h2 { font-size: 40px; font-weight: 700; color: #0f172a; margin: 0 0 10px; letter-spacing: -1px; }
        .ts-heading p { font-size: 15px; color: #64748b; margin: 0; }

        .ts-stage { position: relative; height: 400px; display: flex; align-items: center; justify-content: center; perspective: 1000px; z-index: 1; }
        .ts-track { position: relative; width: 0; height: 0; }
        .ts-card { position: absolute; width: 280px; left: -140px; top: -160px; background: #fff; border-radius: 20px; padding: 26px 24px 22px; text-align: left; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; will-change: transform,opacity; }
        .ts-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .ts-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .ts-stars { color: #f59e0b; font-size: 12px; letter-spacing: 1px; }
        .ts-quote { font-size: 13px; line-height: 1.75; color: #334155; margin: 0 0 16px; min-height: 68px; font-style: italic; }
        .ts-divider { height: 1px; background: #f1f5f9; margin-bottom: 14px; }
        .ts-name { font-size: 13px; font-weight: 700; color: #0f172a; }
        .ts-role { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .ts-verified { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: #3b82f6; font-weight: 600; margin-top: 8px; }
        .ts-floor { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 700px; height: 35px; background: radial-gradient(ellipse,rgba(0,0,0,0.06) 0%,transparent 70%); pointer-events: none; border-radius: 50%; }

        .ts-dots { display: flex; justify-content: center; gap: 7px; margin-top: 32px; position: relative; z-index: 1; }
        :global(.t-dot) { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; cursor: pointer; transition: all 0.3s; }
        :global(.t-dot-active) { width: 22px; border-radius: 999px; background: #3b82f6; }
      `}</style>
    </section>
  );
}
