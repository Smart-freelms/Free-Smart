"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Quiz, QuizAttempt } from "../types"
import type { View } from "./Dashboard"
import {
  LogOut,
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
} from "lucide-react" // Added communication icons
import { db } from "../utils/database"

interface TeacherDashboardProps {
  user: User
  quizzes: Quiz[]
  onLogout: () => void
  onViewChange: (view: View, quiz?: Quiz, editId?: string) => void
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Smart LMS</h1>
                <p className="text-sm text-gray-500">Teacher Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onViewChange("courses")}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Courses
              </button>
              <button
                onClick={() => onViewChange("assignments")}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Assignments
              </button>
              <button
                onClick={() => onViewChange("messages")}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Messages
              </button>
              <button
                onClick={() => onViewChange("announcements")}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Announcements
              </button>
              <button
                onClick={() => onViewChange("analytics")}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => onViewChange("gradebook")}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Award className="w-4 h-4 mr-2" />
                Gradebook
              </button>
              <button
                onClick={() => onViewChange("scheduling")}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Scheduling
              </button>
              <button
                onClick={() => onViewChange("notifications")}
                className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </button>
              <button
                onClick={() => onViewChange("create-quiz")}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button onClick={onLogout} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(" ")[0]}!</h2>
          <p className="text-purple-100 text-lg">Manage your courses, assignments, and communicate with students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Book className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-gray-900">{stats.publishedQuizzes}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => onViewChange("create-quiz")}
                className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="font-medium text-gray-900">Create New Quiz</span>
                </div>
              </button>
              <button
                onClick={() => onViewChange("courses")}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-900">Manage Courses</span>
                </div>
              </button>
              <button
                onClick={() => onViewChange("assignments")}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium text-gray-900">Create Assignment</span>
                </div>
              </button>
              <button
                onClick={() => onViewChange("scheduling")}
                className="w-full flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-teal-600 mr-3" />
                  <span className="font-medium text-gray-900">Schedule Classes</span>
                </div>
              </button>
              <button
                onClick={() => onViewChange("notifications")}
                className="w-full flex items-center justify-between p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-pink-600 mr-3" />
                  <span className="font-medium text-gray-900">Manage Notifications</span>
                </div>
              </button>
            </div>
          </div>

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
                        Score: {attempt.score}/{attempt.totalQuestions} (
                        {Math.round((attempt.score / attempt.totalQuestions) * 100)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(attempt.completedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
              {allAttempts.length === 0 && <p className="text-gray-500 text-center py-4">No recent activity</p>}
            </div>
          </div>
        </div>

        {/* Quiz Management */}
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
                  const attempts = getQuizAttempts(quiz.id)
                  const avgScore =
                    attempts.length > 0
                      ? Math.round(
                          (attempts.reduce((sum, a) => sum + a.score / a.totalQuestions, 0) / attempts.length) * 100,
                        )
                      : 0

                  return (
                    <div
                      key={quiz.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 text-lg">{quiz.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            quiz.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {quiz.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Questions:</span>
                          <span className="font-medium">{quiz.questions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Attempts:</span>
                          <span className="font-medium">{attempts.length}</span>
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
                          onClick={() => onViewChange("quiz-results", quiz)}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
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
