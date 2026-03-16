"use client";
import { useState, useRef, useCallback } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX_MB = 50;

  const handleFile = (f: File) => {
    setFileError("");
    if (f.size > MAX_MB * 1024 * 1024) {
      setFileError(`File too large. Max size is ${MAX_MB}MB.`);
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("word") || type.includes("document")) return "📝";
    return "📎";
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#edf0f8",
      backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "120px 24px 80px",
      fontFamily: "'Sora', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=Clash+Display:wght@700&display=swap');

        .cf-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          font-family: 'Sora', sans-serif;
        }
        .cf-star { color: #ef4444; margin-left: 3px; }

        .cf-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 12px;
          border: 1px solid rgba(59,130,246,0.2);
          background: #f8faff;
          font-size: 14px;
          font-family: 'Sora', sans-serif;
          color: #0f172a;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .cf-input::placeholder { color: #94a3b8; }
        .cf-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        .service-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .service-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(59,130,246,0.18);
          background: #f8faff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          font-family: 'Sora', sans-serif;
        }
        .service-option:hover {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.04);
          color: #0f172a;
        }
        .service-option.selected {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.08);
          color: #1e40af;
        }
        .service-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .drop-zone {
          width: 100%;
          border: 1.5px dashed rgba(59,130,246,0.35);
          border-radius: 14px;
          background: #f8faff;
          padding: 24px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.04);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .cf-btn {
          width: 100%;
          padding: 15px;
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
        .cf-btn:hover { background: #3b82f6; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59,130,246,0.3); }
        .cf-btn:disabled { background: #94a3b8; transform: none; box-shadow: none; cursor: not-allowed; }

        .file-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(59,130,246,0.06);
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          margin-top: 10px;
        }
        .remove-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 16px;
          padding: 2px 6px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .remove-btn:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
      `}</style>

      <div style={{
        width: "100%",
        maxWidth: 600,
        background: "#ffffff",
        borderRadius: 24,
        padding: "48px 44px",
        boxShadow: "0 20px 60px rgba(30,58,138,0.1)",
        border: "1px solid rgba(59,130,246,0.1)",
      }}>

        {sent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 20px",
            }}>✓</div>
            <h2 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
              Message Sent!
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
              Thanks for reaching out! We'll review your project details and get back to you within 24 hours.
            </p>
            <button
              onClick={() => { setSent(false); setFile(null); }}
              style={{ marginTop: 24, fontSize: 13, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontWeight: 600 }}
            >
              Send another message →
            </button>
          </div>

        ) : (
          <form onSubmit={handleSubmit}>

            {/* Eyebrow */}
            <span style={{
              display: "inline-block", fontSize: 9, fontWeight: 700,
              letterSpacing: 3, textTransform: "uppercase" as const,
              color: "#3b82f6", background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              padding: "4px 12px", borderRadius: 999, marginBottom: 18,
            }}>
              Let's work together
            </span>

            <h1 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 34, fontWeight: 700, color: "#0f172a",
              letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 6,
            }}>
              Start Your Project
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8, lineHeight: 1.7 }}>
              Fill in your details below. Fields marked with <span style={{ color: "#ef4444" }}>*</span> are required.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="cf-label">Your Name <span className="cf-star">*</span></label>
                  <input className="cf-input" type="text" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="cf-label">Email Address <span className="cf-star">*</span></label>
                  <input className="cf-input" type="email" placeholder="john@email.com" required />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="cf-label">Company / Startup Name</label>
                <input className="cf-input" type="text" placeholder="Your company or project name" />
              </div>

              {/* Service Selection */}
              <div>
                <label className="cf-label">What service do you need? <span className="cf-star">*</span></label>
                <ServiceSelector />
              </div>

              {/* Message */}
              <div>
                <label className="cf-label">Tell us about your project <span className="cf-star">*</span></label>
                <textarea
                  className="cf-input"
                  placeholder="Describe your goals, timeline, budget, and any other details..."
                  rows={4}
                  required
                  style={{ resize: "none" as const }}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="cf-label">Attach a File</label>
                <div
                  className={`drop-zone${dragOver ? " drag-over" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>
                    Drag & drop or click to browse
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>
                    PDF, image, Word doc, ZIP — up to {MAX_MB}MB
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip"
                    style={{ display: "none" }}
                    onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                  />
                </div>
                {fileError && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8, fontWeight: 600 }}>⚠ {fileError}</p>
                )}
                {file && !fileError && (
                  <div className="file-chip">
                    <span style={{ fontSize: 20 }}>{getFileIcon(file.type)}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{formatSize(file.size)}</p>
                    </div>
                    <button className="remove-btn" type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>✕</button>
                  </div>
                )}
              </div>

            </div>

            <div style={{ marginTop: 24 }}>
              <button className="cf-btn" type="submit" disabled={loading || !!fileError}>
                {loading ? "Sending..." : "Send Message →"}
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", marginTop: 14 }}>
              We'll respond within 24 hours. No spam, ever.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

// ── Service selector component ──
function ServiceSelector() {
  const [selected, setSelected] = useState<string[]>([]);

  const services = [
    { id: "web",       icon: "🌐", label: "Web Development"   },
    { id: "app",       icon: "📱", label: "App Development"   },
    { id: "uiux",      icon: "🎨", label: "UI / UX Design"    },
    { id: "logo",      icon: "✏️",  label: "Logo Designing"    },
    { id: "marketing", icon: "📈", label: "Digital Marketing" },
    { id: "other",     icon: "💡", label: "Other / Not sure"  },
  ];

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="service-grid">
      {services.map(s => (
        <button
          key={s.id}
          type="button"
          className={`service-option${selected.includes(s.id) ? " selected" : ""}`}
          onClick={() => toggle(s.id)}
        >
          <span className="service-icon">{s.icon}</span>
          {s.label}
          {selected.includes(s.id) && (
            <span style={{ marginLeft: "auto", color: "#3b82f6", fontSize: 14 }}>✓</span>
          )}
        </button>
      ))}
    </div>
  );
}