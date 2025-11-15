"use client"

import { Card } from "@/components/ui/card"

interface Project {
  _id: string
  name: string
  description: string

}

interface ProjectDetailProps {
  project: Project
}

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">{project?.name}</h1>
       
        </div>
        <p className="text-muted-foreground text-lg">{project?.description}</p>
      </div>

      {/* Project Info */}
      <Card className="p-4 bg-secondary/30 border-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Project Lead</p>

          </div>

        </div>
      </Card>

      {/* Team Members */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Team Members</h2>
        <div className="space-y-2">
       
        </div>
      </div>

      {/* Updates Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Updates</h2>
        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Yesterday at 2:30 PM</p>
            <p className="text-foreground">Completed initial wireframes and design mockups</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">2 days ago</p>
            <p className="text-foreground">Assigned tasks to development team</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">1 week ago</p>
            <p className="text-foreground">Project kickoff meeting completed</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
