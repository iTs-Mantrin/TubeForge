'use client';

import { motion } from 'framer-motion';
import { Play, Music } from 'lucide-react';
import { SUPPORTED_PLATFORMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const platformIcons: Record<string, React.ElementType> = {
  youtube: Play,
  shorts: Play,
  music: Music,
};

export default function SupportedPlatforms() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
            Supported Platforms
          </h2>
          <p className="text-surface-400 text-lg max-w-xl mx-auto">
            One tool for all your YouTube content.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {SUPPORTED_PLATFORMS.map((platform) => {
            const Icon = platformIcons[platform.icon] || Play;
            return (
              <div
                key={platform.name}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300',
                  'glass glass-hover'
                )}
              >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 ring-1 ring-(--border-subtle)">
                  <Icon className="h-6 w-6 text-brand-400" />
                </div>
                <span className="text-sm font-medium text-surface-100">
                  {platform.name}
                </span>
                {platform.supported && (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    Supported
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
