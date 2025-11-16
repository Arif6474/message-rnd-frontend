"use client"

import { useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotificationStore } from "@/store/useNotificationStore"
import { socketService } from "@/lib/socket.service"

interface NotificationBellProps {
  onClick: () => void
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount, loadUnreadCount, initializeSocket, cleanupSocket } = useNotificationStore()

  useEffect(() => {
    // Initialize socket for notifications
    const accessToken = localStorage.getItem('accessToken')
    if (!socketService.isConnected()) {
      socketService.connect(accessToken || undefined)
    }

    initializeSocket()
    loadUnreadCount()

    // Poll for unread count every 30 seconds as backup
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => {
      clearInterval(interval)
      cleanupSocket()
    }
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  )
}
