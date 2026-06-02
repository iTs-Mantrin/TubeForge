import type { PlatformInfo, FAQItem } from '@/types';

// ============================================================
// API Configuration
// ============================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

// ============================================================
// Quality Presets
// ============================================================

export const QUALITY_OPTIONS = [
  { label: 'Best Available', value: 'highest', height: undefined },
  { label: '4K (2160p)', value: '2160p', height: 2160 },
  { label: '2K (1440p)', value: '1440p', height: 1440 },
  { label: 'Full HD (1080p)', value: '1080p', height: 1080 },
  { label: 'HD (720p)', value: '720p', height: 720 },
  { label: 'SD (480p)', value: '480p', height: 480 },
  { label: 'SD (360p)', value: '360p', height: 360 },
] as const;

// ============================================================
// Supported Platforms
// ============================================================

export const SUPPORTED_PLATFORMS: PlatformInfo[] = [
  { name: 'YouTube', icon: 'youtube', supported: true },
  { name: 'YouTube Shorts', icon: 'shorts', supported: true },
  { name: 'YouTube Music', icon: 'music', supported: true },
];

// ============================================================
// App Info
// ============================================================

export const APP_NAME = 'TubeForge';
export const APP_DOMAIN = 'TubeForge.in';
export const APP_TAGLINE = 'Download YouTube videos instantly — free, fast, and unlimited.';
export const APP_DESCRIPTION =
  'TubeForge lets you download YouTube videos and audio in any quality — 360p to 4K, MP4 or MP3. No limits, no sign-up needed.';

// ============================================================
// Features
// ============================================================

export const FEATURES = [
  {
    title: 'Any Quality',
    description: 'From 144p to 4K — pick the resolution that works for you.',
    icon: 'sparkles',
  },
  {
    title: 'Audio Only',
    description: 'Extract audio (AAC/MP3) at 192kbps. Perfect for music & podcasts.',
    icon: 'music',
  },
  {
    title: 'Blazing Fast',
    description: 'Powered by async queue processing — no waiting, no throttling.',
    icon: 'zap',
  },
  {
    title: 'No Limits',
    description: 'Download videos of any length and size. No daily caps.',
    icon: 'infinity',
  },
  {
    title: 'Real-Time Progress',
    description: 'Watch your download progress live via WebSocket updates.',
    icon: 'activity',
  },
  {
    title: 'Cloud Storage',
    description: 'Files stored reliably on Cloudflare R2 with CDN delivery.',
    icon: 'cloud',
  },
] as const;

// ============================================================
// FAQ
// ============================================================

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is TubeForge?',
    answer:
      'TubeForge is a free, unlimited YouTube downloader. Paste any YouTube URL — video, Short, or music — and download it in your preferred format and quality.',
  },
  {
    question: 'Is TubeForge free to use?',
    answer:
      'Yes, TubeForge is completely free. There are no hidden charges, usage limits, or sign-up requirements.',
  },
  {
    question: 'What formats are supported?',
    answer:
      'Videos are downloaded as MP4 in any quality from 144p to 4K. Audio is extracted as high-quality AAC (192kbps). Choose from 360p, 480p, 720p, 1080p, 1440p, or 2160p (4K).',
  },
  {
    question: 'How long does a download take?',
    answer:
      'Download time depends on video length, quality, and server load. Most downloads complete within seconds to a few minutes. You can track progress in real time.',
  },
  {
    question: 'Can I download YouTube Shorts?',
    answer:
      'Yes! Simply paste the Shorts URL and TubeForge will handle it just like any other video.',
  },
  {
    question: 'Is there a file size or duration limit?',
    answer:
      'No. There are no limits on file size or video duration. Download 10-hour 4K videos without any restrictions.',
  },
  {
    question: 'How do I download audio only?',
    answer:
      'Select the "Audio" tab when viewing video details. The audio will be extracted as high-quality AAC at 192kbps.',
  },
  {
    question: 'Where are my downloads stored?',
    answer:
      'Processed files are stored on Cloudflare R2 and delivered via their global CDN for fast downloads. Files are available for a limited time after processing.',
  },
];

// ============================================================
// Navigation
// ============================================================

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'History', href: '/history' },
  { label: 'Contact', href: '/contact' },
] as const;
