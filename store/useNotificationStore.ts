import { create } from 'zustand';
import type { Notification, NotificationStats } from '@/types/message';
import { notificationApi } from '@/lib/notification-api.service';
import { socketService } from '@/lib/socket.service';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  filter: 'all' | 'unread' | 'mention' | 'new_project' | 'new_member';

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  setStats: (stats: NotificationStats) => void;
  setFilter: (filter: NotificationState['filter']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  loadNotifications: (page?: number) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  loadStats: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Socket Actions
  initializeSocket: () => void;
  cleanupSocket: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  stats: null,
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  filter: 'all' as const,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  // === SETTERS ===
  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) => set((state) => {
    // Prevent duplicates
    const exists = state.notifications.some(n => n._id === notification._id);
    if (exists) return state;

    return {
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    };
  }),

  updateNotification: (notificationId, updates) => set((state) => ({
    notifications: state.notifications.map(n =>
      n._id === notificationId ? { ...n, ...updates } : n
    ),
  })),

  removeNotification: (notificationId) => set((state) => {
    const notification = state.notifications.find(n => n._id === notificationId);
    const wasUnread = notification && !notification.isRead;

    return {
      notifications: state.notifications.filter(n => n._id !== notificationId),
      unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
    };
  }),

  setUnreadCount: (count) => set({ unreadCount: count }),
  setStats: (stats) => set({ stats }),
  setFilter: (filter) => set({ filter, currentPage: 1 }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // === API ACTIONS ===
  loadNotifications: async (page = 1) => {
    const state = get();
    if (state.loading) return;

    set({ loading: true, error: null });

    try {
      const params: any = { page, limit: 20 };

      if (state.filter === 'unread') {
        params.isRead = false;
      } else if (state.filter !== 'all') {
        params.type = state.filter;
      }

      const response = await notificationApi.getNotifications(params);

      set({
        notifications: page === 1 ? response.notifications : [...state.notifications, ...response.notifications],
        currentPage: page,
        hasMore: response.pagination.page < response.pagination.totalPages,
        loading: false,
      });
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      set({
        error: error.message || 'Failed to load notifications',
        loading: false,
      });
    }
  },

  loadUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch (error: any) {
      console.error('Failed to load unread count:', error);
    }
  },

  loadStats: async () => {
    try {
      const stats = await notificationApi.getNotificationStats();
      set({ stats, unreadCount: stats.unread });
    } catch (error: any) {
      console.error('Failed to load notification stats:', error);
    }
  },

  markAsRead: async (notificationId) => {
    const notification = get().notifications.find(n => n._id === notificationId);
    
    try {
      // Optimistic update
      if (notification && !notification.isRead) {
        get().updateNotification(notificationId, { isRead: true, readAt: new Date().toISOString() });
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
      }

      await notificationApi.markNotificationAsRead(notificationId);
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update
      if (notification) {
        get().updateNotification(notificationId, { isRead: false, readAt: undefined });
        set((state) => ({ unreadCount: state.unreadCount + 1 }));
      }
    }
  },

  markAllAsRead: async () => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      await notificationApi.markAllAsRead();
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      // Reload to get correct state
      get().loadNotifications(1);
      get().loadUnreadCount();
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      // Optimistic update
      get().removeNotification(notificationId);

      await notificationApi.deleteNotification(notificationId);
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      set({ error: error.message || 'Failed to delete notification' });
    }
  },

  // === SOCKET ACTIONS ===
  initializeSocket: () => {
    const socket = socketService;

    // Listen for new notifications
    socket.onNotification(({ notification }) => {
      get().addNotification(notification);

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.type.replace('_', ' ').toUpperCase(), {
          body: notification.content,
          icon: '/favicon.ico',
          tag: notification._id,
        });
      }
    });
  },

  cleanupSocket: () => {
    socketService.off('notification');
  },

  // === RESET ===
  reset: () => set(initialState),
}));
