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

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX",
    status: "active",
    lead: "Sarah Johnson",
    members: ["Sarah Johnson", "Mike Chen", "Lisa Park"],
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Build cross-platform mobile application for iOS and Android",
    status: "active",
    lead: "James Wilson",
    members: ["James Wilson", "Emily Davis", "Robert Brown"],
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "API Integration",
    description: "Integrate third-party payment gateway and analytics",
    status: "pending",
    lead: "Alex Martinez",
    members: ["Alex Martinez", "Tom Anderson"],
    createdAt: "2024-03-10",
  },
]

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [selectedProject, setSelectedProject] = useState<Project | null>(MOCK_PROJECTS[0])
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Fetch real projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiService.project.getProjects()
        if (response.projects && response.projects.length > 0) {
          setProjects(response.projects)
          setSelectedProject(response.projects[0])
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
        // Fall back to mock data
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
          {selectedProject ? (
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
