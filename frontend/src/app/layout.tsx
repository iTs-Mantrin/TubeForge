import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TubeForge — Download YouTube Videos Instantly",
    template: "%s | TubeForge",
  },
  description:
    "Download YouTube videos and audio for free — any quality from 360p to 4K, MP4 or MP3. No limits, no sign-up.",
  keywords: [
    "youtube downloader",
    "download youtube videos",
    "youtube to mp4",
    "youtube to mp3",
    "free youtube downloader",
    "TubeForge",
  ],
  openGraph: {
    title: "TubeForge — Download YouTube Videos Instantly",
    description:
      "Download YouTube videos and audio for free — any quality from 360p to 4K, MP4 or MP3. No limits, no sign-up.",
    url: "https://TubeForge.in",
    siteName: "TubeForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TubeForge — Download YouTube Videos Instantly",
    description:
      "Download YouTube videos and audio for free — any quality from 360p to 4K, MP4 or MP3.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-surface-950 text-surface-100 antialiased">
        {children}
      </body>
    </html>
  );
}
