// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface FormatInfo {
  formatId: string;
  height: number;
  ext: string;
  filesize: number;
  vcodec: string;
  acodec: string;
  tbr: number;
}

export interface VideoMetadata {
  title: string;
  duration: number;
  uploader: string;
  thumbnail: string;
  webpageUrl: string;
  formats: FormatInfo[];
}

export interface DownloadJob {
  taskId: string;
  status: DownloadStatus;
  source: string;
  message: string;
}

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'processing'
  | 'uploading'
  | 'done'
  | 'error'
  | 'failed'
  | 'cancelled';

export interface ProgressData {
  taskId: string;
  percent: number;
  speed: string;
  eta: string;
  filename: string;
  status: DownloadStatus;
  errorMsg: string;
  downloadUrl: string;
}

export interface DownloadResult {
  downloadUrl: string;
}

// ============================================================
// Frontend State Types
// ============================================================

export interface QualityOption {
  label: string;
  value: string;
  height?: number;
  filesize: number;
  ext: string;
}

export type DownloadType = 'video' | 'audio';

export interface HistoryItem {
  taskId: string;
  title: string;
  thumbnail: string;
  url: string;
  quality: string;
  audioOnly: boolean;
  status: DownloadStatus;
  downloadUrl: string;
  timestamp: number;
  duration: number;
  uploader: string;
}

// ============================================================
// Form Types
// ============================================================

export interface DownloadFormData {
  url: string;
  quality: string;
  audioOnly: boolean;
}

// ============================================================
// Toast Types
// ============================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

// ============================================================
// Supported Platform
// ============================================================

export interface PlatformInfo {
  name: string;
  icon: string;
  supported: boolean;
}

// ============================================================
// FAQ
// ============================================================

export interface FAQItem {
  question: string;
  answer: string;
}
