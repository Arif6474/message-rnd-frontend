"use client"

import { useState, useEffect, useRef } from "react"
import { useMessageStore } from "@/store/useMessageStore"
import { socketService } from "@/lib/socket.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface ChatSectionProps {
  projectId: string
  currentUser: { id: string; name: string; email: string }
}

export default function ChatSection({ projectId, currentUser }: ChatSectionProps) {
  const {
    messages,
    projectMembers,
    typingUsers,
    loading,
    sendMessage,
    initializeSocket,
    cleanupSocket,
    loadMessages,
    markAsRead,
  } = useMessageStore()

  const [input, setInput] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<Array<{ id: string; name: string }>>([])
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize socket and load messages
  useEffect(() => {
    if (!projectId || !currentUser.id) return

    // Connect socket if not connected
    const accessToken = localStorage.getItem('accessToken')
    if (!socketService.isConnected()) {
      socketService.connect(accessToken || undefined)
    }

    // Wait a bit for socket to connect before joining
    const timer = setTimeout(() => {
      initializeSocket(projectId, currentUser.id)
      loadMessages(projectId)
    }, 500)

    return () => {
      clearTimeout(timer)
      cleanupSocket()
    }
  }, [projectId, currentUser.id])

  // Auto mark messages as read when they appear
  useEffect(() => {
    messages.forEach((message) => {
      if (
        message.sender._id !== currentUser.id &&
        !message.readBy.includes(currentUser.id)
      ) {
        markAsRead(message._id)
      }
    })
  }, [messages, currentUser.id])

  // Handle input change for mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    // Send typing indicator
    if (typingTimeout) clearTimeout(typingTimeout)
    
    socketService.sendTypingIndicator(projectId, true)
    
    const timeout = setTimeout(() => {
      socketService.sendTypingIndicator(projectId, false)
    }, 1000)
    
    setTypingTimeout(timeout)

    // Handle @mentions
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1)
      if (!afterAt.includes(" ")) {
        const users = projectMembers.map(m => ({
          id: m.user._id,
          name: `${m.user.firstName} ${m.user.lastName}`,
        }))
        
        const filtered = users.filter((user) =>
          user.name.toLowerCase().includes(afterAt.toLowerCase())
        )
        
        setFilteredUsers(filtered)
        setShowMentions(filtered.length > 0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const handleSelectMention = (user: { id: string; name: string }) => {
    const lastAtIndex = input.lastIndexOf("@")
    const newInput = input.substring(0, lastAtIndex) + `@${user.id} `
    setInput(newInput)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    await sendMessage(projectId, input, currentUser.id)
    setInput("")
    setShowMentions(false)
    
    // Stop typing indicator
    if (typingTimeout) clearTimeout(typingTimeout)
    socketService.sendTypingIndicator(projectId, false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Get typing users (exclude current user)
  const typingUsersList = Array.from(typingUsers.values())
    .filter(t => t.userId !== currentUser.id && t.isTyping)
    .map(t => {
      const member = projectMembers.find(m => m.user._id === t.userId)
      return member ? `${member.user.firstName} ${member.user.lastName}` : 'Someone'
    })

  // Format message content with mentions highlighted
  const formatMessageContent = (content: string) => {
    // Replace @userId with @Name
    return content.split(/(@[a-f0-9]{24})/g).map((part, idx) => {
      if (part.startsWith("@")) {
        const userId = part.substring(1)
        const member = projectMembers.find(m => m.user._id === userId)
        const name = member ? `${member.user.firstName} ${member.user.lastName}` : part
        
        return (
          <span
            key={idx}
            className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1 rounded font-medium"
          >
            @{name}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
        <h2 className="font-semibold text-foreground">Project Chat</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {projectMembers.length} {projectMembers.length === 1 ? 'member' : 'members'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender._id === currentUser.id
            const senderName = `${message.sender.firstName} ${message.sender.lastName}`
            
            return (
              <div key={message._id} className={`space-y-1 ${isOwnMessage ? 'text-right' : ''}`}>
                <div className="flex items-baseline gap-2 justify-between">
                  {!isOwnMessage && (
                    <span className="font-semibold text-sm text-foreground">{senderName}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                  {isOwnMessage && (
                    <span className="font-semibold text-sm text-foreground">You</span>
                  )}
                </div>
                <div
                  className={`inline-block max-w-[80%] px-3 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {formatMessageContent(message.content)}
                  </p>
                </div>
                {/* Read receipts */}
                {isOwnMessage && message.readBy.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Read by {message.readBy.length - 1}
                  </p>
                )}
              </div>
            )
          })
        )}
        
        {/* Typing indicator */}
        {typingUsersList.length > 0 && (
          <div className="text-sm text-muted-foreground italic">
            {typingUsersList.join(', ')} {typingUsersList.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative">
          {showMentions && filteredUsers.length > 0 && (
            <Card className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectMention(user)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary/50 text-sm text-foreground border-b border-border last:border-0"
                >
                  @{user.name}
                </button>
              ))}
            </Card>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type @ to mention someone..."
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={handleSendMessage} size="sm" disabled={!input.trim() || loading}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
