'use client';

import { motion } from 'framer-motion';
import { Music, Film, Check, Download } from 'lucide-react';
import type { FormatInfo, DownloadType } from '@/types';
import { QUALITY_OPTIONS } from '@/lib/constants';
import { formatBytes, cn } from '@/lib/utils';

interface QualitySelectorProps {
  formats?: FormatInfo[];
  downloadType: DownloadType;
  selectedQuality: string;
  onTypeChange: (type: DownloadType) => void;
  onQualityChange: (quality: string) => void;
  onDownload: () => void;
  disabled?: boolean;
}

export default function QualitySelector({
  formats,
  downloadType,
  selectedQuality,
  onTypeChange,
  onQualityChange,
  onDownload,
  disabled,
}: QualitySelectorProps) {
  // Filter quality options by available formats
  const availableHeights = new Set(formats?.map((f) => f.height) ?? []);
  const availableQualities = QUALITY_OPTIONS.filter(
    (q) => !q.height || availableHeights.has(q.height)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-2xl p-6 space-y-6"
    >
      {/* Download Type Tabs */}
      <div className="flex rounded-xl bg-surface-800/50 p-1 gap-1">
        <button
          onClick={() => onTypeChange('video')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            downloadType === 'video'
              ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-surface-400 hover:text-white'
          )}
        >
          <Film className="h-4 w-4" />
          Video (MP4)
        </button>
        <button
          onClick={() => onTypeChange('audio')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            downloadType === 'audio'
              ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-surface-400 hover:text-white'
          )}
        >
          <Music className="h-4 w-4" />
          Audio (MP3)
        </button>
      </div>

      {/* Quality Options */}
      {downloadType === 'video' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
            Quality
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableQualities.map((quality) => {
              const isSelected = selectedQuality === quality.value;
              const fmt = formats?.find((f) => f.height === quality.height);
              return (
                <button
                  key={quality.value}
                  onClick={() => onQualityChange(quality.value)}
                  disabled={disabled}
                  className={cn(
                    'relative flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm transition-all duration-200',
                    isSelected
                      ? 'bg-brand-600/20 ring-2 ring-brand-500 text-white'
                      : 'bg-surface-800/50 ring-1 ring-white/5 text-surface-400 hover:ring-white/10 hover:text-white',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSelected && (
                    <Check className="absolute top-2 right-2 h-3 w-3 text-brand-400" />
                  )}
                  <span className="text-xs font-semibold">{quality.label}</span>
                  {fmt && fmt.filesize > 0 && (
                    <span className="text-[10px] text-surface-500">
                      {formatBytes(fmt.filesize)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {downloadType === 'audio' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
            Audio Format
          </label>
          <div className="flex gap-2">
            {[
              { label: 'MP3 192kbps', value: 'mp3', desc: 'High quality' },
            ].map((opt) => (
              <div
                key={opt.value}
                className="flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-brand-600/20 ring-2 ring-brand-500 text-white"
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] text-surface-400">{opt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Button */}
      <button
        onClick={onDownload}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200',
          'bg-gradient-to-r from-brand-600 to-accent-600 text-white',
          'shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5',
          'active:translate-y-0',
          disabled && 'opacity-50 cursor-not-allowed hover:translate-y-0 shadow-none'
        )}
      >
        <Download className="h-4 w-4" />
        {downloadType === 'video' ? 'Download Video' : 'Download Audio'}
      </button>
    </motion.div>
  );
}
