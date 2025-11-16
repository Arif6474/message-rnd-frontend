# Real-Time Messaging & Notification System - Implementation Guide

## 🎯 Overview

This is a production-ready, scalable real-time messaging and notification system built with:

- **Socket.IO** for real-time WebSocket communication
- **Zustand** for state management with optimistic updates
- **TypeScript** for type safety
- **Next.js/React** for the frontend
- **Proper separation of concerns** and **singleton patterns**

---

## 📁 File Structure

```
message-rnd-frontend/
├── types/
│   └── message.ts                    # TypeScript interfaces
├── lib/
│   ├── socket.service.ts             # Singleton Socket.IO client
│   ├── message-api.service.ts        # Message API calls
│   ├── notification-api.service.ts   # Notification API calls
│   └── axios.ts                      # Configured axios instances
├── store/
│   ├── useMessageStore.ts            # Messages state management
│   └── useNotificationStore.ts       # Notifications state management
└── components/
    ├── chat-section-new.tsx          # Enhanced chat component
    ├── notification-bell.tsx         # Notification bell with badge
    ├── notification-panel.tsx        # Slide-out notification panel
    └── dashboard-new.tsx             # Integrated dashboard
```

---

## 🚀 Installation

### 1. Install Dependencies

```bash
cd message-rnd-frontend
pnpm install zustand socket.io-client date-fns lucide-react
```

### 2. Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 🔧 Integration Steps

### Step 1: Update `page.tsx`

Replace the old dashboard with the new one:

```typescript
// app/page.tsx
import DashboardNew from "@/components/dashboard-new";

// ... in the return statement
return user ? (
  <DashboardNew user={user} onLogout={handleLogout} />
) : (
  <LoginPage onLogin={handleLogin} />
);
```

### Step 2: Initialize Socket on Login

Update your login handler to connect the socket:

```typescript
import { socketService } from "@/lib/socket.service";

const handleLogin = (userData: { id: string; name: string; email: string }) => {
  setUser(userData);
  localStorage.setItem("currentUser", JSON.stringify(userData));

  // Initialize socket connection
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    socketService.connect(accessToken);
  }
};
```

### Step 3: Disconnect Socket on Logout

```typescript
const handleLogout = async () => {
  try {
    const { api } = await import("@/lib/api");
    await api.logout();

    // Disconnect socket
    socketService.disconnect();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
  }
};
```

---

## 🎨 Features

### ✅ Real-Time Messaging

- **Project-based chat rooms** (isolated per project)
- **@ Mentions** with autocomplete
- **Typing indicators**
- **Read receipts**
- **Optimistic updates** for instant UI feedback
- **Automatic reconnection** on disconnects
- **Message history** with pagination

### ✅ Notifications

- **Real-time notifications** via Socket.IO
- **Notification types**: Mention, New Project, New Member, etc.
- **Browser notifications** (when permission granted)
- **Unread count** badge
- **Mark as read/delete** actions
- **Filter by type** (all, unread, mention, etc.)
- **Infinite scroll** for loading more
- **Optimistic updates**

### ✅ State Management

- **Zustand stores** for messages and notifications
- **Optimistic updates** with rollback on error
- **Efficient re-renders** with selective subscriptions
- **Proper cleanup** on unmount

### ✅ Socket Management

- **Singleton pattern** - one connection for entire app
- **Auto-reconnect** with exponential backoff
- **Project room management** - join/leave automatically
- **Event cleanup** to prevent memory leaks
- **Error handling** and logging

---

## 📡 API Endpoints Used

### Messages

- `POST /messages` - Create message
- `GET /messages/project/:id` - Get project messages
- `GET /messages/project/:id/unread` - Get unread messages
- `PUT /messages/:id/read` - Mark as read
- `DELETE /messages/:id` - Delete message

### Notifications

- `GET /notifications` - Get notifications (with filters)
- `GET /notifications/unread/count` - Get unread count
- `GET /notifications/stats` - Get statistics
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

---

## 🔌 Socket.IO Events

### Client → Server

- `joinProject` - Join a project room
- `sendMessage` - Send a message
- `markAsRead` - Mark message as read
- `typing` - Send typing indicator

### Server → Client

- `projectMessages` - Initial messages on join
- `projectMembers` - Project members list
- `newMessage` - New message broadcast
- `notification` - New notification
- `messageRead` - Message read event
- `userTyping` - Typing indicator
- `userJoined` - User joined project
- `userLeft` - User left project

---

## 💡 Usage Examples

### Using Message Store

```typescript
import { useMessageStore } from "@/store/useMessageStore";

function ChatComponent({ projectId, userId }) {
  const { messages, loading, sendMessage, initializeSocket, cleanupSocket } =
    useMessageStore();

  useEffect(() => {
    initializeSocket(projectId, userId);
    return () => cleanupSocket();
  }, [projectId, userId]);

  const handleSend = (content: string) => {
    sendMessage(projectId, content, userId);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg._id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Using Notification Store

```typescript
import { useNotificationStore } from "@/store/useNotificationStore";

function NotificationBadge() {
  const { unreadCount, loadUnreadCount } = useNotificationStore();

  useEffect(() => {
    loadUnreadCount();
  }, []);

  return <span>{unreadCount}</span>;
}
```

---

## 🐛 Troubleshooting

### Socket not connecting

1. Check if `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend is running
3. Check browser console for errors
4. Ensure access token is valid

### Messages not updating

1. Check if socket is connected: `socketService.isConnected()`
2. Verify you've called `initializeSocket(projectId, userId)`
3. Check Network tab for WebSocket connection
4. Ensure backend is broadcasting events correctly

### Notifications not appearing

1. Check browser notification permission
2. Verify socket connection
3. Check if `initializeSocket()` was called in notification store
4. Inspect Network tab for API calls

---

## 🔐 Security Considerations

1. **Authentication**: Socket connection uses access token
2. **Authorization**: Backend verifies user is project member before joining
3. **XSS Protection**: All user content is properly escaped
4. **CSRF Protection**: Uses httpOnly cookies for refresh tokens
5. **Input Validation**: All inputs validated on both client and server

---

## 🚀 Performance Optimizations

1. **Singleton Socket**: One connection for entire app
2. **Optimistic Updates**: Instant UI feedback
3. **Pagination**: Load messages/notifications in batches
4. **Infinite Scroll**: Load more as user scrolls
5. **Selective Re-renders**: Zustand subscriptions only to needed state
6. **Event Cleanup**: Proper removal of listeners on unmount
7. **Debounced Typing**: Typing indicators use debounce

---

## 📝 Next Steps

1. **Replace old components**:

   - Rename `chat-section.tsx` to `chat-section-old.tsx`
   - Rename `chat-section-new.tsx` to `chat-section.tsx`
   - Similarly for `dashboard.tsx`

2. **Test the integration**:

   - Login with a user
   - Select a project
   - Send messages
   - Test @ mentions
   - Check notifications

3. **Customize styling** to match your design system

4. **Add error boundaries** for better error handling

5. **Add unit tests** for stores and components

---

## 📚 Additional Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Alternative](https://tanstack.com/query/latest) (if you want server state management)

---

## ✅ Testing Checklist

- [ ] Socket connects on login
- [ ] Socket disconnects on logout
- [ ] Can join a project
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] @ Mentions work with autocomplete
- [ ] Typing indicators appear
- [ ] Read receipts update
- [ ] Notifications appear in real-time
- [ ] Notification bell shows unread count
- [ ] Can mark notifications as read
- [ ] Can delete notifications
- [ ] Browser notifications work (if permitted)
- [ ] Socket reconnects after disconnect
- [ ] Optimistic updates work correctly
- [ ] Error handling works properly

---

## 🎉 Conclusion

You now have a production-ready, scalable messaging and notification system with:

- ✅ Real-time updates
- ✅ Optimistic UI
- ✅ Proper state management
- ✅ Type safety
- ✅ Error handling
- ✅ Clean architecture

Happy coding! 🚀
