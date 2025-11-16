"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface User {
  id: string
  name: string
}

interface Message {
  id: string
  author: string
  content: string
  mentions: string[]
  timestamp: string
}

interface ChatSectionProps {
  projectId: string
  project: { id: string; name: string; members: string[] }
  currentUser: { id: string; name: string; email: string }
  allUsers: User[]
}

export default function ChatSection({ projectId, project, currentUser, allUsers }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const storageKey = `project-chat-${projectId}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
    // Default messages for new projects
    return [
      {
        id: "1",
        author: "Sarah Johnson",
        content: "Great progress on the design today!",
        mentions: [],
        timestamp: "10:30 AM",
      },
      {
        id: "2",
        author: "Mike Chen",
        content: "@Sarah Johnson Let's review it in the afternoon standup",
        mentions: ["Sarah Johnson"],
        timestamp: "10:35 AM",
      },
    ]
  })

  const [input, setInput] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [mentionSearch, setMentionSearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const storageKey = `project-chat-${projectId}`
    localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, projectId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1)
      if (!afterAt.includes(" ")) {
        setMentionSearch(afterAt)
        const filtered = allUsers.filter((user) => user.name.toLowerCase().includes(afterAt.toLowerCase()))
        setFilteredUsers(filtered)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const handleSelectMention = (user: User) => {
    const lastAtIndex = input.lastIndexOf("@")
    const newInput = input.substring(0, lastAtIndex) + "@" + user.name + " "
    setInput(newInput)
    setShowMentions(false)
    setMentionSearch("")
  }

  const handleSendMessage = () => {
    if (!input.trim()) return

    const mentionedUsers = allUsers.filter((user) => input.includes("@" + user.name)).map((user) => user.name)

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      author: currentUser.name,
      content: input,
      mentions: mentionedUsers,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setInput("")
    setShowMentions(false)
  }

  const uniqueParticipants = new Set(messages.map((m) => m.author))

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card sticky top-0">
        <h2 className="font-semibold text-foreground">Project Chat</h2>
        <p className="text-xs text-muted-foreground mt-1">{uniqueParticipants.size} participants</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm text-foreground">{message.author}</span>
              <span className="text-xs text-muted-foreground">{message.timestamp}</span>
            </div>
            <p className="text-sm text-foreground pl-0 break-words">
              {message.content.split(/(@\w+)/g).map((part, idx) => {
                if (part.startsWith("@")) {
                  return (
                    <span key={idx} className="text-primary font-medium">
                      {part}
                    </span>
                  )
                }
                return part
              })}
            </p>
            {message.mentions.length > 0 && (
              <p className="text-xs text-muted-foreground">Mentioned: {message.mentions.join(", ")}</p>
            )}
          </div>
        ))}
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
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Type @ to mention someone..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="sm">
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
