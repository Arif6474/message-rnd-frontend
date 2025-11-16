import { privateAxios } from './axios';
import type { Notification, NotificationsResponse, NotificationStats } from '@/types/message';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: 'mention' | 'new_project' | 'project_update' | 'new_member' | 'message';
  isRead?: boolean;
}

export interface MarkNotificationsAsReadRequest {
  notificationIds: string[];
}

class NotificationApiService {
  private readonly basePath = '/notifications';

  /**
   * Get user notifications
   */
  async getNotifications(params: GetNotificationsParams = {}): Promise<NotificationsResponse> {
    const response = await privateAxios.get(this.basePath, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        type: params.type,
        isRead: params.isRead,
      },
    });
    return response.data.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await privateAxios.get(`${this.basePath}/unread/count`);
    return response.data.data.count;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await privateAxios.get(`${this.basePath}/stats`);
    return response.data.data;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await privateAxios.put(`${this.basePath}/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await privateAxios.put(`${this.basePath}/read-all`);
    return response.data.data;
  }

  /**
   * Mark multiple notifications as read
   */
  async markNotificationsAsRead(data: MarkNotificationsAsReadRequest): Promise<{ modifiedCount: number }> {
    const response = await privateAxios.put(`${this.basePath}/read`, data);
    return response.data.data;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await privateAxios.delete(`${this.basePath}/${notificationId}`);
  }
}

export const notificationApi = new NotificationApiService();
