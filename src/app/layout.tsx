import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omnior Browser - Next-Gen Web Browser",
  description: "The world's most advanced, cross-platform web browser—faster, more secure, more intelligent, and more personalized than Chrome, Firefox, Safari, Brave, or Edge.",
  keywords: ["Omnior", "Browser", "Web Browser", "Chrome Alternative", "Firefox Alternative", "Privacy Browser", "AI Browser", "Fast Browser", "Secure Browser"],
  authors: [{ name: "Omnior Team" }],
  openGraph: {
    title: "Omnior Browser - Next-Gen Web Browser",
    description: "The world's most advanced web browser with AI-powered features, privacy-first design, and cross-platform support.",
    url: "https://omnior.browser",
    siteName: "Omnior",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omnior Browser - Next-Gen Web Browser",
    description: "The world's most advanced web browser with AI-powered features and privacy-first design.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Navigation />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
