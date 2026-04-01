"use client"

import { useAuth } from "@/components/AuthProvider"
import { StudentDashboard } from "@/components/StudentDashboard"
import { TeacherDashboard } from "@/components/TeacherDashboard"
import { useState, useEffect } from "react"
import { Quiz } from "@/types"
import { db } from "@/utils/database"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  useEffect(() => {
    if (user) {
      loadQuizzes()
    }
  }, [user])

  const loadQuizzes = async () => {
    try {
      const loadedQuizzes = user?.role === "teacher"
        ? await db.getQuizzes(user.id, "teacher")
        : await db.getQuizzes(undefined, "student")
      setQuizzes(loadedQuizzes)
    } catch (error) {
      console.error("Failed to load quizzes:", error)
    }
  }

  if (!user) {
    return null
  }

  const handleViewChange = (view: string, quiz?: Quiz) => {
    switch (view) {
      case "take-quiz":
        if (quiz) router.push(`/dashboard/quizzes?view=take&id=${quiz.id}`)
        break
      case "results":
        if (quiz) router.push(`/dashboard/quizzes?view=results&id=${quiz.id}`)
        break
      case "courses":
        router.push("/dashboard/courses")
        break
      case "assignments":
        router.push("/dashboard/assignments")
        break
      case "analytics":
        router.push("/dashboard/analytics")
        break
      case "gradebook":
        router.push("/dashboard/gradebook")
        break
      case "messages":
        router.push("/dashboard/messages")
        break
      case "announcements":
        router.push("/dashboard/announcements")
        break
      case "scheduling":
        router.push("/dashboard/scheduling")
        break
      case "notifications":
        router.push("/dashboard/notifications")
        break
      case "create-quiz":
        router.push("/dashboard/quizzes?view=create")
        break
      case "edit-quiz":
        if (quiz) router.push(`/dashboard/quizzes?view=edit&id=${quiz.id}`)
        break
      case "quizzes":
        router.push("/dashboard/quizzes")
        break
      default:
        console.warn(`Unknown view: ${view}`)
    }
  }

  return user.role === "student" ? (
    <StudentDashboard user={user} quizzes={quizzes} onLogout={logout} onViewChange={handleViewChange} />
  ) : (
    <TeacherDashboard
      user={user}
      quizzes={quizzes}
      onLogout={logout}
      onViewChange={handleViewChange}
      onQuizzesUpdate={loadQuizzes}
    />
  )
}
