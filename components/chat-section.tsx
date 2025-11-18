"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import socket from "@/socket";
import { subscribeUserToPush } from "./PushNotification";

interface User {
  _id: string; // MongoDB ObjectId
  firstName: string;
  lastName: string;
  email: string;
  username: string; // Add username for mention purposes
}

interface ProjectMember {
  _id: string;
  user: User;
  project: string;
}

interface Message {
  _id: string;
  user: User;
  content: string;
  createdAt: string;
}

interface ChatSectionProps {
  projectId: string;
  apiBaseUrl: string;
  currentUser: { id: string; firstName: string; lastName: string; email: string; username: string };
  notifications: string[];
  setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
}

const PAGE_SIZE = 10;

export default function ChatSection({
  projectId,
  apiBaseUrl,
  currentUser,
  notifications,
  setNotifications
}: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]); // Store project members
  const [showMentions, setShowMentions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<ProjectMember[]>([]);
  const [mentionSearch, setMentionSearch] = useState("");


  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // ------------- FETCH MESSAGES (REST API) -------------
  const fetchMessages = async (extraSkip = 0) => {
    try {
      const res = await fetch(
        `${apiBaseUrl}/messages/projects/${projectId}/messages?skip=${extraSkip}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (!data.success) return;

      if (extraSkip === 0) setMessages(data.data);
      else if (data.data.length === 0) setHasMore(false);
      else setMessages((prev) => [...data.data, ...prev]);
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  // ------------- INITIAL LOAD & HANDLING PROJECT CHANGE -------------
  useEffect(() => {
    // Reset messages when projectId changes
    setMessages([]);
    setSkip(0);
    setHasMore(true);

    // Fetch new messages for the new project
    fetchMessages();

    socket.emit("joinProject", projectId, currentUser.id);

    // Fetch project members when the project changes
    socket.on("projectMembers", (members: ProjectMember[]) => {
      setProjectMembers(members);
    });

    socket.on("projectMessages", (msgs: Message[]) => setMessages(msgs));

    socket.on("newMessage", (msg: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
      scrollToBottom();
    });

    // Listen for mention notifications
    socket.on("mentionNotification", (data) => {
      console.log(data, 'mentionNotification');
      setNotifications((prevNotifications) => [...prevNotifications, data.message]);
    });

    return () => {
      socket.off("projectMembers");
      socket.off("projectMessages");
      socket.off("newMessage");
      socket.off("mentionNotification");
    };
  }, [projectId]); // Effect will re-run when projectId changes

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  // ------------- INFINITE SCROLL HANDLER -------------
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || loadingOlder || !hasMore) return;
    if (el.scrollTop === 0) {
      setLoadingOlder(true);
      const newSkip = skip + PAGE_SIZE;
      fetchMessages(newSkip).finally(() => {
        setSkip(newSkip);
        setLoadingOlder(false);
      });
    }
  };

  // ------------- SEND MESSAGE -------------
  const handleSend = () => {
    if (!message.trim()) return;

    const tempMsg: Message = {
      _id: Math.random().toString(36).substring(2),
      user: {
        _id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        username: currentUser.username, // Include username in the message
      },
      content: message,
      createdAt: new Date().toISOString(),
    };


    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    socket.emit("sendMessage", {
      projectId,
      message: message.trim(),
      userId: currentUser.id,
      username: currentUser.username, // Pass the username to the backend
    });

    setMessage("");
  };

  // ------------- HANDLE MENTION SEARCH -------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setMentionSearch(afterAt);
        const filtered = projectMembers.filter((user) =>
          user.user.username.toLowerCase().includes(afterAt.toLowerCase())
        );
        setFilteredUsers(filtered);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  useEffect(() => {
    if (currentUser.id) {
      console.log("currentUser.id", currentUser.id);
      
      subscribeUserToPush(currentUser.id);
    }
  }, [currentUser.id]);


  const handleSelectMention = (user: User) => {
    const lastAtIndex = message.lastIndexOf("@");
    const newMessage =
      message.substring(0, lastAtIndex) + "@" + user.username + " "; // Use username for mention
    setMessage(newMessage);
    setShowMentions(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {loadingOlder && (
          <p className="text-center text-xs text-muted-foreground">
            Loading older messages...
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">
                {msg?.user?.firstName} {msg?.user?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <p className="text-sm text-gray-700">{msg.content}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Mention search */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto z-50">
          {filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelectMention(user.user)}
              className="w-full text-left px-3 py-2 hover:bg-secondary/50 text-sm text-foreground border-b border-border last:border-0"
            >
              @{user.user.username}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex p-3 border-t gap-2 bg-white">
        <Input
          value={message}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
        />
        <Button onClick={handleSend}>Send</Button>
      </div>

    </div>
  );
}
