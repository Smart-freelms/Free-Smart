"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Quiz, QuizAttempt } from "../types"
import {
  Plus,
  Book,
  Users,
  Eye,
  BarChart3,
  BookOpen,
  FileText,
  Award,
  Megaphone,
  Mail,
  Calendar,
  Bell,
} from "lucide-react"
import { db } from "../utils/database"
import { StatCard, StatCardsGrid } from "./dashboard/StatCards"
import { QuickAction, QuickActionsContainer } from "./dashboard/QuickActions"
import { WelcomeSection } from "./dashboard/WelcomeSection"
import { DashboardHeader } from "./dashboard/DashboardHeader"

interface TeacherDashboardProps {
  user: User
  quizzes: Quiz[]
  onLogout: () => void
  onViewChange: (view: string, quiz?: Quiz, editId?: string) => void
  onQuizzesUpdate: () => void
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  quizzes,
  onLogout,
  onViewChange,
  onQuizzesUpdate,
}) => {
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllAttempts()
  }, [quizzes])

  const loadAllAttempts = async () => {
    try {
      const attempts: QuizAttempt[] = []
      for (const quiz of quizzes) {
        const quizAttempts = await db.getQuizAttempts(quiz.id)
        attempts.push(...quizAttempts)
      }
      setAllAttempts(attempts)
    } catch (error) {
      console.error("Failed to load attempts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStats = () => {
    const totalQuizzes = quizzes.length
    const publishedQuizzes = quizzes.filter((q) => q.isPublished).length
    const totalStudents = [...new Set(allAttempts.map((a) => a.userId))].length
    const totalAttempts = allAttempts.length

    return {
      totalQuizzes,
      publishedQuizzes,
      totalStudents,
      totalAttempts,
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      try {
        await db.deleteQuiz(quizId)
        onQuizzesUpdate()
      } catch (error) {
        console.error("Failed to delete quiz:", error)
      }
    }
  }

  const getQuizAttempts = (quizId: string) => {
    return allAttempts.filter((a) => a.quizId === quizId)
  }

  const stats = getStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <div>
        <WelcomeSection
          userName={user.name.split(" ")[0]}
          message="Manage your courses, assignments, and communicate with students"
          gradient="from-purple-600 to-pink-600"
        />

        <StatCardsGrid>
          <StatCard title="Total Quizzes" value={stats.totalQuizzes} icon={Book} color="purple" />
          <StatCard title="Published" value={stats.publishedQuizzes} icon={Eye} color="green" />
          <StatCard title="Active Students" value={stats.totalStudents} icon={Users} color="blue" />
          <StatCard title="Total Attempts" value={stats.totalAttempts} icon={BarChart3} color="orange" />
        </StatCardsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <QuickActionsContainer title="Quick Actions">
            <QuickAction title="Create New Quiz" icon={Plus} color="purple" onClick={() => onViewChange("create-quiz")} />
            <QuickAction title="Manage Courses" icon={BookOpen} color="blue" onClick={() => onViewChange("courses")} />
            <QuickAction title="Create Assignment" icon={FileText} color="green" onClick={() => onViewChange("assignments")} />
            <QuickAction title="Schedule Classes" icon={Calendar} color="teal" onClick={() => onViewChange("scheduling")} />
            <QuickAction title="Manage Notifications" icon={Bell} color="pink" onClick={() => onViewChange("notifications")} />
          </QuickActionsContainer>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {allAttempts.slice(0, 5).map((attempt) => {
                const quiz = quizzes.find((q) => q.id === attempt.quizId)
                return (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{quiz?.title || "Unknown Quiz"}</p>
                      <p className="text-sm text-gray-500">
                        Score: {attempt.percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(attempt.endTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
              {allAttempts.length === 0 && <p className="text-gray-500 text-center py-4">No recent activity</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Quizzes</h3>
          </div>
          <div className="p-6">
            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
                <p className="text-gray-500 mb-6">Create your first quiz to get started</p>
                <button
                  onClick={() => onViewChange("create-quiz")}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => {
                  const quizAttempts = getQuizAttempts(quiz.id)
                  const avgScore =
                    quizAttempts.length > 0
                      ? Math.round(
                          (quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
                        )
                      : 0

                  return (
                    <div
                      key={quiz.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 text-lg line-clamp-1">{quiz.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            quiz.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {quiz.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{quiz.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Questions:</span>
                          <span className="font-medium">{quiz.questions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Attempts:</span>
                          <span className="font-medium">{quizAttempts.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Avg Score:</span>
                          <span className="font-medium">{avgScore}%</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewChange("edit-quiz", quiz)}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onViewChange("results" as any, quiz)}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
