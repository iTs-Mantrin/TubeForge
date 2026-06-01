'use client';

import { create } from 'zustand';
import type {
  VideoMetadata,
  DownloadJob,
  ProgressData,
  DownloadStatus,
  QualityOption,
  DownloadType,
} from '@/types';
import { getVideoInfo, startDownload, getProgress, getDownloadResult } from '@/services/api';
import { subscribeToProgress } from '@/services/websocket';

interface DownloadState {
  // Input
  url: string;
  setUrl: (url: string) => void;

  // Video info
  videoInfo: VideoMetadata | null;
  videoInfoLoading: boolean;
  videoInfoError: string | null;

  // Download type & quality
  downloadType: DownloadType;
  setDownloadType: (type: DownloadType) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;

  // Download job
  activeJob: DownloadJob | null;
  progress: ProgressData | null;
  isDownloading: boolean;
  downloadError: string | null;

  // Modal
  showProgressModal: boolean;
  setShowProgressModal: (show: boolean) => void;

  // Actions
  fetchVideoInfo: (url: string) => Promise<void>;
  fetchVideoInfoByUrl: () => Promise<void>;
  startDownload: () => Promise<void>;
  pollProgress: () => Promise<void>;
  cancelDownload: () => void;
  reset: () => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  // Input
  url: '',
  setUrl: (url) => set({ url }),

  // Video info
  videoInfo: null,
  videoInfoLoading: false,
  videoInfoError: null,

  // Download type & quality
  downloadType: 'video',
  setDownloadType: (downloadType) => set({ downloadType }),
  selectedQuality: 'highest',
  setSelectedQuality: (quality) => set({ selectedQuality: quality }),

  // Download job
  activeJob: null,
  progress: null,
  isDownloading: false,
  downloadError: null,

  // Modal
  showProgressModal: false,
  setShowProgressModal: (show) => set({ showProgressModal: show }),

  // Actions
  fetchVideoInfo: async (url: string) => {
    set({ videoInfoLoading: true, videoInfoError: null, url });
    try {
      const info = await getVideoInfo(url);
      set({ videoInfo: info, videoInfoLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch video info';
      set({ videoInfoError: message, videoInfoLoading: false, videoInfo: null });
    }
  },

  fetchVideoInfoByUrl: async () => {
    const { url } = get();
    if (!url) return;
    await get().fetchVideoInfo(url);
  },

  startDownload: async () => {
    const { url, selectedQuality, downloadType } = get();
    const audioOnly = downloadType === 'audio';

    set({ isDownloading: true, downloadError: null, showProgressModal: true });

    try {
      const job = await startDownload(url, selectedQuality, audioOnly);
      set({ activeJob: job });

      // Subscribe to WebSocket progress
      const unsubscribe = subscribeToProgress(
        job.taskId,
        (wsProgress) => {
          set((state) => ({
            progress: {
              ...(state.progress || {
                taskId: job.taskId,
                percent: 0,
                speed: '',
                eta: '',
                filename: '',
                status: 'queued',
                errorMsg: '',
                downloadUrl: '',
              }),
              ...wsProgress,
              status: wsProgress.status as DownloadStatus,
              taskId: job.taskId,
            },
          }));
        },
        (newStatus) => {
          set((state) => ({
            progress: state.progress
              ? { ...state.progress, status: newStatus as DownloadStatus }
              : null,
          }));
        }
      );

      // Fallback: poll progress as well
      const pollInterval = setInterval(async () => {
        try {
          const progress = await getProgress(job.taskId);
          set({ progress });

          if (['done', 'error', 'failed', 'cancelled'].includes(progress.status)) {
            clearInterval(pollInterval);

            if (progress.status === 'done' && !progress.downloadUrl) {
              // Fetch the actual download URL
              try {
                const result = await getDownloadResult(job.taskId);
                set((state) => ({
                  progress: state.progress
                    ? { ...state.progress, downloadUrl: result.downloadUrl }
                    : null,
                }));
              } catch {
                // URL fetch failed, progress already has the URL
              }
            }

            set({ isDownloading: false });
            unsubscribe();
          }
        } catch {
          clearInterval(pollInterval);
        }
      }, 2000);

      // If job completes very fast, clear interval after a timeout
      setTimeout(() => clearInterval(pollInterval), 3600000); // 1 hour max
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start download';
      set({ downloadError: message, isDownloading: false });
    }
  },

  pollProgress: async () => {
    const { activeJob } = get();
    if (!activeJob) return;
    try {
      const progress = await getProgress(activeJob.taskId);
      set({ progress });
    } catch {
      // silently fail
    }
  },

  cancelDownload: () => {
    set({
      activeJob: null,
      progress: null,
      isDownloading: false,
      showProgressModal: false,
    });
  },

  reset: () => {
    set({
      videoInfo: null,
      videoInfoLoading: false,
      videoInfoError: null,
      activeJob: null,
      progress: null,
      isDownloading: false,
      downloadError: null,
      showProgressModal: false,
    });
  },
}));
