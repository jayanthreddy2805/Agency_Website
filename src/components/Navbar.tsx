"use client";
import Link from "next/link";

export default function Navbar() {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center">
      <div className="w-[1200px] flex items-center justify-between px-4">

        {/* Logo */}
        <Link href="/">
          <img
            src="/logon.png"
            alt="APSLOCK"
            style={{
              height: "65px",
              width: "auto",
              borderRadius: "999px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
            }}
          />
        </Link>

        {/* Center Floating Menu */}
        <nav className="hidden md:flex items-center gap-8 bg-white border border-gray-200 rounded-full px-8 py-3 shadow-md">
          <a href="#services" onClick={(e) => handleScroll(e, "services")} className="text-sm font-medium hover:text-gray-500 transition-colors">
            Services
          </a>
          <a href="#portfolio" onClick={(e) => handleScroll(e, "portfolio")} className="text-sm font-medium hover:text-gray-500 transition-colors">
            Our Work
          </a>
          <a href="#faq" onClick={(e) => handleScroll(e, "faq")} className="text-sm font-medium hover:text-gray-500 transition-colors">
            FAQs
          </a>
          <Link href="/contact" className="text-sm font-medium hover:text-gray-500 transition-colors">
            Contact
          </Link>
        </nav>

        {/* CTA Button */}
        <Link href="/contact">
          <button className="bg-black text-white px-6 py-3 rounded-full text-sm shadow-lg hover:scale-105 transition">
            Book a Call →
          </button>
        </Link>

      </div>
    </div>
  );
}