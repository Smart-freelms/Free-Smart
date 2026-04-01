"use client"

import { useAuth } from "@/components/AuthProvider"
import { CourseList } from "@/components/CourseList"
import { CourseCreator } from "@/components/CourseCreator"
import { MaterialViewer } from "@/components/MaterialViewer"
import { useState } from "react"
import type { Course } from "@/types"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function CoursesPage() {
  const { user } = useAuth()
  const [view, setView] = useState<"list" | "create" | "edit" | "materials">("list")
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  if (!user) return null

  if (view === "create" || view === "edit") {
    return <CourseCreator user={user} editCourseId={editCourseId} onBack={() => setView("list")} />
  }

  if (view === "materials" && selectedCourse) {
    return <MaterialViewer user={user} courseId={selectedCourse.id} onBack={() => setView("list")} />
  }

  return (
    <DashboardLayout title="Manage Courses" subtitle="Create and manage your learning content">
      <CourseList
        user={user}
        onCreateCourse={() => setView("create")}
        onEditCourse={(id) => {
          setEditCourseId(id)
          setView("edit")
        }}
        onViewCourse={(course) => {
          setSelectedCourse(course)
          setView("materials")
        }}
      />
    </DashboardLayout>
  )
}
