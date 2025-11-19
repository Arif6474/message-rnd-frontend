"use client"

import { useEffect, useState } from "react"
import ProjectList from "@/components/project-list"
import ProjectDetail from "@/components/project-detail"
import ChatSection from "@/components/chat-section"
import { Button } from "@/components/ui/button"
import { ProjectMember, apiService } from "@/lib/api-service"

interface DashboardProps {
  user: { id: string; firstName: string; lastName: string; email: string; username?: string }
  onLogout: () => void
}

interface Project {
  _id: string
  name: string
  description: string

}


export default function Dashboard({ user, onLogout }: DashboardProps) {


  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0])
  const [notifications, setNotifications] = useState<string[]>([]);

  // Log notifications state changes
  useEffect(() => {
    console.log("📋 [Dashboard] Notifications state updated:", notifications);
    console.log("📋 [Dashboard] Notification count:", notifications.length);
  }, [notifications]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);


  const handleLogout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      onLogout();
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiService.project.getProjects();

        setProjects(response.projects || [])
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const response = await apiService.projectMember.getProjectMembers(selectedProject?._id);

        setProjectMembers(response || [])
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    if (selectedProject) {


      fetchProjectMembers();
    }
  }, [selectedProject]);


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome, {user.firstName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.firstName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Projects Sidebar */}
        <div className="w-full md:w-[30%] border-r border-border bg-secondary/30 overflow-y-auto">
          <ProjectList projects={projects} selectedId={selectedProject?._id} onSelect={setSelectedProject} />
        </div>

        {/* Two Column Layout: Project Details (60%) and Chat (40%) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Project Details */}
          <div className="w-3/5 border-r border-border overflow-y-auto relative">
            {/* <ProjectDetail project={selectedProject} /> */}
            {/* Debug: Always show notification count */}
            <div className="p-2 text-xs text-gray-500">
              Debug: {notifications.length} notification(s) in state
            </div>
            
            {notifications.length > 0 ? (
              <div className="sticky top-0 z-50 p-4 bg-yellow-500 text-white shadow-lg border-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">🔔 Notifications ({notifications.length})</h3>
                  <button
                    onClick={() => {
                      console.log("📋 [Dashboard] Clearing notifications");
                      setNotifications([]);
                    }}
                    className="text-white hover:text-gray-200 font-bold text-2xl px-2"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.map((notif, idx) => (
                    <div key={idx} className="p-3 bg-yellow-600 rounded text-sm border border-yellow-700">
                      {notif}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-gray-400 text-sm">
                No notifications yet. Waiting for mentions...
              </div>
            )}
          </div>

          {/* Chat Section - Pass projectId for project-based chat storage */}
          <div className="w-2/5 overflow-y-auto">
            <ChatSection
              projectId={selectedProject?._id}
              currentUser={user}
              apiBaseUrl={apiBaseUrl}
              notifications={notifications}
              setNotifications={setNotifications}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
