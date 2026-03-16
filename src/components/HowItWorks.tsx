"use client";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    tag: "Step 01",
    title: "Share Your Vision",
    desc: "Tell us everything — your idea, goals, audience and the core problem. Like an engineer reading a blueprint, we study every detail before touching a single tool.",
    bullets: ["Discovery call to understand your goals", "Define your audience and core problem", "Map out constraints and opportunities"],
  },
  {
    tag: "Step 02",
    title: "Plan & Strategy",
    desc: "We take every part of your project and snap it into place — scope, features, tech stack and timelines. Like a lock assembling piece by piece, every component clicks into its exact position.",
    bullets: ["Full scope, features and architecture plan", "Tech stack selection and design direction", "Sprint timeline and milestone roadmap"],
  },
  {
    tag: "Step 03",
    title: "Build, Launch & Grow",
    desc: "Full power engaged. Every circuit alive, every wire glowing. We launch fast, scale smart and stay locked in as your product grows. This is APSLOCK — secured and operational.",
    bullets: ["Daily updates and live project board", "Rigorous QA and performance testing", "Launch, scale and post-delivery support"],
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const T = useRef(0);
  const lastT = useRef(0);
  const stepN = useRef(0);
  const asmProgress = useRef(0);
  const asmStart = useRef<number | null>(null);
  const sonarRings = useRef<{r:number,a:number}[]>([]);
  const sonarLast = useRef(0);
  const pulseTs = useRef<number[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      let best = 0;
      let bestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - vh / 2);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      if (best !== stepN.current) {
        stepN.current = best;
        setActiveStep(best);
        if (best === 1) { asmProgress.current = 0; asmStart.current = null; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = 220, H = 300;
    const CX = 110, BY = 122, BX = 52, BW = 116, BH = 130, BR = 16;

    const lerp = (a:number,b:number,t:number) => a+(b-a)*t;
    const easeOut = (t:number) => 1-Math.pow(1-t,3);
    const easeOutBack = (t:number) => { const c=2.70158; return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2); };
    const clamp = (v:number,a:number,b:number) => Math.max(a,Math.min(b,v));

    const traceCount = 8;
    pulseTs.current = Array.from({length: traceCount*3}, (_,i) => -(i*0.11) % 1);

    function drawBlueprint(t:number) {
      ctx.clearRect(0,0,W,H);

      const sy = ((t*0.18)%1)*H;
      const sg = ctx.createLinearGradient(0,sy-20,0,sy+20);
      sg.addColorStop(0,"rgba(59,130,246,0)");
      sg.addColorStop(0.5,"rgba(59,130,246,0.05)");
      sg.addColorStop(1,"rgba(59,130,246,0)");
      ctx.fillStyle=sg; ctx.fillRect(0,sy-20,W,40);

      ctx.setLineDash([4,3]);
      ctx.strokeStyle="rgba(59,130,246,0.28)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(72,BY+4); ctx.lineTo(72,72); ctx.arc(CX,72,38,Math.PI,0,false); ctx.lineTo(148,BY+4); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.stroke();
      ctx.setLineDash([]);

      ctx.save(); ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.clip();
      ctx.strokeStyle="rgba(59,130,246,0.06)"; ctx.lineWidth=0.5;
      for(let x=BX;x<BX+BW;x+=14){ctx.beginPath();ctx.moveTo(x,BY);ctx.lineTo(x,BY+BH);ctx.stroke();}
      for(let y=BY;y<BY+BH;y+=14){ctx.beginPath();ctx.moveTo(BX,y);ctx.lineTo(BX+BW,y);ctx.stroke();}
      ctx.restore();

      const bob = (n:number) => Math.sin(t*1.1+n*0.9)*2;

      ctx.save(); ctx.translate(0,bob(0));
      ctx.strokeStyle="rgba(99,162,255,0.4)"; ctx.lineWidth=10; ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(72,BY+4);ctx.lineTo(72,72);ctx.arc(CX,72,38,Math.PI,0,false);ctx.lineTo(148,BY+4);ctx.stroke();
      ctx.restore();

      ctx.save(); ctx.translate(0,bob(1));
      ctx.fillStyle="rgba(59,130,246,0.05)";
      ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.fill();
      ctx.restore();

      ctx.save(); ctx.translate(0,bob(2));
      [76,91,106,121,136].forEach((x,i)=>{
        ctx.fillStyle=`rgba(${i%2?'6,182,212':'99,130,246'},0.55)`;
        ctx.beginPath(); ctx.roundRect(x-5,128,10,16,[3,3,5,5]); ctx.fill();
        ctx.strokeStyle="rgba(99,162,255,0.2)"; ctx.lineWidth=0.8;
        for(let s=0;s<10;s+=2.5){ctx.beginPath();ctx.moveTo(x-4,115+s);ctx.lineTo(x+4,116.5+s);ctx.stroke();}
      });
      ctx.restore();

      ctx.save(); ctx.translate(0,bob(3));
      ctx.fillStyle="rgba(20,83,45,0.3)"; ctx.strokeStyle="rgba(34,197,94,0.3)"; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.roundRect(68,207,84,24,4); ctx.fill(); ctx.stroke();
      [[80,219],[100,219],[120,219],[140,219]].forEach(([x,y],i)=>{
        ctx.fillStyle=i%2?"rgba(6,182,212,0.6)":"rgba(251,191,36,0.6)";
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();

      ctx.save(); ctx.translate(0,bob(4));
      ctx.fillStyle="rgba(59,130,246,0.1)"; ctx.strokeStyle="rgba(99,162,255,0.5)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(CX,175,14,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="rgba(99,162,255,0.4)"; ctx.beginPath(); ctx.arc(CX,172,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="rgba(59,130,246,0.5)"; ctx.beginPath(); ctx.roundRect(CX-3,178,6,10,[0,0,3,3]); ctx.fill();
      ctx.restore();

      const lblData:[string,number,boolean][] = [["SHACKLE",78,false],["BODY",BY+BH/2,false],["PIN CHAMBER",140,true],["PCB",215,true],["KEYHOLE",175,false]];
      lblData.forEach(([name,y,right],i)=>{
        const b=bob(i);
        ctx.strokeStyle="rgba(59,130,246,0.18)"; ctx.lineWidth=0.7; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(right?BX+BW-2:BX+2,y+b); ctx.lineTo(right?BX+BW+5:BX-5,y+b); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle="rgba(59,130,246,0.5)"; ctx.font="500 6px monospace";
        ctx.textAlign=right?"left":"right";
        ctx.fillText(name,right?BX+BW+8:BX-8,y+b+2);
      });

      const ch=Math.sin(t*2)*0.3+0.4;
      ctx.strokeStyle=`rgba(59,130,246,${ch})`; ctx.lineWidth=0.7; ctx.textAlign="left";
      [[CX-18,175,CX-8,175],[CX+8,175,CX+18,175],[CX,162,CX,170],[CX,180,CX,188]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      ctx.fillStyle="rgba(59,130,246,0.25)"; ctx.font="500 6px monospace";
      ctx.fillText("REV 2.0",6,H-6); ctx.textAlign="right"; ctx.fillText("APSLOCK™",W-6,H-6); ctx.textAlign="left";
    }

    const pieces = [
      {id:"shackle",sx:CX,sy:-30,fx:CX,fy:0,d:0.00},
      {id:"body",sx:CX,sy:H+30,fx:CX,fy:0,d:0.08},
      {id:"pin0",sx:0,sy:130,fx:76,fy:138,d:0.18},
      {id:"pin1",sx:W,sy:130,fx:91,fy:138,d:0.23},
      {id:"pin2",sx:CX,sy:H+20,fx:106,fy:138,d:0.27},
      {id:"pin3",sx:0,sy:160,fx:121,fy:138,d:0.31},
      {id:"pin4",sx:W,sy:160,fx:136,fy:138,d:0.35},
      {id:"pcb",sx:CX,sy:H+30,fx:CX,fy:0,d:0.42},
      {id:"keyhole",sx:W,sy:10,fx:CX,fy:175,d:0.52},
    ];

    function drawAssembly(prog:number, t:number) {
      ctx.clearRect(0,0,W,H);
      const ba=clamp(prog*3,0,0.3);

      ctx.fillStyle=`rgba(8,12,24,${ba})`;
      ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.fill();
      ctx.strokeStyle=`rgba(59,130,246,${ba*0.6})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.stroke();
      ctx.strokeStyle=`rgba(59,130,246,${ba*0.3})`; ctx.lineWidth=14; ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(72,BY+4);ctx.lineTo(72,72);ctx.arc(CX,72,38,Math.PI,0,false);ctx.lineTo(148,BY+4);ctx.stroke();

      if(prog>0.05&&prog<0.9){
        for(let a=0;a<8;a++){
          const ang=(a/8)*Math.PI*2+t*0.4;
          const d=30+prog*15;
          ctx.strokeStyle=`rgba(59,130,246,${(1-prog)*0.08})`; ctx.lineWidth=0.6; ctx.setLineDash([2,4]);
          ctx.beginPath();ctx.moveTo(CX,BY+BH/2);ctx.lineTo(CX+Math.cos(ang)*d,BY+BH/2+Math.sin(ang)*d);ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      pieces.forEach(pc=>{
        const cp=clamp((prog-pc.d)/(0.95-pc.d),0,1);
        const ep=easeOutBack(cp);
        const colors=["#3b82f6","#06b6d4","#818cf8","#22d3ee","#3b82f6"];

        if(pc.id==="shackle"){
          ctx.save(); ctx.translate(0,lerp(pc.sy,0,easeOut(cp)));
          ctx.strokeStyle="#2d3f55"; ctx.lineWidth=14; ctx.lineCap="round";
          ctx.shadowColor=`rgba(99,130,246,${ep*0.4})`; ctx.shadowBlur=ep*10;
          ctx.beginPath();ctx.moveTo(72,BY+4);ctx.lineTo(72,72);ctx.arc(CX,72,38,Math.PI,0,false);ctx.lineTo(148,BY+4);ctx.stroke();
          ctx.shadowBlur=0;
          ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=5;
          ctx.beginPath();ctx.moveTo(76,BY+4);ctx.lineTo(76,74);ctx.arc(CX,74,34,Math.PI,0,false);ctx.lineTo(144,BY+4);ctx.stroke();
          ctx.restore();
        } else if(pc.id==="body"){
          ctx.save(); ctx.translate(0,lerp(pc.sy,0,easeOut(cp))); ctx.globalAlpha=ep;
          const g=ctx.createLinearGradient(BX,BY,BX+BW,BY+BH);
          g.addColorStop(0,"#0d1520"); g.addColorStop(1,"#060c18");
          ctx.fillStyle=g; ctx.shadowColor="rgba(0,0,0,0.4)"; ctx.shadowBlur=14;
          ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.fill(); ctx.shadowBlur=0;
          ctx.strokeStyle="rgba(59,130,246,0.2)"; ctx.lineWidth=1;
          ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.stroke();
          ctx.restore();
        } else if(pc.id.startsWith("pin")){
          const n=parseInt(pc.id[3]);
          const cx2=lerp(pc.sx,pc.fx,ep), cy2=lerp(pc.sy,pc.fy,ep);
          ctx.fillStyle=colors[n]; ctx.shadowColor=colors[n]; ctx.shadowBlur=ep*8;
          ctx.beginPath(); ctx.roundRect(cx2-5,cy2-14,10,28,[3,3,5,5]); ctx.fill();
          ctx.shadowBlur=0;
          ctx.fillStyle="rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.roundRect(cx2-3,cy2-12,4,8,2); ctx.fill();
        } else if(pc.id==="pcb"){
          ctx.save(); ctx.translate(0,lerp(pc.sy,0,easeOut(cp))); ctx.globalAlpha=ep;
          ctx.fillStyle="rgba(15,40,20,0.6)"; ctx.beginPath(); ctx.roundRect(68,207,84,24,4); ctx.fill();
          ctx.strokeStyle="rgba(34,197,94,0.4)"; ctx.lineWidth=0.8; ctx.beginPath(); ctx.roundRect(68,207,84,24,4); ctx.stroke();
          [[80,219,"#f59e0b"],[100,219,"#3b82f6"],[120,219,"#22c55e"],[140,219,"#ef4444"]].forEach(([x,y,c])=>{
            ctx.fillStyle=c as string; ctx.beginPath(); ctx.arc(x as number,y as number,3,0,Math.PI*2); ctx.fill();
          });
          ctx.restore();
        } else if(pc.id==="keyhole"){
          const kx=lerp(pc.sx,CX,ep), ky=lerp(pc.sy,175,ep);
          ctx.fillStyle="#04080f"; ctx.beginPath(); ctx.arc(kx,ky,14,0,Math.PI*2); ctx.fill();
          ctx.strokeStyle=`rgba(59,130,246,${ep})`; ctx.lineWidth=1.5;
          ctx.shadowColor="#3b82f6"; ctx.shadowBlur=ep*10;
          ctx.beginPath(); ctx.arc(kx,ky,14,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0;
          ctx.fillStyle=`rgba(59,130,246,${ep})`;
          ctx.beginPath(); ctx.arc(kx,ky-2,8,0,Math.PI*2); ctx.fill();
          ctx.fillStyle="#04080f"; ctx.beginPath(); ctx.arc(kx,ky-2,4.5,0,Math.PI*2); ctx.fill();
          ctx.fillStyle=`rgba(59,130,246,${ep})`;
          ctx.beginPath(); ctx.roundRect(kx-3,ky+5,6,10,[0,0,3,3]); ctx.fill();
        }

        if(ep>0.93&&ep<0.99){
          const sp=(ep-0.93)/0.06;
          const lx=pc.id==="shackle"?CX:pc.id==="body"?CX:pc.fx;
          const ly=pc.id==="shackle"?BY:pc.id==="body"?BY+BH/2:pc.fy;
          for(let s=0;s<6;s++){
            const ang=(s/6)*Math.PI*2;
            const r=sp*12;
            ctx.strokeStyle=`rgba(99,162,255,${(1-sp)*0.65})`; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+Math.cos(ang)*r,ly+Math.sin(ang)*r); ctx.stroke();
          }
        }
      });

      ctx.fillStyle="rgba(59,130,246,0.3)"; ctx.font="700 7px monospace"; ctx.textAlign="center";
      ctx.fillText(`ASSEMBLY ${Math.round(prog*100)}%`,CX,13);
      ctx.textAlign="left";
    }

    const traces = [
      {pts:[[CX,162],[CX,145]],c:"#3b82f6"},
      {pts:[[CX,162],[86,162],[86,195]],c:"#06b6d4"},
      {pts:[[CX,162],[134,162],[134,195]],c:"#06b6d4"},
      {pts:[[86,195],[86,220],[134,220],[134,195]],c:"#818cf8"},
      {pts:[[CX,220],[CX,235]],c:"#3b82f6"},
      {pts:[[74,162],[74,195],[86,195]],c:"#22d3ee"},
      {pts:[[146,162],[146,195],[134,195]],c:"#22d3ee"},
      {pts:[[86,145],[86,132],[CX,132],[134,132],[134,145]],c:"#818cf8"},
    ];

    function getPulsePos(tr:typeof traces[0], t:number) {
      const pts=tr.pts;
      let segs:any[]=[],total=0;
      for(let i=0;i<pts.length-1;i++){
        const dx=pts[i+1][0]-pts[i][0],dy=pts[i+1][1]-pts[i][1],len=Math.sqrt(dx*dx+dy*dy);
        segs.push([dx,dy,len,pts[i][0],pts[i][1]]); total+=len;
      }
      const tmod=((t%1)+1)%1;
      let rem=tmod*total,px=pts[0][0],py=pts[0][1];
      for(const [dx,dy,len,x0,y0] of segs){
        if(rem<=len){px=x0+dx*(rem/len);py=y0+dy*(rem/len);break;}
        rem-=len;px=x0+dx;py=y0+dy;
      }
      return [px,py];
    }

    function drawGlowing(t:number,dt:number) {
      ctx.clearRect(0,0,W,H);
      const pulse=Math.sin(t*2.5)*0.5+0.5;
      const CY2=BY+BH/2;

      const ag=ctx.createRadialGradient(CX,CY2,0,CX,CY2,110);
      ag.addColorStop(0,`rgba(59,130,246,${0.06+pulse*0.05})`);
      ag.addColorStop(1,"transparent");
      ctx.fillStyle=ag; ctx.fillRect(0,0,W,H);

      ctx.strokeStyle="#1a2535"; ctx.lineWidth=14; ctx.lineCap="round";
      ctx.shadowColor=`rgba(59,130,246,${0.4+pulse*0.3})`; ctx.shadowBlur=12+pulse*8;
      ctx.beginPath();ctx.moveTo(72,BY+4);ctx.lineTo(72,72);ctx.arc(CX,72,38,Math.PI,0,false);ctx.lineTo(148,BY+4);ctx.stroke();
      ctx.shadowBlur=0;
      ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(76,BY+4);ctx.lineTo(76,74);ctx.arc(CX,74,34,Math.PI,0,false);ctx.lineTo(144,BY+4);ctx.stroke();

      const bg=ctx.createLinearGradient(BX,BY,BX+BW,BY+BH);
      bg.addColorStop(0,"#0d1520"); bg.addColorStop(1,"#060c18");
      ctx.fillStyle=bg; ctx.shadowColor=`rgba(59,130,246,${0.28+pulse*0.18})`; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle=`rgba(59,130,246,${0.2+pulse*0.35})`; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.roundRect(BX,BY,BW,BH,BR); ctx.stroke();

      ctx.save();
      ctx.beginPath(); ctx.roundRect(BX+2,BY+2,BW-4,BH-4,BR); ctx.clip();

      const ig=ctx.createRadialGradient(CX,175,0,CX,175,58);
      ig.addColorStop(0,`rgba(59,130,246,${0.07+pulse*0.06})`);
      ig.addColorStop(1,"transparent");
      ctx.fillStyle=ig; ctx.fillRect(BX,BY,BW,BH);

      traces.forEach(tr=>{
        const pts=tr.pts;
        ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
        for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
        ctx.strokeStyle=tr.c; ctx.globalAlpha=0.25+pulse*0.08; ctx.lineWidth=2;
        ctx.shadowColor=tr.c; ctx.shadowBlur=5; ctx.stroke(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      });

      [[CX,162],[86,162],[134,162],[86,195],[134,195],[CX,220],[74,162],[146,162],[CX,132]].forEach(([x,y],i)=>{
        const b=Math.sin(t*2.8+i*0.9)*0.35+0.65;
        ctx.beginPath(); ctx.arc(x,y,2.8,0,Math.PI*2);
        ctx.fillStyle=`rgba(59,130,246,${b})`; ctx.shadowColor="#3b82f6"; ctx.shadowBlur=7*b;
        ctx.fill(); ctx.shadowBlur=0;
      });

      traces.forEach((tr,ti)=>{
        for(let j=0;j<3;j++){
          const idx=ti*3+j;
          pulseTs.current[idx]=(pulseTs.current[idx]+dt*0.48+1)%1;
          const [px,py]=getPulsePos(tr,pulseTs.current[idx]);
          ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
          ctx.fillStyle=tr.c; ctx.shadowColor=tr.c; ctx.shadowBlur=20;
          ctx.fill(); ctx.shadowBlur=0;
          ctx.beginPath(); ctx.arc(px,py,1.8,0,Math.PI*2);
          ctx.fillStyle="#fff"; ctx.fill();
        }
      });

      ctx.fillStyle="rgba(15,40,20,0.7)"; ctx.beginPath(); ctx.roundRect(68,207,84,22,4); ctx.fill();
      ctx.strokeStyle=`rgba(34,197,94,${0.5+pulse*0.3})`; ctx.lineWidth=0.8; ctx.beginPath(); ctx.roundRect(68,207,84,22,4); ctx.stroke();
      [[80,218,"#f59e0b"],[100,218,"#3b82f6"],[120,218,"#22c55e"],[140,218,"#ef4444"]].forEach(([x,y,c])=>{
        ctx.fillStyle=c as string; ctx.shadowColor=c as string; ctx.shadowBlur=6+pulse*6;
        ctx.beginPath(); ctx.arc(x as number,y as number,3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      });

      ctx.restore();

      if(t-sonarLast.current>0.85){ sonarLast.current=t; sonarRings.current.push({r:0,a:0.7}); }
      sonarRings.current=sonarRings.current.filter(s=>s.a>0);
      sonarRings.current.forEach(s=>{
        s.r+=1.4; s.a-=0.018;
        ctx.beginPath(); ctx.arc(CX,175,s.r,0,Math.PI*2);
        ctx.strokeStyle=`rgba(59,130,246,${s.a})`; ctx.lineWidth=1.2;
        ctx.shadowColor="#3b82f6"; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;
      });

      ctx.fillStyle="#030810"; ctx.beginPath(); ctx.arc(CX,175,15,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=`rgba(59,130,246,${0.8+pulse*0.2})`; ctx.lineWidth=1.5;
      ctx.shadowColor="#3b82f6"; ctx.shadowBlur=16+pulse*12;
      ctx.beginPath(); ctx.arc(CX,175,15,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0;
      ctx.fillStyle=`rgba(59,130,246,${0.85+pulse*0.15})`; ctx.shadowColor="#3b82f6"; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(CX,173,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#030810"; ctx.shadowBlur=0; ctx.beginPath(); ctx.arc(CX,173,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(59,130,246,${0.85+pulse*0.15})`;
      ctx.beginPath(); ctx.roundRect(CX-3,181,6,10,[0,0,3,3]); ctx.fill();

      [[BX+10,BY+10,"#22c55e"],[BX+BW-10,BY+10,"#22c55e"]].forEach(([x,y,c])=>{
        ctx.fillStyle=c as string; ctx.shadowColor=c as string; ctx.shadowBlur=6+pulse*6;
        ctx.beginPath(); ctx.arc(x as number,y as number,3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      });

      ctx.fillStyle=`rgba(6,182,212,${0.65+pulse*0.35})`;
      ctx.font="700 7.5px monospace"; ctx.textAlign="center";
      ctx.shadowColor="#06b6d4"; ctx.shadowBlur=8+pulse*8;
      ctx.fillText("● APSLOCK SECURED ●",CX,H-6);
      ctx.shadowBlur=0; ctx.textAlign="left";
    }

    function loop(ts:number) {
      const dt=(ts-lastT.current)*0.001; lastT.current=ts; T.current=ts*0.001;
      const s=stepN.current;
      if(s===0) drawBlueprint(T.current);
      else if(s===1){
        if(asmStart.current===null) asmStart.current=T.current;
        asmProgress.current=Math.min(1,(T.current-asmStart.current)/2.5);
        drawAssembly(asmProgress.current,T.current);
      }
      else drawGlowing(T.current,dt);
      rafRef.current=requestAnimationFrame(loop);
    }
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[]);

  return (
    <section style={{
      background:"#edf0f8",
      backgroundImage:"radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
      backgroundSize:"28px 28px",
    }}>
      <div style={{textAlign:"center",paddingTop:72,paddingBottom:44,fontFamily:"'Sora',sans-serif"}}>
        <span style={{
          display:"inline-block",fontSize:9,fontWeight:700,letterSpacing:3,
          textTransform:"uppercase" as const,color:"#3b82f6",
          background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",
          padding:"4px 14px",borderRadius:999,marginBottom:12,
        }}>Our Process</span>
        <h2 style={{
          fontFamily:"'Clash Display',sans-serif",fontSize:40,fontWeight:700,
          color:"#0f172a",letterSpacing:-2,lineHeight:1,margin:0,
        }}>How It Works</h2>
      </div>

      <div style={{
        display:"grid",gridTemplateColumns:"240px 1fr",gap:72,
        maxWidth:860,margin:"0 auto",padding:"0 32px 80px",alignItems:"start",
      }}>
        <div style={{position:"sticky",top:100}}>
          <canvas ref={canvasRef} width={220} height={300}
            style={{width:220,height:300,display:"block",margin:"0 auto"}}/>
          <div style={{display:"flex",justifyContent:"center",gap:7,marginTop:16}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{
                height:4,borderRadius:999,
                width:activeStep===i?26:7,
                background:activeStep===i?"#3b82f6":"rgba(59,130,246,0.2)",
                transition:"all 0.5s cubic-bezier(0.34,1.4,0.64,1)",
              }}/>
            ))}
          </div>
          <div style={{
            textAlign:"center",marginTop:9,fontSize:8,fontWeight:700,
            letterSpacing:3,textTransform:"uppercase" as const,
            color:"#3b82f6",opacity:0.55,fontFamily:"'Sora',sans-serif",
          }}>
            {["Blueprint","Assembling...","⚡ Secured"][activeStep]}
          </div>
        </div>

        <div>
          {steps.map((step,i)=>(
            <div
              key={i}
              ref={el=>{stepRefs.current[i]=el;}}
              style={{
                padding:"36px 0",
                borderBottom:i<2?"1px solid rgba(59,130,246,0.1)":"none",
                opacity:activeStep===i?1:0.38,
                transition:"opacity 0.5s ease",
              }}
            >
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <span style={{
                  fontSize:8,fontWeight:700,letterSpacing:3,textTransform:"uppercase" as const,
                  color:"#3b82f6",background:"rgba(59,130,246,0.08)",
                  border:"1px solid rgba(59,130,246,0.18)",padding:"3px 10px",borderRadius:999,
                  fontFamily:"'Sora',sans-serif",
                }}>{step.tag}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#cbd5e1",marginLeft:"auto",fontFamily:"'Sora',sans-serif"}}>
                  {String(i+1).padStart(2,"0")} / 03
                </span>
              </div>

              <h3 style={{
                fontFamily:"'Clash Display',sans-serif",fontSize:28,fontWeight:700,
                color:"#0f172a",letterSpacing:-1.2,lineHeight:1.1,marginBottom:12,
              }}>{step.title}</h3>

              <p style={{
                fontSize:13,color:"#64748b",lineHeight:1.8,fontWeight:300,
                fontFamily:"'Sora',sans-serif",maxWidth:440,marginBottom:16,
              }}>{step.desc}</p>

              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {step.bullets.map((b,j)=>(
                  <div key={j} style={{
                    display:"flex",alignItems:"center",gap:9,
                    fontSize:12,color:"#475569",fontFamily:"'Sora',sans-serif",
                  }}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:"#3b82f6",flexShrink:0}}/>
                    {b}
                  </div>
                ))}
              </div>

              <div style={{
                height:2,borderRadius:999,marginTop:22,
                width:activeStep===i?"100%":0,
                background:"linear-gradient(90deg,#3b82f6,#06b6d4)",
                transition:"width 0.7s cubic-bezier(0.34,1.2,0.64,1)",
              }}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}