"use client"

import { useAuth } from "@/components/AuthProvider"
import { CourseList } from "@/components/CourseList"
import { CourseCreator } from "@/components/CourseCreator"
import { MaterialViewer } from "@/components/MaterialViewer"
import { useState } from "react"
import { Course } from "@/types"
import { useRouter } from "next/navigation"

export default function CoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<"list" | "create" | "edit" | "materials">("list")
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  if (!user) return null

  if (view === "create" || view === "edit") {
    return <CourseCreator user={user} editCourseId={editCourseId} onBack={() => setView("list")} />
  }

  if (view === "materials" && selectedCourse) {
    return <MaterialViewer user={user} course={selectedCourse} onBack={() => setView("list")} />
  }

  return (
    <div>
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
    </div>
  )
}
