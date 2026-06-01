'use client';

import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/lib/constants';

let socket: Socket | null = null;

type ProgressCallback = (data: {
  percent: number;
  speed: string;
  eta: string;
  status: string;
  filename: string;
}) => void;

type StatusCallback = (status: string) => void;

interface Subscription {
  onProgress: ProgressCallback;
  onStatus: StatusCallback;
}

const subscriptions = new Map<string, Subscription>();

/**
 * Get or initialize the Socket.IO connection.
 * Lazy-initialized on first subscribe call.
 */
function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/progress`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
    });

    // Listen for progress events for all subscribed tasks
    socket.on('progress', (data: { taskId: string } & Record<string, unknown>) => {
      const sub = subscriptions.get(data.taskId);
      if (sub) {
        sub.onProgress({
          percent: (data.percent as number) || 0,
          speed: (data.speed as string) || '',
          eta: (data.eta as string) || '',
          status: (data.status as string) || '',
          filename: (data.filename as string) || '',
        });
      }
    });

    // Listen for status change events
    socket.on('status', (data: { taskId: string; status: string }) => {
      const sub = subscriptions.get(data.taskId);
      if (sub) {
        sub.onStatus(data.status);
      }
    });
  }
  return socket;
}

/**
 * Subscribe to real-time progress for a task.
 */
export function subscribeToProgress(
  taskId: string,
  onProgress: ProgressCallback,
  onStatus: StatusCallback
): () => void {
  const s = getSocket();

  subscriptions.set(taskId, { onProgress, onStatus });

  // Tell the server we want updates for this task
  s.emit('subscribe', { taskId });

  // Return unsubscribe function
  return () => {
    subscriptions.delete(taskId);
    s.emit('unsubscribe', { taskId });
  };
}

/**
 * Disconnect the WebSocket entirely.
 */
export function disconnectSocket(): void {
  if (socket) {
    subscriptions.clear();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected.
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}
