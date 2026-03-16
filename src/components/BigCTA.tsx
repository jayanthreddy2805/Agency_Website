"use client";
import { useEffect, useRef } from "react";

export default function BigCTA() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const ROWS = 7, GAP = 48;
    let W = 0;
    const H = ROWS * GAP;
    let mx = -9999, my = -9999;
    let raf: number;
    interface Arrow { x: number; y: number; angle: number; }
    let arrows: Arrow[] = [];

    function resize() {
      W = canvas.offsetWidth;
      canvas.width = W; canvas.height = H;
      arrows = [];
      const cols = Math.ceil(W / GAP) + 1;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < cols; c++)
          arrows.push({ x: c * GAP + GAP / 2, y: r * GAP + GAP / 2, angle: 0 });
    }

    function lerp(a: number, b: number, t: number) {
      let diff = b - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return a + diff * t;
    }

    function drawArrow(x: number, y: number, angle: number, alpha: number) {
      const len = 13, hw = 5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.globalAlpha = alpha; ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(len * 0.3, 0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(len, 0); ctx.lineTo(len - hw, -hw * 0.7);
      ctx.moveTo(len, 0); ctx.lineTo(len - hw,  hw * 0.7);
      ctx.stroke(); ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      arrows.forEach(a => {
        if (mx > 0) a.angle = lerp(a.angle, Math.atan2(my - a.y, mx - a.x), 0.08);
        else a.angle = lerp(a.angle, 0, 0.04);
        const dist = Math.sqrt((mx - a.x) ** 2 + (my - a.y) ** 2);
        const proximity = mx > 0 ? Math.max(0, 1 - dist / 300) : 0;
        drawArrow(a.x, a.y, a.angle, 0.28 + proximity * 0.65);
      });
      raf = requestAnimationFrame(frame);
    }

    const onMove  = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const onLeave = () => { mx = -9999; my = -9999; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", resize);
    resize(); raf = requestAnimationFrame(frame);
    return () => { canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mouseleave", onLeave); window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="bigcta">
      <div className="content">
        <h2 className="title">You've reached the end —<br />now let's start something new!</h2>
        <a href="/contact" className="cta-btn">Let's Connect</a>
        <div className="services">Web Development&nbsp;&bull;&nbsp;App Development&nbsp;&bull;&nbsp;UI/UX&nbsp;&bull;&nbsp;Branding&nbsp;&bull;&nbsp;Marketing</div>
      </div>
      <canvas ref={canvasRef} className="arrow-canvas" />

      <style jsx>{`
        .bigcta { background: #edf0f8; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .bigcta::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(0,0,0,0.13) 1px,transparent 1px); background-size:28px 28px; pointer-events:none; }
        .content { position: relative; z-index: 2; text-align: center; padding: 80px 40px 36px; }
        .title { font-family: 'Sora',sans-serif; font-size: 44px; font-weight: 800; color: #0f172a; line-height: 1.15; letter-spacing: -1.5px; margin-bottom: 32px; }
        .cta-btn { display: inline-block; background: #0f172a; color: #fff; padding: 16px 44px; border-radius: 999px; font-size: 15px; font-weight: 700; font-family: 'Sora',sans-serif; text-decoration: none; transition: all 0.35s cubic-bezier(0.34,1.4,0.64,1); margin-bottom: 28px; }
        .cta-btn:hover { background: #3b82f6; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(59,130,246,0.3); }
        .services { font-size: 13px; color: #94a3b8; font-family: 'Sora',sans-serif; letter-spacing: 0.3px; }
        .arrow-canvas { width: 100%; display: block; background: #edf0f8; cursor: crosshair; will-change: transform; }
      `}</style>
    </section>
  );
}
