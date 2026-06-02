import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

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
  icons: {
    icon: "/icon.svg",
  },
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
    <html lang="en" className={`${sora.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-surface-950 text-surface-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
