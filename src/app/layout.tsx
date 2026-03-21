import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AEL from "@/components/AEL";
import VoiceAEL from "@/components/VoiceAEL";
import VoiceAELButton from "@/components/VoiceAELButton";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "APSLOCK — Digital Product Studio",
  description: "We build digital products that drive growth.",
  icons: {
    icon: "/mapl.png",
    apple: "/mapl.png",
    shortcut: "/mapl.png",
  },
  openGraph: {
    title: "APSLOCK — Digital Product Studio",
    description: "We build digital products that drive growth.",
    images: ["/mapl.png"],
    url: siteUrl,
    siteName: "APSLOCK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APSLOCK — Digital Product Studio",
    description: "We build digital products that drive growth.",
    images: ["/mapl.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/mapl.png" />
        <link rel="apple-touch-icon" href="/mapl.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`pt-24 ${sora.variable}`} suppressHydrationWarning>
        <Navbar />
        {children}
        <Footer />
        <AEL />
        <VoiceAEL />
        <VoiceAELButton />
      </body>
    </html>
  );
}