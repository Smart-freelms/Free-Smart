"use client"

import { useAuth } from "@/components/AuthProvider"
import { AssignmentList } from "@/components/AssignmentList"
import { AssignmentCreator } from "@/components/AssignmentCreator"
import { AssignmentSubmission } from "@/components/AssignmentSubmission"
import { GradingInterface } from "@/components/GradingInterface"
import { useState } from "react"
import { Assignment } from "@/types"
import { useRouter } from "next/navigation"

export default function AssignmentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<"list" | "create" | "edit" | "submit" | "grade">("list")
  const [editAssignmentId, setEditAssignmentId] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [editCourseId, setEditCourseId] = useState<string | null>(null)

  if (!user) return null

  if (view === "create" || view === "edit") {
    return <AssignmentCreator user={user} courseId={editCourseId || undefined} editAssignmentId={editAssignmentId} onBack={() => setView("list")} />
  }

  if (view === "submit" && selectedAssignment) {
    return <AssignmentSubmission user={user} assignment={selectedAssignment} onBack={() => setView("list")} />
  }

  if (view === "grade" && selectedAssignment) {
    return <GradingInterface user={user} assignment={selectedAssignment} onBack={() => setView("list")} />
  }

  return (
    <div>
      <AssignmentList
        user={user}
        onCreateAssignment={(courseId) => {
          setEditCourseId(courseId || null)
          setView("create")
        }}
        onEditAssignment={(id) => {
          setEditAssignmentId(id)
          setView("edit")
        }}
        onViewAssignment={(assignment) => {
          setSelectedAssignment(assignment)
          setView(user.role === "student" ? "submit" : "grade")
        }}
      />
    </div>
  )
}
