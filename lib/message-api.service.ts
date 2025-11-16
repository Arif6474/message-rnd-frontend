import { privateAxios } from './axios';
import type { Message, MessagesResponse } from '@/types/message';

export interface CreateMessageRequest {
  projectId: string;
  content: string;
}

export interface GetProjectMessagesParams {
  page?: number;
  limit?: number;
  beforeDate?: string;
  afterDate?: string;
}

export interface MarkMessagesAsReadRequest {
  messageIds: string[];
}

class MessageApiService {
  private readonly basePath = '/messages';

  /**
   * Create a new message
   */
  async createMessage(data: CreateMessageRequest): Promise<Message> {
    const response = await privateAxios.post(this.basePath, data);
    return response.data.data;
  }

  /**
   * Get messages for a project
   */
  async getProjectMessages(
    projectId: string,
    params: GetProjectMessagesParams = {}
  ): Promise<MessagesResponse> {
    const response = await privateAxios.get(`${this.basePath}/project/${projectId}`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        beforeDate: params.beforeDate,
        afterDate: params.afterDate,
      },
    });
    return response.data.data;
  }

  /**
   * Get unread messages for a project
   */
  async getUnreadMessages(projectId: string): Promise<Message[]> {
    const response = await privateAxios.get(`${this.basePath}/project/${projectId}/unread`);
    return response.data.data;
  }

  /**
   * Get project message statistics
   */
  async getProjectMessageStats(projectId: string): Promise<{
    totalMessages: number;
    unreadCount: number;
    lastMessageAt: string;
  }> {
    const response = await privateAxios.get(`${this.basePath}/project/${projectId}/stats`);
    return response.data.data;
  }

  /**
   * Get user mentions
   */
  async getUserMentions(params: { page?: number; limit?: number } = {}): Promise<{
    mentions: Array<{
      _id: string;
      message: Message;
      mentionedUser: string;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await privateAxios.get(`${this.basePath}/mentions`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
      },
    });
    return response.data.data;
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    await privateAxios.put(`${this.basePath}/${messageId}/read`);
  }

  /**
   * Mark multiple messages as read
   */
  async markMessagesAsRead(data: MarkMessagesAsReadRequest): Promise<{ modifiedCount: number }> {
    const response = await privateAxios.put(`${this.basePath}/read`, data);
    return response.data.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await privateAxios.delete(`${this.basePath}/${messageId}`);
  }
}

export const messageApi = new MessageApiService();
