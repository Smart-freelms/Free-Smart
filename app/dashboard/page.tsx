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
      const loadedQuizzes = user?.role === "teacher" ? await db.getQuizzes(user.id) : await db.getQuizzes()
      setQuizzes(loadedQuizzes)
    } catch (error) {
      console.error("Failed to load quizzes:", error)
    }
  }

  if (!user) {
    return null
  }

  const handleViewChange = (view: string, quiz?: Quiz) => {
    if (view === 'take-quiz' && quiz) {
      router.push(`/dashboard/quizzes?view=take&id=${quiz.id}`)
    } else if (view === 'results' && quiz) {
      router.push(`/dashboard/quizzes?view=results&id=${quiz.id}`)
    } else if (view === 'courses') {
      router.push('/dashboard/courses')
    } else if (view === 'assignments') {
      router.push('/dashboard/assignments')
    } else if (view === 'analytics') {
      router.push('/dashboard/analytics')
    } else if (view === 'gradebook') {
      router.push('/dashboard/gradebook')
    } else if (view === 'messages') {
      router.push('/dashboard/messages')
    } else if (view === 'announcements') {
      router.push('/dashboard/announcements')
    } else if (view === 'scheduling') {
      router.push('/dashboard/scheduling')
    } else if (view === 'notifications') {
      router.push('/dashboard/notifications')
    } else if (view === 'create-quiz') {
      router.push('/dashboard/quizzes?view=create')
    } else if (view === 'edit-quiz' && quiz) {
      router.push(`/dashboard/quizzes?view=edit&id=${quiz.id}`)
    }
  }

  return user.role === "student" ? (
    <StudentDashboard user={user} quizzes={quizzes} onLogout={logout} onViewChange={handleViewChange as any} />
  ) : (
    <TeacherDashboard
      user={user}
      quizzes={quizzes}
      onLogout={logout}
      onViewChange={handleViewChange as any}
      onQuizzesUpdate={loadQuizzes}
    />
  )
}
