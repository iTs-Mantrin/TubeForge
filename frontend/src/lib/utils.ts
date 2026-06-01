import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format bytes to human-readable size */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

/** Format seconds to MM:SS or HH:MM:SS */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Validate YouTube URL */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)/,
    /(?:youtu\.be\/)/,
    /(?:youtube\.com\/shorts\/)/,
    /(?:youtube\.com\/embed\/)/,
    /(?:m\.youtube\.com\/watch\?v=)/,
    /(?:music\.youtube\.com\/watch\?v=)/,
  ];
  try {
    const parsed = new URL(url);
    return patterns.some((p) => p.test(parsed.href));
  } catch {
    return false;
  }
}

/** Extract video ID from YouTube URL */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0];
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

/** Format download status for display */
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    queued: 'Queued',
    downloading: 'Downloading',
    processing: 'Processing',
    uploading: 'Uploading to Cloud',
    done: 'Completed',
    error: 'Error',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status;
}

/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

/** Truncate text with ellipsis */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

/** Format timestamp to relative time */
export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
