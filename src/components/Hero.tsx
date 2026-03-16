"use client";
import { useEffect, useRef } from "react";

export default function Hero() {
  const heroRef        = useRef<HTMLDivElement>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  const contentDarkRef = useRef<HTMLDivElement>(null);
  const dividerRef     = useRef<HTMLDivElement>(null);
  const darkCvRef      = useRef<HTMLCanvasElement>(null);
  const lightCvRef     = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let targetX = 50;
    let currentX = 50;
    let raf: number;

    const hero        = heroRef.current;
    const panel       = panelRef.current;
    const contentDark = contentDarkRef.current;
    const divider     = dividerRef.current;
    const darkCv      = darkCvRef.current;
    const lightCv     = lightCvRef.current;
    if (!hero || !panel || !contentDark || !divider) return;

    const dCtx = darkCv?.getContext("2d");
    const lCtx = lightCv?.getContext("2d");

    function resizeCv() {
      if (!hero || !darkCv || !lightCv) return;
      // dark canvas covers left half only
      darkCv.width  = hero.offsetWidth / 2;
      darkCv.height = hero.offsetHeight;
      // light canvas covers FULL width so it shows everywhere
      lightCv.width  = hero.offsetWidth;
      lightCv.height = hero.offsetHeight;
      initDrops();
    }

    const onMove  = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width) * 100;
    };
    const onLeave = () => { targetX = 50; };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    // ── MATRIX RAIN (dark side) — COMPLETELY UNCHANGED ──
    const chars = "アイウエオカキクケコサシスセソABCDEF012345ランダム".split("");
    const colW  = 14;
    let drops: number[] = [];

    function initDrops() {
      if (!darkCv) return;
      const cols = Math.floor(darkCv.width / colW);
      drops = Array.from({ length: cols }, () => Math.random() * darkCv.height);
    }

    function drawMatrix() {
      if (!dCtx || !darkCv) return;
      const W = darkCv.width, H = darkCv.height;
      dCtx.fillStyle = "rgba(11,15,26,0.12)";
      dCtx.fillRect(0, 0, W, H);
      drops.forEach((y, i) => {
        const ch    = chars[Math.floor(Math.random() * chars.length)];
        const alpha = y < colW * 2 ? 0.7 : 0.12 + Math.random() * 0.2;
        dCtx.fillStyle = `rgba(99,102,241,${alpha})`;
        dCtx.font = "11px monospace";
        dCtx.fillText(ch, i * colW, y);
        drops[i] = y > H + 10 && Math.random() > 0.97 ? 0 : y + colW;
      });
    }

    // ── FLOWING AURORA WAVES (light side — full width) ──
    function drawAurora(t: number) {
      if (!lCtx || !lightCv) return;
      const W = lightCv.width, H = lightCv.height;
      lCtx.clearRect(0, 0, W, H);

      // Layer 1 — wide slow waves
      const wave1 = [
        { amp: 55, freq: 0.008, speed: 0.4,  phase: 0,    alpha: 0.07, thick: 80, hue: 220 },
        { amp: 40, freq: 0.010, speed: 0.55, phase: 1.2,  alpha: 0.06, thick: 60, hue: 230 },
        { amp: 65, freq: 0.006, speed: 0.3,  phase: 2.4,  alpha: 0.05, thick: 100,hue: 210 },
        { amp: 35, freq: 0.012, speed: 0.7,  phase: 0.7,  alpha: 0.07, thick: 50, hue: 240 },
        { amp: 50, freq: 0.009, speed: 0.45, phase: 3.1,  alpha: 0.06, thick: 70, hue: 215 },
        { amp: 30, freq: 0.014, speed: 0.8,  phase: 1.8,  alpha: 0.05, thick: 45, hue: 250 },
      ];

      wave1.forEach(w => {
        const baseY = H * 0.5 + w.amp * Math.sin(t * 0.3 + w.phase * 2);
        lCtx.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = baseY + w.amp * Math.sin(x * w.freq + t * w.speed + w.phase);
          x === 0 ? lCtx.moveTo(x, y) : lCtx.lineTo(x, y);
        }

        // gradient stroke
        const grad = lCtx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0,    `hsla(${w.hue}, 70%, 65%, 0)`);
        grad.addColorStop(0.2,  `hsla(${w.hue}, 70%, 65%, ${w.alpha})`);
        grad.addColorStop(0.5,  `hsla(${w.hue}, 75%, 60%, ${w.alpha * 1.4})`);
        grad.addColorStop(0.8,  `hsla(${w.hue}, 70%, 65%, ${w.alpha})`);
        grad.addColorStop(1,    `hsla(${w.hue}, 70%, 65%, 0)`);

        lCtx.strokeStyle = grad;
        lCtx.lineWidth   = w.thick;
        lCtx.lineCap     = "round";
        lCtx.globalAlpha = 1;
        lCtx.stroke();
      });

      // Layer 2 — thin crisp lines on top
      const thinWaves = [
        { amp: 45, freq: 0.009, speed: 0.5,  phase: 0.3,  hue: 220 },
        { amp: 55, freq: 0.007, speed: 0.35, phase: 2.1,  hue: 240 },
        { amp: 38, freq: 0.011, speed: 0.65, phase: 1.0,  hue: 210 },
        { amp: 62, freq: 0.006, speed: 0.28, phase: 3.5,  hue: 230 },
      ];

      thinWaves.forEach(w => {
        const baseY = H * 0.5 + w.amp * Math.sin(t * 0.25 + w.phase);
        lCtx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = baseY + w.amp * Math.sin(x * w.freq + t * w.speed + w.phase);
          x === 0 ? lCtx.moveTo(x, y) : lCtx.lineTo(x, y);
        }
        const grad2 = lCtx.createLinearGradient(0, 0, W, 0);
        grad2.addColorStop(0,   `hsla(${w.hue}, 80%, 60%, 0)`);
        grad2.addColorStop(0.3, `hsla(${w.hue}, 80%, 60%, 0.18)`);
        grad2.addColorStop(0.7, `hsla(${w.hue}, 80%, 60%, 0.18)`);
        grad2.addColorStop(1,   `hsla(${w.hue}, 80%, 60%, 0)`);
        lCtx.strokeStyle = grad2;
        lCtx.lineWidth   = 1.2;
        lCtx.globalAlpha = 1;
        lCtx.stroke();
      });

      lCtx.globalAlpha = 1;
    }

    let t = 0;
    initDrops();
    window.addEventListener("resize", resizeCv);
    resizeCv();

    const animate = () => {
      // ── original split — completely unchanged ──
      currentX += (targetX - currentX) * 0.07;
      const p  = currentX.toFixed(2);
      const rp = (100 - currentX).toFixed(2);
      panel.style.clipPath       = `inset(0 ${rp}% 0 0)`;
      contentDark.style.clipPath = `inset(0 ${rp}% 0 0)`;
      divider.style.left         = `${p}%`;

      t += 0.016;
      drawMatrix();
      drawAurora(t);

      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resizeCv);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={heroRef} className="hero-wrap">

      {/* ── LIGHT SIDE BG ── */}
      <div className="bg-gradient" />
      {/* dot grid is applied via CSS on .dashed-grid-light */}
      <div className="dashed-grid-light" />

      {/* aurora canvas — FULL WIDTH, behind everything */}
      <canvas ref={lightCvRef} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }} />

      {/* ── DARK PANEL ── */}
      <div ref={panelRef} className="panel-dark">
        <div className="dark-bg" />
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <defs>
            <pattern id="grid-d" x="0" y="0" width="68" height="60" patternUnits="userSpaceOnUse">
              <path d="M 68 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-d)" />
        </svg>
        {/* matrix rain canvas inside dark panel */}
        <canvas ref={darkCvRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" }} />
      </div>

      {/* ── DIVIDER ── */}
      <div ref={dividerRef} className="divider">
        <div className="div-dot" />
      </div>

      {/* ── CORNER LABELS ── */}
      <div className="c-bl">Available for projects</div>
      <div className="c-tr">Studio · 2026</div>

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
          <button className="btn-cta-l"><span className="bi bi-d">↗</span>Book a Call</button>
          <button className="btn-work-l"><span className="bi bi-l">▶</span>View Our Work</button>
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
          <button className="btn-cta-d"><span className="bi bi-d">↗</span>Book a Call</button>
          <button className="btn-work-d"><span className="bi bi-d">▶</span>View Our Work</button>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600&display=swap');

        .hero-wrap { height: 100vh; min-height: 600px; background: #edf0f8; font-family: 'Sora', sans-serif; position: relative; overflow: hidden; }
        .bg-gradient { position: absolute; inset: 0; background: #edf0f8; z-index: 0; }
        .dashed-grid-light { position: absolute; inset: 0; z-index: 1; pointer-events: none; background-image: radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px); background-size: 28px 28px; }
        .panel-dark { position: absolute; inset: 0; background: #0b0f1a; clip-path: inset(0 50% 0 0); z-index: 2; overflow: hidden; }
        .dark-bg { position: absolute; inset: 0; background: linear-gradient(110deg, #0b0f1a 30%, #0d1428 60%, #101830 100%); }
        .divider { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: linear-gradient(180deg, transparent 5%, #3b82f6 25%, #6366f1 50%, #3b82f6 75%, transparent 95%); transform: translateX(-50%); z-index: 30; pointer-events: none; }
        .div-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.2), 0 0 24px rgba(59,130,246,0.5); }
        .content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; pointer-events: none; text-align: center; padding: 0 32px; }
        .content-dark { z-index: 20; clip-path: inset(0 50% 0 0); }
        .badge { display: inline-flex; align-items: center; gap: 7px; font-size: 9px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; margin-bottom: 26px; }
        .badge-l { color: #3b82f6; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); }
        .badge-d { color: #60a5fa; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); }
        .ldot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; display: inline-block; animation: ld 2s infinite; }
        @keyframes ld { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .title { font-family: 'Clash Display', sans-serif; font-size: 62px; font-weight: 700; letter-spacing: -3.5px; line-height: 0.92; margin-bottom: 22px; }
        .title-l { color: #0f172a; }
        .title-d { color: #ffffff; }
        .acc-l { color: #3b82f6; }
        .acc-d { color: #60a5fa; }
        .thin-l { font-weight: 300; color: #94a3b8; }
        .thin-d { font-weight: 300; color: rgba(255,255,255,0.28); }
        .sub { font-size: 13px; line-height: 1.8; font-weight: 300; max-width: 440px; margin: 0 auto 36px; }
        .sub-l { color: #64748b; }
        .sub-d { color: rgba(255,255,255,0.35); }
        .btns { display: flex; gap: 12px; pointer-events: all; }
        .btn-cta-l { display: inline-flex; align-items: center; gap: 10px; background: #0f172a; color: #fff; border: none; padding: 15px 28px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.35s cubic-bezier(0.34,1.4,0.64,1); }
        .btn-cta-l:hover { background: #3b82f6; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(59,130,246,0.3); }
        .btn-cta-d { display: inline-flex; align-items: center; gap: 10px; background: #3b82f6; color: #fff; border: none; padding: 15px 28px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.35s cubic-bezier(0.34,1.4,0.64,1); }
        .btn-cta-d:hover { background: #2563eb; transform: translateY(-3px); }
        .btn-work-l { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.9); color: #0f172a; border: 1px solid rgba(0,0,0,0.1); padding: 15px 24px; border-radius: 999px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.3s cubic-bezier(0.34,1.4,0.64,1); }
        .btn-work-l:hover { background: #fff; border-color: #0f172a; transform: translateY(-3px); }
        .btn-work-d { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.65); border: 1px solid rgba(255,255,255,0.12); padding: 15px 24px; border-radius: 999px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.3s; }
        .btn-work-d:hover { background: rgba(255,255,255,0.13); color: #fff; transform: translateY(-3px); }
        .bi { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .bi-d { background: rgba(255,255,255,0.15); }
        .bi-l { background: rgba(0,0,0,0.07); }
        .c-tr { position: absolute; top: 22px; right: 28px; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.18); z-index: 30; pointer-events: none; }
        .c-bl { position: absolute; bottom: 24px; left: 28px; font-size: 9px; font-weight: 600; letter-spacing: 1.5px; color: #94a3b8; z-index: 30; pointer-events: none; }
      `}</style>
    </div>
  );
}