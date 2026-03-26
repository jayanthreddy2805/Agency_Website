"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, logout, type AELUser } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AELUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getCurrentUser());
  }, [pathname]); // re-check on route change

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/");
  };

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
    <>
      <style>{`
        @keyframes nav-fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15,23,42,0.92);
          border: 1.5px solid rgba(59,130,246,0.35);
          border-radius: 999px;
          padding: 7px 14px 7px 10px;
          animation: nav-fade-in 0.3s ease both;
          backdrop-filter: blur(8px);
        }
        .nav-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }
        .nav-username {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          font-family: 'Sora', sans-serif;
          letter-spacing: 0.3px;
        }
        .nav-logout-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 999px;
          transition: all 0.2s;
          margin-left: 2px;
          border-left: 1px solid rgba(255,255,255,0.1);
        }
        .nav-logout-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
        }
        .nav-login-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.9);
          border: 1.5px solid rgba(15,23,42,0.12);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34,1.4,0.64,1);
          text-decoration: none;
        }
        .nav-login-btn:hover {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15,23,42,0.15);
        }
      `}</style>

      <div className="fixed top-6 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6">

          {/* Logo — far left */}
          <Link href="/">
            <img
              src="/logon.png"
              alt="APSLOCK"
              style={{
                height: "52px",
                width: "auto",
                borderRadius: "999px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
              }}
            />
          </Link>

          {/* Center Nav Pill — absolutely centered */}
          <nav
            className="hidden md:flex items-center gap-8 bg-white border border-gray-200 rounded-full px-8 py-3 shadow-md"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <a
              href="#services"
              onClick={(e) => handleScroll(e, "services")}
              className="text-sm font-medium hover:text-gray-500 transition-colors"
            >
              Services
            </a>
            <a
              href="#portfolio"
              onClick={(e) => handleScroll(e, "portfolio")}
              className="text-sm font-medium hover:text-gray-500 transition-colors"
            >
              Our Work
            </a>
            <a
              href="#faq"
              onClick={(e) => handleScroll(e, "faq")}
              className="text-sm font-medium hover:text-gray-500 transition-colors"
            >
              FAQs
            </a>
            <Link
              href="/contact"
              className="text-sm font-medium hover:text-gray-500 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right side — Login or User + Book a Call */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mounted && (
              user ? (
                // Logged in — show user pill
                <div className="nav-user-pill">
                  <div className="nav-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="nav-username">{user.username}</span>
                  <button className="nav-logout-btn" onClick={handleLogout}>
                    logout
                  </button>
                </div>
              ) : (
                // Not logged in — show login button
                <Link href="/login" className="nav-login-btn">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </Link>
              )
            )}

            <Link href="/contact">
              <button className="bg-black text-white px-6 py-3 rounded-full text-sm shadow-lg hover:scale-105 transition">
                Book a Call →
              </button>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}