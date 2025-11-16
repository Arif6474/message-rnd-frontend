"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import Dashboard from "@/components/dashboard"
import { socketService } from "@/lib/socket.service"

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      
      // Initialize socket if user is already logged in
      const accessToken = localStorage.getItem("accessToken")
      if (accessToken) {
        socketService.connect(accessToken)
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData: { id: string; name: string; email: string }) => {
    setUser(userData)
    localStorage.setItem("currentUser", JSON.stringify(userData))
    
    // Initialize socket connection after login
    const accessToken = localStorage.getItem("accessToken")
    if (accessToken) {
      socketService.connect(accessToken)
    }
  }

  const handleLogout = async () => {
    try {
      // Import the api client dynamically to avoid issues
      const { api } = await import("@/lib/api")
      await api.logout()
      
      // Disconnect socket
      socketService.disconnect()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      localStorage.removeItem("currentUser")
      localStorage.removeItem("accessToken")
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />
}
