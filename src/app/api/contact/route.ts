import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, services, message } = body;

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json(
        { success: false, error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Log submission (always works — good for debugging in Vercel logs)
    console.log("[Contact Form] New submission:", {
      name,
      email,
      company: company || "—",
      services: services || [],
      message: message.slice(0, 100),
      timestamp: new Date().toISOString(),
    });

    // Save to Supabase
    const { supabase } = await import("@/lib/supabase");
    await supabase.from("contact_submissions").insert({
      name,
      email,
      company: company || null,
      services: Array.isArray(services) ? services : [],
      message,
    });

    // ── Optional: Web3Forms (add WEB3FORMS_KEY to .env.local) ──────────
    const web3Key = process.env.WEB3FORMS_KEY;
    if (web3Key) {
      try {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: web3Key,
            subject: `New contact from ${name} — APSLOCK`,
            from_name: name,
            email,
            message: `Company: ${company || "—"}\nServices: ${
              Array.isArray(services) ? services.join(", ") : "—"
            }\n\n${message}`,
          }),
        });
        console.log("[Contact Form] Sent via Web3Forms");
      } catch (e) {
        console.error("[Contact Form] Web3Forms error:", e);
      }
    }

    // ── Optional: Resend (add RESEND_API_KEY + CONTACT_EMAIL to .env.local) ──
    const resendKey = process.env.RESEND_API_KEY;
    const contactEmail = process.env.CONTACT_EMAIL;
    if (resendKey && contactEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "APSLOCK Contact <onboarding@resend.dev>",
            to: [contactEmail],
            subject: `New contact from ${name} — APSLOCK`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Company:</strong> ${company || "—"}</p>
              <p><strong>Services:</strong> ${
                Array.isArray(services) ? services.join(", ") : "—"
              }</p>
              <hr />
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, "<br/>")}</p>
            `,
          }),
        });
        console.log("[Contact Form] Sent via Resend");
      } catch (e) {
        console.error("[Contact Form] Resend error:", e);
      }
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error("[Contact Form] Handler error:", e);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}