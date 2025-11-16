"use client"

import { useEffect, useRef, useCallback } from "react"
import { X, Check, CheckCheck, Trash2, Bell, MessageSquare, Users, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotificationStore } from "@/store/useNotificationStore"
import { formatDistanceToNow } from "date-fns"
import type { Notification } from "@/types/message"

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

const notificationIcons = {
  mention: MessageSquare,
  new_project: FolderPlus,
  new_member: Users,
  project_update: Bell,
  message: MessageSquare,
}

const notificationColors = {
  mention: "text-blue-500",
  new_project: "text-green-500",
  new_member: "text-purple-500",
  project_update: "text-orange-500",
  message: "text-blue-500",
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notifications,
    loading,
    hasMore,
    filter,
    currentPage,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilter,
  } = useNotificationStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Load notifications on mount and filter change
  useEffect(() => {
    if (isOpen) {
      loadNotifications(1)
    }
  }, [isOpen, filter])

  // Infinite scroll
  useEffect(() => {
    if (!isOpen || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadNotifications(currentPage + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [isOpen, hasMore, loading, currentPage])

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId)
  }, [markAsRead])

  const handleDelete = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId)
  }, [deleteNotification])

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead()
  }, [markAllAsRead])

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      handleMarkAsRead(notification._id)
    }

    // Navigate to relevant page if there's a reference
    if (notification.referenceProject) {
      // TODO: Navigate to project page
      console.log('Navigate to project:', notification.referenceProject._id)
    }
  }, [handleMarkAsRead])

  const renderNotification = (notification: Notification) => {
    const Icon = notificationIcons[notification.type]
    const iconColor = notificationColors[notification.type]

    return (
      <div
        key={notification._id}
        className={`group relative p-4 border-b border-border hover:bg-secondary/50 transition-colors ${
          !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
        }`}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => handleNotificationClick(notification)}
              className="text-left w-full"
            >
              <p className="text-sm text-foreground break-words">{notification.content}</p>
              
              {notification.referenceProject && (
                <p className="text-xs text-muted-foreground mt-1">
                  Project: {notification.referenceProject.name}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </button>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleMarkAsRead(notification._id)}
                title="Mark as read"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => handleDelete(notification._id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
          {(['all', 'unread', 'mention', 'new_project', 'new_member'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className="whitespace-nowrap"
            >
              {filterOption.replace('_', ' ').charAt(0).toUpperCase() + filterOption.replace('_', ' ').slice(1)}
            </Button>
          ))}
        </div>

        {/* Actions */}
        {notifications.some(n => !n.isRead) && (
          <div className="p-3 border-b border-border bg-secondary/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="w-full justify-start"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea ref={scrollRef} className="flex-1">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 px-4">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm text-center">
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              {notifications.map(renderNotification)}
              
              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={observerTarget} className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Loading more...</p>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>
    </>
  )
}
