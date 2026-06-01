'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, Shield, Zap } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/constants';
import { useDownloadStore } from '@/store/download';
import SearchBar from './SearchBar';

export default function Hero() {
  const router = useRouter();
  const fetchVideoInfo = useDownloadStore((s) => s.fetchVideoInfo);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(
    async (url: string) => {
      setLoading(true);
      try {
        await fetchVideoInfo(url);
        router.push(`/download/${encodeURIComponent(btoa(url))}`);
      } catch {
        router.push(`/download/${encodeURIComponent(btoa(url))}?url=${encodeURIComponent(url)}`);
      } finally {
        setLoading(false);
      }
    },
    [fetchVideoInfo, router]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-surface-300">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              <span>Free & Unlimited Downloads</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            <span className="text-surface-100">Download <span className="text-red-500">YouTube</span></span>
            <br />
            <span className="gradient-text">Videos Instantly</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-base sm:text-lg text-surface-400 leading-relaxed"
          >
            {APP_DESCRIPTION}
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={itemVariants} className="pt-4">
            <SearchBar onSearch={handleSearch} isLoading={loading} autoFocus />
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6 pt-8 text-xs text-surface-500"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> No sign-up required
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Unlimited downloads
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-surface-600">4K · 1080p · 720p · MP3</span>
            </span>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            variants={itemVariants}
            className="pt-12 flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown className="h-5 w-5 text-surface-500" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
