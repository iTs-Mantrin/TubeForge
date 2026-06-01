'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Trash2,
  Download,
  Clock,
  Music,
  Film,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ToastContainer from '@/components/ui/Toast';
import { useHistoryStore } from '@/store/history';
import { formatDuration, formatStatus, timeAgo, cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import type { HistoryItem } from '@/types';

function HistoryCard({
  item,
  onRemove,
}: {
  item: HistoryItem;
  onRemove: (taskId: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl overflow-hidden group hover:ring-1 hover:ring-white/10 transition-all"
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-28 h-16 sm:w-36 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-800">
          {!imgError ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover"
              sizes="144px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Film className="h-5 w-5 text-surface-500" />
            </div>
          )}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white">
            {formatDuration(item.duration)}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/download/${encodeURIComponent(btoa(item.url))}`}
            className="text-sm font-medium text-white hover:text-brand-300 transition-colors line-clamp-1"
          >
            {item.title}
          </Link>
          <p className="text-xs text-surface-500 mt-0.5">{item.uploader}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded">
              {item.audioOnly ? (
                <Music className="h-3 w-3" />
              ) : (
                <Film className="h-3 w-3" />
              )}
              {item.audioOnly ? 'MP3' : item.quality}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-surface-500">
              <Clock className="h-3 w-3" />
              {timeAgo(item.timestamp)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 hover:text-brand-300 transition-all"
              title="Download again"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onRemove(item.taskId)}
            className="flex items-center justify-center p-2 rounded-lg bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all"
            title="Remove from history"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const { items, searchQuery, setSearchQuery, removeItem, clearHistory } =
    useHistoryStore();

  const filtered = searchQuery.trim()
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.uploader.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Download History
              </h1>
              <p className="text-surface-400 text-sm mt-1">
                {items.length} download{items.length !== 1 ? 's' : ''}
              </p>
            </div>

            {items.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </button>
            )}
          </motion.div>

          {/* Search */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative mb-6"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloads..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800/50 border border-white/5 text-sm text-white placeholder-surface-500 outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
              />
            </motion.div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-800">
                  <Clock className="h-6 w-6 text-surface-500" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                No downloads yet
              </h2>
              <p className="text-sm text-surface-400 mb-6 max-w-sm mx-auto">
                Your download history will appear here after you download your first video.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all"
              >
                <Download className="h-4 w-4" />
                Download a Video
              </Link>
            </motion.div>
          )}

          {/* History list */}
          {items.length > 0 && (
            <>
              {/* No search results */}
              {filtered.length === 0 && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-surface-500 text-sm">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                </motion.div>
              )}

              {/* Items */}
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {filtered.map((item) => (
                    <HistoryCard
                      key={item.taskId}
                      item={item}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
