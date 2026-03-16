"use client";
import { useEffect, useRef } from "react";

const items = [
  { title: "Impact-Driven Results",    desc: "Every pixel crafted to grow your business, wow your users, and deliver real measurable results.",           shape: "cross",   cls: "c0" },
  { title: "Transparent Pricing",      desc: "No hidden fees, no surprises. The number you agree to is exactly what you pay. Full clarity from day one.", shape: "hex",     cls: "c1" },
  { title: "Fast & Reliable Delivery", desc: "Days not months. Focused sprints with real progress every single day. No delays, no excuses, ever.",        shape: "cubes",   cls: "c2" },
  { title: "Senior-Only Team",         desc: "Senior experts only. We tackle your hardest technical and creative challenges with skill and precision.",    shape: "sphere",  cls: "c3" },
  { title: "Seamless Collaboration",   desc: "Dedicated contact, daily updates and a live project board. You are always in the loop and in control.",     shape: "torus",   cls: "c4" },
  { title: "Direct Access to Talent",  desc: "Zero middlemen. You talk directly to the senior people building your product each and every single day.",   shape: "diamond", cls: "c5" },
];

declare global {
  interface Window { THREE: any; }
}

function makeShape(THREE: any, shape: string, mat: any, gmat: any, sc: number) {
  const grp = new THREE.Group();
  if (shape === "cross") {
    const b = 0.65 * sc, l = 2.6 * sc;
    [[l,b,b],[b,l,b],[b,b,l]].forEach(([w,h,d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
      m.castShadow = true; grp.add(m);
    });
  } else if (shape === "hex") {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.0*sc,1.0*sc,1.3*sc,6,1), mat);
    m.castShadow = true; grp.add(m);
    for (let f = 0; f < 6; f++) {
      const a = f/6*Math.PI*2 + Math.PI/6;
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.6*sc,0.6*sc,0.06*sc), gmat);
      fm.position.set(Math.sin(a)*0.72*sc, 0, Math.cos(a)*0.72*sc);
      fm.rotation.y = -a; grp.add(fm);
    }
  } else if (shape === "cubes") {
    [[-0.85,-0.85,0],[0.85,-0.85,0],[-0.85,0.85,0],[0.85,0.85,0]].forEach((p,j) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sc,sc,sc), mat);
      m.position.set(p[0]*sc, p[1]*sc, 0);
      m.rotation.set(0.3+j*0.2, 0.4+j*0.35, 0.1+j*0.1);
      m.castShadow = true; grp.add(m);
    });
  } else if (shape === "sphere") {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1.1*sc,32,32), mat);
    m.castShadow = true; grp.add(m);
    [[1.5*sc,Math.PI/2],[1.7*sc,Math.PI/3],[1.4*sc,Math.PI/4]].forEach(([r,rx]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04*sc, 8, 72), gmat);
      ring.rotation.x = rx; grp.add(ring);
    });
  } else if (shape === "torus") {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1.0*sc, 0.5*sc, 24, 80), mat);
    m.castShadow = true; grp.add(m);
    grp.rotation.x = 0.5;
  } else if (shape === "diamond") {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.1*sc, 0), mat);
    m.castShadow = true; m.scale.set(1,1.55,1); grp.add(m);
  }
  return grp;
}

function initCard(THREE: any, idx: number, shape: string) {
  const card = document.getElementById(`wcu-card${idx}`);
  const cv   = document.getElementById(`wcu-cv${idx}`) as HTMLCanvasElement;
  if (!card || !cv || card.offsetWidth === 0) return;

  const W = card.offsetWidth, H = card.offsetHeight;
  cv.width = W; cv.height = H;
  cv.style.width = W + "px"; cv.style.height = H + "px";

  // blurred bg canvas
  const bgCv = document.createElement("canvas");
  bgCv.width = W; bgCv.height = H;
  bgCv.style.cssText = `position:absolute;top:0;left:0;width:${W}px;height:${H}px;z-index:1;filter:blur(24px);opacity:0.65;`;
  card.insertBefore(bgCv, cv);

  function mkRenderer(canvas: HTMLCanvasElement, shadows: boolean) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setSize(W, H);
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.3;
    r.shadowMap.enabled = shadows;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    return r;
  }

  function mkScene() {
    const s = new THREE.Scene();
    s.add(new THREE.AmbientLight(0xffffff, 0.3));
    const sun = new THREE.DirectionalLight(0xffffff, 4.0);
    sun.position.set(-3, 6, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512); sun.shadow.radius = 8;
    s.add(sun);
    const fill = new THREE.DirectionalLight(0x8899ff, 1.0);
    fill.position.set(4, 2, -2); s.add(fill);
    const back = new THREE.DirectionalLight(0xffffff, 0.4);
    back.position.set(0, -3, 4); s.add(back);
    return s;
  }

  function mkCam() {
    const c = new THREE.PerspectiveCamera(40, W/H, 0.1, 100);
    c.position.set(0, 1.5, 6); c.lookAt(0, 0, 0); return c;
  }

  const dark = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, metalness: 0.2, roughness: 0.75 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.3 });

  // BG scene
  const bgScene = mkScene(), bgCam = mkCam(), bgR = mkRenderer(bgCv, false);
  const bgGrp = makeShape(THREE, shape,
    new THREE.MeshStandardMaterial({ color: 0x080808, metalness: 0.1, roughness: 0.9 }), grey, 2.2);
  bgGrp.rotation.x = 0.3; bgGrp.position.set(0.4, 0.2, 0);
  bgScene.add(bgGrp);

  // FG scene
  const fgScene = mkScene(), fgCam = mkCam(), fgR = mkRenderer(cv, true);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30,30), new THREE.ShadowMaterial({ opacity: 0.45 }));
  fl.rotation.x = -Math.PI/2; fl.position.y = -2.5; fl.receiveShadow = true; fgScene.add(fl);
  const fgGrp = makeShape(THREE, shape, dark, grey, 0.62);
  fgGrp.rotation.x = 0.3; fgGrp.position.set(0, 0.5, 0);
  fgScene.add(fgGrp);

  let mx = 0, my = 0, hover = false, tx = 0, ty = 0;
  card.addEventListener("mousemove", e => {
    const r = card.getBoundingClientRect();
    mx = (e.clientX - r.left - r.width/2) / (r.width/2);
    my = (e.clientY - r.top  - r.height/2) / (r.height/2);
    hover = true;
  });
  card.addEventListener("mouseleave", () => { hover = false; mx = 0; my = 0; });

  (function animate() {
    requestAnimationFrame(animate);
    bgGrp.rotation.y += 0.004; bgGrp.rotation.z += 0.001;
    fgGrp.rotation.y += hover ? 0.022 : 0.008;
    tx += (my * 0.3 - tx) * 0.05; ty += (mx * 0.3 - ty) * 0.05;
    fgGrp.rotation.x = 0.3 + tx; fgGrp.rotation.z = ty * 0.2;
    bgR.render(bgScene, bgCam);
    fgR.render(fgScene, fgCam);
  })();
}

export default function WhyChooseUs() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      loaded.current = true;
      const THREE = (window as any).THREE;
      setTimeout(() => {
        items.forEach((item, i) => initCard(THREE, i, item.shape));
      }, 100);
    };
    document.head.appendChild(script);
  }, []);

  return (
    <section className="wcu-section">
      <div className="wcu-grid-bg" />

      {/* Heading */}
      <div className="wcu-head">
        <span className="wcu-eye">Why choose us</span>
        <h2 className="wcu-h2">
          Why <span className="wcu-bl">APSLOCK</span> is<br />
          <span className="wcu-thin">the right choice.</span>
        </h2>
      </div>

      {/* Cards */}
      <div className="wcu-cards">
        {items.map((item, i) => (
          <div key={i} className={`wcu-card wcu-${item.cls}`} id={`wcu-card${i}`}>
            <canvas id={`wcu-cv${i}`} style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }} />
            <div className="wcu-ctext">
              <div className="wcu-ctitle">{item.title}</div>
              <div className="wcu-cdesc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap');

        .wcu-section {
          background: #edf0f8;
          font-family: 'Sora', sans-serif;
          padding: 80px 40px 96px;
          position: relative;
          overflow: hidden;
        }
        .wcu-grid-bg {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .wcu-head {
          text-align: center;
          margin-bottom: 52px;
          position: relative; z-index: 2;
        }
        .wcu-eye {
          display: inline-block;
          font-size: 9px; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase;
          color: #3b82f6; background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.2);
          padding: 5px 14px; border-radius: 999px; margin-bottom: 14px;
        }
        .wcu-h2 {
          font-family: 'Clash Display', sans-serif;
          font-size: 46px; font-weight: 700; color: #0f172a;
          letter-spacing: -2.5px; line-height: 0.95; margin: 0;
        }
        .wcu-bl { color: #3b82f6; }
        .wcu-thin { font-weight: 300; color: #94a3b8; }

        .wcu-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          max-width: 960px;
          margin: 0 auto;
          position: relative; z-index: 2;
        }
        .wcu-card {
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          height: 400px;
          cursor: pointer;
          transition: transform .45s cubic-bezier(.34,1.4,.64,1), box-shadow .45s;
        }
        .wcu-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 28px 60px rgba(0,0,0,.2);
        }
        .wcu-c0 { background: linear-gradient(160deg,#5c6bc0,#7e57c2,#9575cd); }
        .wcu-c1 { background: linear-gradient(160deg,#4a5db5,#7986cb,#9fa8da); }
        .wcu-c2 { background: linear-gradient(160deg,#4a5db5,#7c4dff,#b388ff); }
        .wcu-c3 { background: linear-gradient(160deg,#3949ab,#5c6bc0,#7986cb); }
        .wcu-c4 { background: linear-gradient(160deg,#512da8,#7e57c2,#ba68c8); }
        .wcu-c5 { background: linear-gradient(160deg,#4527a0,#7c4dff,#9c27b0); }

        .wcu-ctext {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px 22px 26px; z-index: 4;
        }
        .wcu-ctitle {
          font-family: 'Clash Display', sans-serif;
          font-size: 21px; font-weight: 700; color: #fff;
          letter-spacing: -.5px; margin-bottom: 8px;
        }
        .wcu-cdesc {
          font-size: 12px; color: rgba(255,255,255,.75);
          line-height: 1.7; font-weight: 300;
        }
      `}</style>
    </section>
  );
}
