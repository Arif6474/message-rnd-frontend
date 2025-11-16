import { create } from 'zustand';
import type { Message, ProjectMember, TypingIndicator } from '@/types/message';
import { messageApi } from '@/lib/message-api.service';
import { socketService } from '@/lib/socket.service';

interface MessageState {
  // State
  messages: Message[];
  projectMembers: ProjectMember[];
  typingUsers: Map<string, TypingIndicator>;
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  totalMessages: number;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  setProjectMembers: (members: ProjectMember[]) => void;
  addTypingUser: (userId: string, indicator: TypingIndicator) => void;
  removeTypingUser: (userId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  loadMessages: (projectId: string, page?: number) => Promise<void>;
  sendMessage: (projectId: string, content: string, userId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Socket Actions
  initializeSocket: (projectId: string, userId: string) => void;
  cleanupSocket: () => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  messages: [],
  projectMembers: [],
  typingUsers: new Map<string, TypingIndicator>(),
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  totalMessages: 0,
};

export const useMessageStore = create<MessageState>((set, get) => ({
  ...initialState,

  // === SETTERS ===
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // Prevent duplicates
    const exists = state.messages.some(m => m._id === message._id);
    if (exists) return state;
    
    return {
      messages: [...state.messages, message],
      totalMessages: state.totalMessages + 1,
    };
  }),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(m =>
      m._id === messageId ? { ...m, ...updates } : m
    ),
  })),
  
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m._id !== messageId),
    totalMessages: state.totalMessages - 1,
  })),
  
  setProjectMembers: (members) => set({ projectMembers: members }),
  
  addTypingUser: (userId, indicator) => set((state) => {
    const newTypingUsers = new Map(state.typingUsers);
    newTypingUsers.set(userId, indicator);
    return { typingUsers: newTypingUsers };
  }),
  
  removeTypingUser: (userId) => set((state) => {
    const newTypingUsers = new Map(state.typingUsers);
    newTypingUsers.delete(userId);
    return { typingUsers: newTypingUsers };
  }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // === API ACTIONS ===
  loadMessages: async (projectId, page = 1) => {
    const state = get();
    if (state.loading) return;

    set({ loading: true, error: null });
    
    try {
      const response = await messageApi.getProjectMessages(projectId, { page, limit: 50 });
      
      // Reverse to show oldest first
      const sortedMessages = response.messages.reverse();
      
      set({
        messages: page === 1 ? sortedMessages : [...sortedMessages, ...state.messages],
        currentPage: page,
        hasMore: response.pagination.page < response.pagination.totalPages,
        totalMessages: response.pagination.total,
        loading: false,
      });
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      set({
        error: error.message || 'Failed to load messages',
        loading: false,
      });
    }
  },

  sendMessage: async (projectId, content, userId) => {
    try {
      // Optimistic update
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: { _id: userId, firstName: '', lastName: '', email: '' },
        project: projectId,
        content,
        readBy: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      get().addMessage(optimisticMessage);
      
      // Send via socket (server will broadcast back with real ID)
      socketService.sendMessage(projectId, content, userId);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      set({ error: error.message || 'Failed to send message' });
    }
  },

  markAsRead: async (messageId) => {
    try {
      // Optimistic update
      const userId = localStorage.getItem('currentUserId') || '';
      get().updateMessage(messageId, {
        readBy: [...(get().messages.find(m => m._id === messageId)?.readBy || []), userId],
      });
      
      // Send to server
      socketService.markMessageAsRead(messageId);
      await messageApi.markMessageAsRead(messageId);
    } catch (error: any) {
      console.error('Failed to mark message as read:', error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      // Optimistic update
      get().removeMessage(messageId);
      
      await messageApi.deleteMessage(messageId);
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      set({ error: error.message || 'Failed to delete message' });
    }
  },

  // === SOCKET ACTIONS ===
  initializeSocket: (projectId, userId) => {
    const socket = socketService;
    
    console.log('🔌 Initializing socket for project:', projectId, 'user:', userId);
    
    // Join project
    socket.joinProject(projectId, userId);
    
    // Listen for initial messages
    socket.onProjectMessages((messages) => {
      console.log('📨 Received projectMessages:', messages.length, 'messages');
      set({ messages: messages.reverse() }); // Oldest first
    });
    
    // Listen for project members
    socket.onProjectMembers((members) => {
      console.log('👥 Received projectMembers:', members.length, 'members');
      console.log('Members data:', members);
      set({ projectMembers: members });
    });
    
    // Listen for new messages
    socket.onNewMessage((message) => {
      console.log('💬 Received newMessage:', message);
      get().addMessage(message);
    });
    
    // Listen for message read events
    socket.onMessageRead(({ messageId, userId }) => {
      const state = get();
      const message = state.messages.find(m => m._id === messageId);
      if (message && !message.readBy.includes(userId)) {
        get().updateMessage(messageId, {
          readBy: [...message.readBy, userId],
        });
      }
    });
    
    // Listen for typing indicators
    socket.onUserTyping((data) => {
      if (data.isTyping) {
        get().addTypingUser(data.userId, data);
      } else {
        get().removeTypingUser(data.userId);
      }
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        get().removeTypingUser(data.userId);
      }, 3000);
    });
  },

  cleanupSocket: () => {
    socketService.leaveProject();
    socketService.off('projectMessages');
    socketService.off('projectMembers');
    socketService.off('newMessage');
    socketService.off('messageRead');
    socketService.off('userTyping');
  },

  // === RESET ===
  reset: () => set(initialState),
}));
