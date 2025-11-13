"use client"

import { Card } from "@/components/ui/card"

interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "pending"
  lead: string
  members: string[]
  createdAt: string
}

interface ProjectListProps {
  projects: Project[]
  selectedId: string
  onSelect: (project: Project) => void
}

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

export default function ProjectList({ projects, selectedId, onSelect }: ProjectListProps) {
  return (
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-semibold text-foreground mb-4 px-2">Projects</h2>
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedId === project.id ? "bg-primary/10 border-primary" : "hover:bg-secondary/50"
          }`}
          onClick={() => onSelect(project)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-foreground text-sm">{project.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Lead: {project.lead}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
