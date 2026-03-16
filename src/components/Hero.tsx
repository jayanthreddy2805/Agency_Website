"use client";
import { useEffect, useRef } from "react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentDarkRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let targetX = 50;
    let currentX = 50;
    let raf: number;

    const hero = heroRef.current;
    const panel = panelRef.current;
    const contentDark = contentDarkRef.current;
    const divider = dividerRef.current;
    if (!hero || !panel || !contentDark || !divider) return;

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width) * 100;
    };
    const onLeave = () => { targetX = 50; };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    const animate = () => {
      currentX += (targetX - currentX) * 0.07;
      const p = currentX.toFixed(2);
      const rp = (100 - currentX).toFixed(2);
      panel.style.clipPath = `inset(0 ${rp}% 0 0)`;
      contentDark.style.clipPath = `inset(0 ${rp}% 0 0)`;
      divider.style.left = `${p}%`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={heroRef} className="hero-wrap">

      {/* ── LIGHT SIDE BG ── */}
      <div className="bg-gradient" />
      <div className="dashed-grid-light">
        <svg
          width="100%" height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <pattern id="grid-l" x="0" y="0" width="68" height="60" patternUnits="userSpaceOnUse">
              <path d="M 68 0 L 0 0 0 60" fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="0.8" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-l)" />
        </svg>
      </div>

      {/* ── DARK PANEL ── */}
      <div ref={panelRef} className="panel-dark">
        <div className="dark-bg" />
        <svg
          width="100%" height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <defs>
            <pattern id="grid-d" x="0" y="0" width="68" height="60" patternUnits="userSpaceOnUse">
              <path d="M 68 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-d)" />
        </svg>
      </div>

      {/* ── DIVIDER ── */}
      <div ref={dividerRef} className="divider">
        <div className="div-dot" />
      </div>

      {/* ── CORNER LABELS ── */}
      <div className="c-tr">Studio · 2024</div>
      <div className="c-bl">Available for projects</div>

      {/* ── LIGHT CONTENT ── */}
      <div className="content">
        <div className="badge badge-l">
          <span className="ldot" />
          Digital Product Studio
        </div>
        <h1 className="title title-l">
          We Build<br />
          <span className="acc-l">Digital</span> Products<br />
          <span className="thin-l">That Drive Growth.</span>
        </h1>
        <p className="sub sub-l">
          We help startups and businesses design, build and scale modern digital
          products using cutting-edge technologies.
        </p>
        <div className="btns">
          <button className="btn-cta-l">
            <span className="bi bi-d">↗</span>Book a Call
          </button>
          <button className="btn-work-l">
            <span className="bi bi-l">▶</span>View Our Work
          </button>
        </div>
      </div>

      {/* ── DARK CONTENT ── */}
      <div ref={contentDarkRef} className="content content-dark">
        <div className="badge badge-d">
          <span className="ldot" />
          Digital Product Studio
        </div>
        <h1 className="title title-d">
          We Build<br />
          <span className="acc-d">Digital</span> Products<br />
          <span className="thin-d">That Drive Growth.</span>
        </h1>
        <p className="sub sub-d">
          We help startups and businesses design, build and scale modern digital
          products using cutting-edge technologies.
        </p>
        <div className="btns">
          <button className="btn-cta-d">
            <span className="bi bi-d">↗</span>Book a Call
          </button>
          <button className="btn-work-d">
            <span className="bi bi-d">▶</span>View Our Work
          </button>
        </div>
      </div>

      {/* ── HINT ── */}
      <div className="c-tr">Studio · 2026</div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600&display=swap');

        .hero-wrap {
          height: 100vh;
          min-height: 600px;
          background: #ffffff;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Light BG */
        .bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, #ffffff 30%, #e8edf8 55%, #dce4f5 75%, #d4dff2 100%);
          z-index: 0;
        }
        .dashed-grid-light {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        /* Dark panel */
        .panel-dark {
          position: absolute;
          inset: 0;
          background: #0b0f1a;
          clip-path: inset(0 50% 0 0);
          z-index: 2;
          overflow: hidden;
        }
        .dark-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, #0b0f1a 30%, #0d1428 60%, #101830 100%);
        }

        /* Divider */
        .divider {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background: linear-gradient(180deg, transparent 5%, #3b82f6 25%, #6366f1 50%, #3b82f6 75%, transparent 95%);
          transform: translateX(-50%);
          z-index: 30;
          pointer-events: none;
        }
        .div-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.2), 0 0 24px rgba(59,130,246,0.5);
        }

        /* Content */
        .content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: none;
          text-align: center;
          padding: 0 32px;
        }
        .content-dark {
          z-index: 20;
          clip-path: inset(0 50% 0 0);
        }

        /* Badge */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 26px;
        }
        .badge-l { color: #3b82f6; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); }
        .badge-d { color: #60a5fa; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); }
        .ldot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #22c55e; display: inline-block;
          animation: ld 2s infinite;
        }
        @keyframes ld { 0%,100%{opacity:1} 50%{opacity:0.2} }

        /* Title */
        .title {
          font-family: 'Clash Display', sans-serif;
          font-size: 62px;
          font-weight: 700;
          letter-spacing: -3.5px;
          line-height: 0.92;
          margin-bottom: 22px;
        }
        .title-l { color: #0f172a; }
        .title-d { color: #ffffff; }
        .acc-l { color: #3b82f6; }
        .acc-d { color: #60a5fa; }
        .thin-l { font-weight: 300; color: #94a3b8; }
        .thin-d { font-weight: 300; color: rgba(255,255,255,0.28); }

        /* Sub */
        .sub {
          font-size: 13px;
          line-height: 1.8;
          font-weight: 300;
          max-width: 440px;
          margin: 0 auto 36px;
        }
        .sub-l { color: #64748b; }
        .sub-d { color: rgba(255,255,255,0.35); }

        /* Buttons */
        .btns { display: flex; gap: 12px; pointer-events: all; }

        .btn-cta-l {
          display: inline-flex; align-items: center; gap: 10px;
          background: #0f172a; color: #fff; border: none;
          padding: 15px 28px; border-radius: 999px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif;
          transition: all 0.35s cubic-bezier(0.34,1.4,0.64,1);
        }
        .btn-cta-l:hover { background: #3b82f6; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(59,130,246,0.3); }

        .btn-cta-d {
          display: inline-flex; align-items: center; gap: 10px;
          background: #3b82f6; color: #fff; border: none;
          padding: 15px 28px; border-radius: 999px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif;
          transition: all 0.35s cubic-bezier(0.34,1.4,0.64,1);
        }
        .btn-cta-d:hover { background: #2563eb; transform: translateY(-3px); }

        .btn-work-l {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.9); color: #0f172a;
          border: 1px solid rgba(0,0,0,0.1);
          padding: 15px 24px; border-radius: 999px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'Sora', sans-serif;
          transition: all 0.3s cubic-bezier(0.34,1.4,0.64,1);
        }
        .btn-work-l:hover { background: #fff; border-color: #0f172a; transform: translateY(-3px); }

        .btn-work-d {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 15px 24px; border-radius: 999px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'Sora', sans-serif;
          transition: all 0.3s;
        }
        .btn-work-d:hover { background: rgba(255,255,255,0.13); color: #fff; transform: translateY(-3px); }

        .bi {
          width: 20px; height: 20px; border-radius: 50%;
          display: inline-flex; align-items: center;
          justify-content: center; font-size: 9px;
        }
        .bi-d { background: rgba(255,255,255,0.15); }
        .bi-l { background: rgba(0,0,0,0.07); }

        /* Corners */
        .c-tr {
          position: absolute; top: 22px; right: 28px;
          font-size: 9px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.18);
          z-index: 30; pointer-events: none;
        }
        .c-bl {
          position: absolute; bottom: 24px; left: 28px;
          font-size: 9px; font-weight: 600; letter-spacing: 1.5px;
          color: #94a3b8; z-index: 30; pointer-events: none;
        }

        /* Hint */
        .hint {
          position: absolute; bottom: 24px; width: 100%;
          display: flex; justify-content: center;
          z-index: 30; pointer-events: none;
        }
        .hint-t {
          font-size: 9px; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
