import { io, Socket } from 'socket.io-client';
import type { Message, Notification, ProjectMember, TypingIndicator } from '@/types/message';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type SocketEventCallback = (...args: any[]) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentProjectId: string | null = null;
  private currentUserId: string | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initialize socket connection
   */
  public connect(accessToken?: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: accessToken ? { token: accessToken } : undefined,
    });

    this.setupEventListeners();
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Rejoin project if we were in one
      if (this.currentProjectId && this.currentUserId) {
        this.joinProject(this.currentProjectId, this.currentUserId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Join a project room
   */
  public joinProject(projectId: string, userId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.currentProjectId = projectId;
    this.currentUserId = userId;

    this.socket.emit('joinProject', { projectId, userId });
    console.log(`📢 Joined project: ${projectId}`);
  }

  /**
   * Leave current project
   */
  public leaveProject(): void {
    this.currentProjectId = null;
    this.currentUserId = null;
  }

  /**
   * Send a message
   */
  public sendMessage(projectId: string, content: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('sendMessage', { projectId, content });
  }

  /**
   * Mark message as read
   */
  public markMessageAsRead(messageId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('markAsRead', { messageId });
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(projectId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { projectId, isTyping });
  }

  /**
   * Listen for project messages (on join)
   */
  public onProjectMessages(callback: (messages: Message[]) => void): void {
    this.socket?.on('projectMessages', callback);
  }

  /**
   * Listen for project members (on join)
   */
  public onProjectMembers(callback: (members: ProjectMember[]) => void): void {
    this.socket?.on('projectMembers', callback);
  }

  /**
   * Listen for new messages
   */
  public onNewMessage(callback: (message: Message) => void): void {
    this.socket?.on('newMessage', callback);
  }

  /**
   * Listen for notifications
   */
  public onNotification(callback: (data: { type: string; notification: Notification; message?: Message }) => void): void {
    this.socket?.on('notification', callback);
  }

  /**
   * Listen for message read events
   */
  public onMessageRead(callback: (data: { messageId: string; userId: string; timestamp: Date }) => void): void {
    this.socket?.on('messageRead', callback);
  }

  /**
   * Listen for typing indicators
   */
  public onUserTyping(callback: (data: TypingIndicator) => void): void {
    this.socket?.on('userTyping', callback);
  }

  /**
   * Listen for user joined
   */
  public onUserJoined(callback: (data: { userId: string; socketId: string; timestamp: Date }) => void): void {
    this.socket?.on('userJoined', callback);
  }

  /**
   * Listen for user left
   */
  public onUserLeft(callback: (data: { userId: string; socketId: string; timestamp: Date }) => void): void {
    this.socket?.on('userLeft', callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback?: SocketEventCallback): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Disconnect socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentProjectId = null;
      this.currentUserId = null;
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current project ID
   */
  public getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
