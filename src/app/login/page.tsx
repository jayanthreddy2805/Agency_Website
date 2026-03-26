"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400)); // slight delay for feel

    const user = login(username.trim(), password.trim());
    if (user) {
      router.push("/");
    } else {
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#edf0f8",
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Sora', sans-serif",
        padding: "24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Clash+Display:wght@700&display=swap');

        .login-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(59,130,246,0.2);
          background: #f8faff;
          font-size: 14px;
          font-family: 'Sora', sans-serif;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: #94a3b8; }
        .login-input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          border-radius: 999px;
          border: none;
          background: #0f172a;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34,1.4,0.64,1);
          letter-spacing: 0.5px;
        }
        .login-btn:hover {
          background: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(59,130,246,0.3);
        }
        .login-btn:disabled {
          background: #94a3b8;
          transform: none;
          box-shadow: none;
          cursor: not-allowed;
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 24,
          padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(30,58,138,0.1)",
          border: "1px solid rgba(59,130,246,0.1)",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(15,23,42,0.2)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: -1,
              margin: "0 0 6px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Sign in to access your AEL assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              Username
            </label>
            <input
              className="login-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              className="login-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              className="shake"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "#ef4444",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            className="login-btn"
            type="submit"
            disabled={loading || !username || !password}
            style={{ marginTop: 6 }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#cbd5e1",
            marginTop: 20,
            marginBottom: 0,
          }}
        >
          APSLOCK · AEL Access Portal
        </p>
      </div>
    </main>
  );
}