"use client";

import { motion } from "framer-motion";
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

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-28">
      <div className="max-w-4xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4">Our Work</h2>
          <p className="text-gray-500">
            A selection of projects we've built for startups and businesses.
          </p>
        </div>

        {/* Stacked Cards */}
        <div className="space-y-24">

          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="sticky top-32"
            >
              <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">

                {/* Image */}
                <div className="h-56 overflow-hidden">
                  <div className="w-full h-full bg-gray-200 hover:scale-105 transition duration-500"></div>
                </div>

                {/* Content */}
                <div className="p-6">

                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {project.title}
                  </h3>

                  <p className="text-gray-600 mb-4 text-sm">
                    {project.description}
                  </p>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Case study */}
                  <Link
                    href="#"
                    className="inline-flex items-center gap-1 text-sm font-medium text-black hover:gap-2 transition-all"
                  >
                    View Case Study →
                  </Link>

                </div>
              </div>
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}