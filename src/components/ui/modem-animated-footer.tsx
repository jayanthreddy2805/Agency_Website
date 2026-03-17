"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <section className="relative w-full mt-0 overflow-hidden" style={{ background: "#edf0f8" }}>
      <footer className="border-t relative" style={{ background: "#edf0f8" }}>

        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 p-6 py-16" style={{ position: "relative", zIndex: 1 }}>

          {/* Brand */}
          <div>
            <h2 className="text-xl font-semibold mb-4">APSLOCK</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Strategic web design, and campaigns tailored to drive result
              and conversions.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/#services">Services</Link></li>
              <li><Link href="/#portfolio">Our Work</Link></li>
              <li><Link href="/#achievements">Achievements</Link></li>
              <li><Link href="/#faq">FAQs</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="font-semibold mb-4">Socials</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#">Email ↗</Link></li>
              <li><Link href="#">Instagram ↗</Link></li>
              <li><Link href="#">LinkedIn ↗</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Stay ahead with design & marketing tips and strategies
              that drive results.
            </p>
            <div className="flex items-center border rounded-full px-4 py-2 bg-muted">
              <input
                type="email"
                placeholder="Enter your email..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button className="ml-3 px-4 py-2 rounded-full bg-foreground text-background text-sm">
                →
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 py-6 text-sm text-muted-foreground border-t" style={{ position: "relative", zIndex: 1 }}>
          <p>© {new Date().getFullYear()} APSLOCK All rights reserved</p>
          <div className="flex gap-6 mt-3 md:mt-0">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>

        {/* Big faded brand */}
        <div
          className="bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-40 md:bottom-32 font-extrabold tracking-tighter pointer-events-none select-none text-center px-4"
          style={{ fontSize: "clamp(5rem, 15vw, 15rem)", maxWidth: "95vw" }}
        >
          APSLOCK
        </div>

      </footer>
    </section>
  );
}