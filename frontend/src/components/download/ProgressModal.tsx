'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Download,
  Clock,
  Zap,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useDownloadStore } from '@/store/download';
import { useHistoryStore } from '@/store/history';
import { formatBytes, formatStatus, cn } from '@/lib/utils';

export default function ProgressModal() {
  const {
    showProgressModal,
    setShowProgressModal,
    activeJob,
    progress,
    isDownloading,
    downloadError,
    cancelDownload,
    videoInfo,
    selectedQuality,
    downloadType,
  } = useDownloadStore();

  const addHistoryItem = useHistoryStore((s) => s.addItem);

  const percent = progress?.percent ?? 0;
  const status = progress?.status ?? (activeJob?.status ?? 'queued');
  const isDone = status === 'done';
  const isError = status === 'error' || status === 'failed';
  const isCancelled = status === 'cancelled';

  // Save to history when complete
  useEffect(() => {
    if (isDone && activeJob && videoInfo && progress?.downloadUrl) {
      addHistoryItem({
        taskId: activeJob.taskId,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        url: videoInfo.webpageUrl,
        quality: selectedQuality,
        audioOnly: downloadType === 'audio',
        status: 'done',
        downloadUrl: progress.downloadUrl,
        duration: videoInfo.duration,
        uploader: videoInfo.uploader,
      });
    }
  }, [isDone, activeJob, videoInfo, progress, selectedQuality, downloadType, addHistoryItem]);

  // Auto-close on success after delay
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => setShowProgressModal(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isDone, setShowProgressModal]);

  const statusConfig = useMemo(() => {
    if (isDone) return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', text: 'Download Complete!' };
    if (isError) return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', text: downloadError || 'Download Failed' };
    if (isCancelled) return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'Cancelled' };
    return { icon: Loader2, color: 'text-brand-400', bg: 'bg-brand-500/10', text: formatStatus(status) };
  }, [isDone, isError, isCancelled, status, downloadError]);

  const StatusIcon = statusConfig.icon;

  const handleClose = () => {
    if (!isDownloading || isDone || isError || isCancelled) {
      setShowProgressModal(false);
    }
  };

  const handleCopyLink = () => {
    if (progress?.downloadUrl) {
      navigator.clipboard.writeText(progress.downloadUrl);
    }
  };

  return (
    <AnimatePresence>
      {showProgressModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md glass-strong rounded-2xl overflow-hidden"
          >
            {/* Close button */}
            {(isDone || isError || isCancelled) && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="p-6 space-y-6">
              {/* Status Icon */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', statusConfig.bg)}>
                  <StatusIcon
                    className={cn(
                      'h-7 w-7',
                      statusConfig.color,
                      !isDone && !isError && !isCancelled && 'animate-spin'
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {statusConfig.text}
                  </h3>
                  {progress?.filename && (
                    <p className="text-xs text-surface-400 mt-1 truncate max-w-[300px]">
                      {progress.filename}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {!isDone && !isError && !isCancelled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-surface-400">
                    <span>{percent.toFixed(1)}%</span>
                    <span>{formatStatus(status)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    />
                  </div>
                </div>
              )}

              {/* Stats */}
              {!isDone && !isError && !isCancelled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-800/50">
                    <Zap className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider">Speed</p>
                      <p className="text-xs font-medium text-white truncate">
                        {progress?.speed || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-800/50">
                    <Clock className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider">ETA</p>
                      <p className="text-xs font-medium text-white truncate">
                        {progress?.eta || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {isError && downloadError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{downloadError}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {isDone && progress?.downloadUrl && (
                  <>
                    <a
                      href={progress.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 rounded-xl glass text-xs text-surface-300 hover:text-white transition-colors"
                    >
                      Copy Link
                    </button>
                  </>
                )}

                {isDownloading && activeJob && (
                  <button
                    onClick={cancelDownload}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    Cancel Download
                  </button>
                )}

                {(isError || isCancelled) && (
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-surface-300 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
