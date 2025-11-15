"use client"

import {  useEffect, useState } from "react"
import ProjectList from "@/components/project-list"
import ProjectDetail from "@/components/project-detail"
import ChatSection from "@/components/chat-section"
import { Button } from "@/components/ui/button"
import { ProjectMember, apiService } from "@/lib/api-service"

interface DashboardProps {
  user: { id: string; name: string; email: string }
  onLogout: () => void
}

interface Project {
  _id: string
  name: string
  description: string

}

const MOCK_PROJECTS: Project[] = [
  {
    _id: "1",
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX",

  },
  {
    _id: "2",
    name: "Mobile App Development",
    description: "Build cross-platform mobile application for iOS and Andro_id",

  },
  {
    _id: "3",
    name: "API Integration",
    description: "Integrate third-party payment gateway and analytics",

  },
]

const MOCK_USERS = [
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Mike Chen" },
  { id: "3", name: "Lisa Park" },
  { id: "4", name: "James Wilson" },
  { id: "5", name: "Emily Davis" },
  { id: "6", name: "Robert Brown" },
  { id: "7", name: "Alex Martinez" },
  { id: "8", name: "Tom Anderson" },
]

export default function Dashboard({ user, onLogout }: DashboardProps) {

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0])

  
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
            <p className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
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
          <div className="w-3/5 border-r border-border overflow-y-auto">
            <ProjectDetail project={selectedProject} />
          </div>

          {/* Chat Section - Pass projectId for project-based chat storage */}
          <div className="w-2/5 overflow-y-auto">
            <ChatSection
              projectId={selectedProject?._id}
              project={selectedProject}
              currentUser={user}
              allUsers={projectMembers}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
