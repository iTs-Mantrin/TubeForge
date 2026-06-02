import axios from 'axios';
import type {
  ApiResponse,
  VideoMetadata,
  DownloadJob,
  ProgressData,
  DownloadResult,
} from '@/types';
import { API_BASE_URL } from '@/lib/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// Video Info / Preview
// ============================================================

export async function getVideoInfo(url: string): Promise<VideoMetadata> {
  const { data } = await apiClient.post<ApiResponse<VideoMetadata>>(
    '/youtube/preview',
    { url }
  );
  if (!data.success) {
    throw new Error('Failed to fetch video information');
  }
  return data.data;
}

// ============================================================
// Download
// ============================================================

export async function startDownload(
  url: string,
  quality: string = 'highest',
  audioOnly: boolean = false
): Promise<DownloadJob> {
  const { data } = await apiClient.post<ApiResponse<DownloadJob>>(
    '/youtube/download',
    { url, quality, audioOnly }
  );
  if (!data.success) {
    throw new Error(data.data?.message || 'Failed to start download');
  }
  return data.data;
}

// ============================================================
// Progress
// ============================================================

export async function getProgress(taskId: string): Promise<ProgressData> {
  const { data } = await apiClient.get<ApiResponse<ProgressData>>(
    `/youtube/progress/${taskId}`
  );
  if (!data.success) {
    throw new Error('Failed to fetch progress');
  }
  return data.data;
}

// ============================================================
// Download Result (file URL)
// ============================================================

export async function getDownloadResult(
  taskId: string
): Promise<DownloadResult> {
  const { data } = await apiClient.get<ApiResponse<DownloadResult>>(
    `/youtube/file/${taskId}`
  );
  if (!data.success) {
    throw new Error('Failed to fetch download result');
  }
  return data.data;
}

// ============================================================
// Cancel Download
// ============================================================

export async function cancelDownload(taskId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<{ status: string }>>(
    `/youtube/${taskId}`
  );
  if (!data.success) {
    throw new Error('Failed to cancel download');
  }
}

export default apiClient;
