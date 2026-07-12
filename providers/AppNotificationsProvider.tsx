'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from './ToastProvider';

export interface AppNotif {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface NotifCtx {
  notifications: AppNotif[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
}

const Ctx = createContext<NotifCtx>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  clearAll: () => {},
});

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

const AUTO_TOAST_TYPES = new Set([
  'whatsapp_disconnected',
  'whatsapp_connected',
  'whatsapp_auth_failure',
  'alert_failed',
]);

export function AppNotificationsProvider({ children }: { children: ReactNode }) {
  const { showToast, showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState<AppNotif[]>([]);
  const [readCount,     setReadCount]     = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const addNotif = useCallback((notif: AppNotif) => {
    setNotifications((prev) => [notif, ...prev].slice(0, 50));

    if (AUTO_TOAST_TYPES.has(notif.type)) {
      if (notif.severity === 'success') showSuccess(notif.message);
      else if (notif.severity === 'error') showError(notif.message);
      else showToast(notif.message, notif.severity);
    }
  }, [showSuccess, showError, showToast]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    // Sent so the backend can join this socket to the right location room(s)
    // — notifications are then scoped to what this user can actually see,
    // instead of broadcasting every location's alerts to every role.
    const socket = io(WS_URL, { transports: ['websocket', 'polling'], reconnection: true, auth: { token } });
    socketRef.current = socket;

    socket.on('app:notification', (notif: AppNotif) => addNotif(notif));

    // On connect, request the daily policy summary to populate the bell
    socket.on('connect', () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      fetch(`${apiBase}/notifications/push-summary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [addNotif]);

  const markAllRead = useCallback(() => setReadCount(notifications.length), [notifications.length]);
  const clearAll    = useCallback(() => { setNotifications([]); setReadCount(0); }, []);

  const unreadCount = Math.max(0, notifications.length - readCount);

  return (
    <Ctx.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAppNotifications = () => useContext(Ctx);
