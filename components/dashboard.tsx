"use client"

import {  useEffect, useState } from "react"
import ProjectList from "@/components/project-list"
import ProjectDetail from "@/components/project-detail"
import ChatSection from "@/components/chat-section"
import { Button } from "@/components/ui/button"
import axios from "axios"

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
  const [selectedProject, setSelectedProject] = useState<Project>(MOCK_PROJECTS[0])
  console.log(projects)
  

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await axios.get("http://localhost:5001/api/v1/projects",
        
      );
      setProjects(response.data);
    };
    fetchProjects();
  }, []);


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
            <Button variant="outline" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Projects Sidebar */}
        <div className="w-full md:w-[30%] border-r border-border bg-secondary/30 overflow-y-auto">
          <ProjectList projects={MOCK_PROJECTS} selectedId={selectedProject.id} onSelect={setSelectedProject} />
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
              projectId={selectedProject.id}
              project={selectedProject}
              currentUser={user}
              allUsers={MOCK_USERS}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
