"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import socket from "@/socket";

// Types
interface User {
  id: string;
  name: string;
}

interface Message {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  content: string;
  createdAt: string;

}

interface ProjectMember {
  user: User;
}

interface ChatSectionProps {
  projectId: string;
  project: { _id: string; name: string };
  currentUser: { id: string; name: string; email: string };
  allUsers?: ProjectMember[];
}

export default function ChatSection({
  projectId,
  project,
  currentUser,
  allUsers,
}: ChatSectionProps) {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState<boolean>(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [mentionSearch, setMentionSearch] = useState<string>("");
console.log(messages)

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.emit("joinProject", projectId, currentUser.id);
  
    // ✅ Receive full history when joining project
    socket.on("projectMessages", (msgs: Message[]) => {
      setMessages(msgs);
    });
  
    // Real-time new messages
    socket.on("newMessage", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });
  
    socket.on("mentionNotification", (data: { message: string }) => {
      setNotification(data.message);
      alert(data.message);
    });
  
    return () => {
      socket.off("projectMessages");
      socket.off("newMessage");
      socket.off("mentionNotification");
    };
  }, [projectId, currentUser.id]);
  

  useEffect(() => scrollToBottom(), [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setMentionSearch(afterAt);
        const filtered = allUsers
          ? allUsers.filter((user) =>
              user?.user?.name.toLowerCase().includes(afterAt.toLowerCase())
            )
          : [];
        setFilteredUsers(filtered);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (user: User) => {
    const lastAtIndex = message.lastIndexOf("@");
    const newMessage = message.substring(0, lastAtIndex) + "@" + user.name + " ";
    setMessage(newMessage);
    setShowMentions(false);
    setMentionSearch("");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      projectId,
      message,
      userId: currentUser.id,
    });

    // Add optimistic message locally (optional)
    // setMessages((prev) => [
    //   ...prev,
    //   {
    //     _id: Math.random().toString(36).substr(2, 9),
    //     author: currentUser.name,
    //     content: message,
    //     mentions: [],
    //     timestamp: new Date().toISOString(),
    //   },
    // ]);

    setMessage(""); // clear after send
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card sticky top-0">
        <h2 className="font-semibold text-foreground">{project?.name}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {allUsers?.length || 0} participants
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg._id} className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm text-foreground">
                {msg?.user?.firstName} {msg?.user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(msg?.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-foreground break-words">
              {msg?.content?.split(/(@\w+)/g).map((part, idx) =>
                part.startsWith("@") ? (
                  <span key={idx} className="text-primary font-medium">
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative">
          {showMentions && filteredUsers.length > 0 && (
            <Card className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto z-50">
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
              value={message}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
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
  );
}
