"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

const projects = [
  {
    title: "Startup Website",
    description: "Modern marketing website built with Next.js.",
    tech: ["Next.js", "Tailwind", "Vercel"],
  },
  {
    title: "AI SaaS Platform",
    description: "AI powered SaaS dashboard and application.",
    tech: ["Next.js", "AI", "Stripe"],
  },
  {
    title: "E-commerce Store",
    description: "High conversion online store with optimized checkout.",
    tech: ["Shopify", "React", "Node"],
  },
  {
    title: "Brand Identity",
    description: "Complete branding system and visual identity.",
    tech: ["Branding", "Design", "Strategy"],
  },
];

function ProjectCard({ project, index, total }: { project: typeof projects[0]; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.6]);
  const y = useTransform(scrollYProgress, [0, 0.15], [60, 0]);

  return (
    <div ref={ref} style={{ position: "sticky", top: `${80 + index * 20}px` }}>
      <motion.div
        style={{ scale, opacity, y }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      >
        <div
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          style={{
            boxShadow: `0 ${8 + index * 4}px ${24 + index * 8}px rgba(0,0,0,${0.06 + index * 0.02})`,
            transition: "box-shadow 0.4s ease",
          }}
        >
          <div className="h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
            <motion.div
              className="w-full h-full"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ background: `linear-gradient(135deg, #e8edf8, #d4dff2)` }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                color: "rgba(59,130,246,0.4)",
              }}
            >
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">{project.title}</h3>
            <p className="text-gray-500 mb-4 text-sm leading-relaxed">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {project.tech.map((tech, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: "#edf0f8", color: "#3b82f6", fontWeight: 600 }}
                >
                  {tech}
                </span>
              ))}
            </div>
            <Link
              href="#"
              className="inline-flex items-center gap-1 text-sm font-semibold text-black hover:gap-3 transition-all duration-300"
            >
              View Case Study →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Portfolio() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="portfolio"
      style={{
        background: "#edf0f8",
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        position: "relative",
        paddingBottom: "2rem",
      }}
    >
      <div className="text-center pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-4xl font-bold mb-4">Our Work</h2>
          <p className="text-gray-500">
            A selection of projects we've built for startups and businesses.
          </p>
        </motion.div>
      </div>

      <div ref={containerRef} className="max-w-3xl mx-auto px-6" style={{ paddingBottom: "1rem", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {projects.map((project, index) => (
            <ProjectCard
              key={index}
              project={project}
              index={index}
              total={projects.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}