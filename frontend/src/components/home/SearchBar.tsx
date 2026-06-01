'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Link as LinkIcon, X, Loader2, Play } from 'lucide-react';
import { cn, isValidYouTubeUrl } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (url: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({ onSearch, isLoading, autoFocus }: SearchBarProps) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const validateUrl = useCallback((value: string) => {
    if (!value) {
      setIsValid(null);
      return;
    }
    setIsValid(isValidYouTubeUrl(value));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (trimmedUrl && isValidYouTubeUrl(trimmedUrl)) {
      onSearch(trimmedUrl);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      validateUrl(text);
      if (isValidYouTubeUrl(text)) {
        onSearch(text);
      }
    } catch {
      // Clipboard API not available
    }
  };

  const handleClear = () => {
    setUrl('');
    setIsValid(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'relative flex items-center gap-3 w-full px-5 py-4 rounded-2xl transition-all duration-300',
            'glass',
            isFocused && 'ring-2 ring-brand-500/50 shadow-lg shadow-brand-500/10',
            isValid === false && 'ring-2 ring-red-500/50',
            isLoading && 'opacity-75 pointer-events-none'
          )}
        >
          {/* Icon */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
            ) : (
              <Play className="h-5 w-5 text-surface-400" />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube link here..."
            className="flex-1 bg-transparent text-base text-white placeholder-surface-500 outline-none border-none min-w-0"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {url && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {!url && !isLoading && (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-300 hover:text-white hover:bg-brand-500/10 transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Paste
              </button>
            )}

            <motion.button
              type="submit"
              disabled={!url || !isValidYouTubeUrl(url) || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                isValidYouTubeUrl(url)
                  ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40'
                  : 'bg-surface-800 text-surface-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Validation hint */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{
            opacity: isValid === false ? 1 : 0,
            y: isValid === false ? 0 : -5,
          }}
          className="absolute -bottom-6 left-5"
        >
          <span className="text-xs text-red-400">
            Please enter a valid YouTube URL (youtube.com, youtu.be)
          </span>
        </motion.div>
      </form>
    </div>
  );
}
