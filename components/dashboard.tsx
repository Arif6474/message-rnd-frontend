"use client"

import { useState, useEffect } from "react"
import NotificationBell from "@/components/notification-bell"
import NotificationPanel from "@/components/notification-panel"
import ProjectList from "@/components/project-list"
import ProjectDetail from "@/components/project-detail"
import ChatSection from "@/components/chat-section"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { apiService } from "@/lib/api-service"

interface DashboardProps {
  user: { id: string; name: string; email: string }
  onLogout: () => void
}

interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "pending"
  lead: string
  members: string[]
  createdAt: string
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  // Fetch real projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        console.log('🔍 Fetching projects from API...');
        const response = await apiService.project.getProjects()
        console.log('📁 API Response:', response);
        
        if (response.projects && response.projects.length > 0) {
          console.log(`✅ Got ${response.projects.length} projects from API`);
          console.log('First project:', response.projects[0]);
          setProjects(response.projects)
          setSelectedProject(response.projects[0])
        } else {
          console.warn('⚠️ No projects returned from API');
          setProjects([])
          setSelectedProject(null)
        }
      } catch (error) {
        console.error("❌ Error fetching projects:", error)
        setProjects([])
        setSelectedProject(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 border-r border-border flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Projects</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs">{user.email}</p>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-hidden">
          <ProjectList 
            projects={projects} 
            selectedId={selectedProject?.id || ""} 
            onSelect={setSelectedProject} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold">
              {selectedProject ? selectedProject.name : "Select a project"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
            <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-muted-foreground mb-2">
                  No Projects Found
                </h3>
                <p className="text-muted-foreground">
                  You don't have access to any projects yet.
                </p>
              </div>
            </div>
          ) : selectedProject ? (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {/* Project Details */}
              <div className="overflow-hidden">
                <ProjectDetail project={selectedProject} />
              </div>

              {/* Chat Section */}
              <div className="overflow-hidden">
                <ChatSection projectId={selectedProject.id} currentUser={user} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-muted-foreground mb-2">
                  No Project Selected
                </h3>
                <p className="text-muted-foreground">
                  Select a project from the sidebar to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
    </div>
  )
}
