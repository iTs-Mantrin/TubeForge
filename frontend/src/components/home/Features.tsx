'use client';

import { motion } from 'framer-motion';
import { Sparkles, Music, Zap, Infinity, Activity, Cloud } from 'lucide-react';
import { FEATURES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  music: Music,
  zap: Zap,
  infinity: Infinity,
  activity: Activity,
  cloud: Cloud,
};

export default function Features() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
            Everything you need
          </h2>
          <p className="text-surface-400 text-lg max-w-xl mx-auto">
            Powerful features designed for the best download experience.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    'group relative p-6 rounded-2xl transition-all duration-300',
                    'glass glass-hover',
                    'hover:-translate-y-0.5'
                  )}
                >
                  {/* Icon */}
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 ring-1 ring-(--border-subtle) group-hover:ring-brand-500/20 transition-all">
                    <Icon className="h-5 w-5 text-brand-400" />
                  </div>

                  {/* Text */}
                  <h3 className="text-base font-semibold text-surface-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-surface-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
