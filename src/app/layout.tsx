import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AEL from "@/components/AEL";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APSLOCK — Digital Product Studio",
  description: "We design, build and scale modern digital products for startups and businesses.",
  icons: {
    icon: "/logon.png",
    apple: "/logon.png",
  },
  openGraph: {
    title: "APSLOCK — Digital Product Studio",
    description: "We design, build and scale modern digital products for startups and businesses.",
    images: ["/logon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pt-24 dashed-grid`}>
        <Navbar />
        {children}
        <Footer />
        <AEL />
      </body>
    </html>
  );
}