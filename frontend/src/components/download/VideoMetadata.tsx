'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, User, Film, Eye, Download } from 'lucide-react';
import type { VideoMetadata as VideoMetadataType } from '@/types';
import { formatDuration, formatBytes, truncate } from '@/lib/utils';

interface VideoMetadataProps {
  metadata: VideoMetadataType;
}

export default function VideoMetadata({ metadata }: VideoMetadataProps) {
  const totalFormats = metadata.formats?.length ?? 0;
  const uniqueQualities = new Set(metadata.formats?.map((f) => f.height).filter(Boolean)).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
        {/* Thumbnail */}
        <div className="md:col-span-2 relative aspect-video md:aspect-auto md:min-h-[240px] bg-surface-900">
          <Image
            src={metadata.thumbnail}
            alt={metadata.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent" />

          {/* Duration badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-xs text-white">
            <Clock className="h-3 w-3" />
            {formatDuration(metadata.duration)}
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-3 p-6 flex flex-col justify-center gap-4">
          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold text-surface-100 leading-snug line-clamp-2">
            {metadata.title}
          </h1>

          {/* Channel */}
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <User className="h-4 w-4" />
            <span>{metadata.uploader}</span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Film className="h-3.5 w-3.5" />
              {totalFormats} format{totalFormats !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Up to {uniqueQualities}p
            </span>
            {metadata.formats?.[0]?.filesize > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                from {formatBytes(metadata.formats[0].filesize)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
