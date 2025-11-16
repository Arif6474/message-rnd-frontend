export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Message {
  _id: string;
  id?: string;
  sender: User;
  project: string;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Mention {
  _id: string;
  message: string;
  mentionedUser: string | User;
  createdAt: string;
}

export interface Notification {
  _id: string;
  id?: string;
  recipient: string;
  triggerUser: User;
  type: 'mention' | 'new_project' | 'project_update' | 'new_member' | 'message';
  content: string;
  isRead: boolean;
  referenceMessage?: string;
  referenceProject?: {
    _id: string;
    name: string;
    description?: string;
  };
  createdAt: string;
  readAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: PaginationMeta;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: PaginationMeta;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    mention: number;
    new_project: number;
    project_update: number;
    new_member: number;
    message: number;
  };
}

export interface ProjectMember {
  _id: string;
  user: User;
  project: string;
  role: string;
  permissions: string[];
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}
