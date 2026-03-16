"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Share Your Vision",
    description:
      "Tell us about your idea and project goals. We'll help you shape the concept and define the best solution.",
  },
  {
    number: "02",
    title: "Plan & Strategy",
    description:
      "We collaborate with you to define scope, features, and the development roadmap.",
  },
  {
    number: "03",
    title: "Launch & Grow",
    description:
      "Our team builds your product and helps you launch successfully.",
  },
];

export default function HowItWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const card0 = useRef<HTMLDivElement>(null);
  const card1 = useRef<HTMLDivElement>(null);
  const card2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    const cards = [card0.current, card1.current, card2.current];

    if (!wrapper || !container || cards.some((c) => !c)) return;

    const gap = 24;
    const containerWidth = container.offsetWidth;
    const cardWidth = (containerWidth - 2 * gap) / 3;
    const oneSlot = cardWidth + gap;

    // All cards start hidden off to the right
    gsap.set(cards[0], { x: oneSlot * 2, opacity: 0 });
    gsap.set(cards[1], { x: oneSlot * 2, opacity: 0 });
    gsap.set(cards[2], { x: oneSlot * 2, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    // Each card gets equal share of scroll
    // Duration 1 = one third of scroll
    // Card 1: scroll 0%–33%
    tl.to(cards[0], {
      x: 0,
      opacity: 1,
      ease: "power2.out",
      duration: 1,
    }, 0);

    // Card 2: scroll 33%–66%
    tl.to(cards[1], {
      x: 0,
      opacity: 1,
      ease: "power2.out",
      duration: 1,
    }, 1);

    // Card 3: scroll 66%–100%
    tl.to(cards[2], {
      x: 0,
      opacity: 1,
      ease: "power2.out",
      duration: 1,
    }, 2);

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const cardData = [
    { ref: card0, step: steps[0] },
    { ref: card1, step: steps[1] },
    { ref: card2, step: steps[2] },
  ];

  return (
    <div
      ref={wrapperRef}
      style={{ height: "300vh" }}
      className="dashed-grid"
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
        className="dashed-grid"
      >
        {/* Heading */}
        <div className="absolute top-10 left-0 w-full flex flex-col items-center z-10 pointer-events-none">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: "#2563EB" }}
          >
            Our Process
          </p>
          <h2 className="text-4xl font-bold" style={{ color: "#0F172A" }}>
            How It Works
          </h2>
        </div>

        {/* Cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={containerRef}
            className="grid grid-cols-3 gap-6 w-full max-w-6xl px-8"
          >
            {cardData.map(({ ref, step }) => (
              <div
                key={step.number}
                ref={ref}
                className="relative rounded-3xl p-8 flex flex-col justify-between"
                style={{
                  height: "360px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 8px 48px rgba(30,58,138,0.10)",
                  willChange: "transform, opacity",
                }}
              >
                {/* Watermark */}
                <span
                  className="absolute -right-1 -bottom-3 font-black leading-none select-none pointer-events-none"
                  style={{
                    fontSize: "clamp(5rem, 8vw, 8rem)",
                    color: "rgba(37,99,235,0.05)",
                  }}
                >
                  {step.number}
                </span>

                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                    style={{ background: "#EFF6FF", color: "#2563EB" }}
                  >
                    Step {step.number}
                  </div>
                  <span
                    className="text-5xl font-black leading-none"
                    style={{ color: "#DBEAFE" }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: "#0F172A" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#64748B" }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Bottom Line */}
                <div
                  className="h-[2px] w-full rounded-full"
                  style={{
                    background: "linear-gradient(to right, #2563EB, #93C5FD)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
