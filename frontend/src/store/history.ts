'use client';

import { create } from 'zustand';
import type { HistoryItem } from '@/types';

const STORAGE_KEY = 'TubeForge_history';
const MAX_ITEMS = 50;

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

interface HistoryState {
  items: HistoryItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  addItem: (item: Omit<HistoryItem, 'timestamp'>) => void;
  removeItem: (taskId: string) => void;
  clearHistory: () => void;
  getFilteredItems: () => HistoryItem[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: loadHistory(),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addItem: (item) => {
    const newItem: HistoryItem = {
      ...item,
      timestamp: Date.now(),
    };
    set((state) => {
      // Remove duplicate if exists
      const filtered = state.items.filter((i) => i.taskId !== item.taskId);
      const items = [newItem, ...filtered].slice(0, MAX_ITEMS);
      saveHistory(items);
      return { items };
    });
  },

  removeItem: (taskId) => {
    set((state) => {
      const items = state.items.filter((i) => i.taskId !== taskId);
      saveHistory(items);
      return { items };
    });
  },

  clearHistory: () => {
    saveHistory([]);
    set({ items: [] });
  },

  getFilteredItems: () => {
    const { items, searchQuery } = get();
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.uploader.toLowerCase().includes(q)
    );
  },
}));
