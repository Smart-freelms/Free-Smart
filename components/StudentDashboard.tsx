"use client"

import React, { useState, useEffect } from "react"
import { User, Quiz, QuizAttempt } from "../types"
import { LogOut, Play, Trophy, Clock, Target, TrendingUp, Star, Book, BookOpen, FileText, Mail, Megaphone, Calendar, Bell } from "lucide-react"
import { db } from "../utils/database"
import { StatCard, StatCardsGrid } from "./dashboard/StatCards"
import { QuickAction, QuickActionsContainer } from "./dashboard/QuickActions"
import { WelcomeSection } from "./dashboard/WelcomeSection"
import { DashboardHeader } from "./dashboard/DashboardHeader"

interface StudentDashboardProps {
  user: User
  quizzes: Quiz[]
  onLogout: () => void
  onViewChange: (view: string, quiz?: Quiz) => void
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, quizzes, onLogout, onViewChange }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAttempts()
  }, [user.id])

  const loadAttempts = async () => {
    try {
      const userAttempts = await db.getAttempts(user.id)
      setAttempts(userAttempts)
    } catch (error) {
      console.error("Failed to load attempts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQuizStats = () => {
    const totalQuizzes = quizzes.length
    const completedQuizzes = [...new Set(attempts.map((a) => a.quizId))].length
    const avgScore =
      attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0

    return {
      totalQuizzes,
      completedQuizzes,
      avgScore: Math.round(avgScore),
      bestScore: Math.round(bestScore),
    }
  }

  const getQuizAttempt = (quizId: string) => {
    return attempts
      .filter((a) => a.quizId === quizId)
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0]
  }

  const stats = getQuizStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
      <DashboardHeader
        title="Smart LMS"
        subtitle="Student Dashboard"
        userName={user.name}
        userEmail={user.email}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeSection
          userName={user.name.split(" ")[0]}
          message="Ready to challenge yourself with some quizzes and assignments?"
          gradient="from-blue-600 to-indigo-600"
        />

        <StatCardsGrid>
          <StatCard title="Available Quizzes" value={stats.totalQuizzes} icon={Book} color="blue" />
          <StatCard title="Completed" value={stats.completedQuizzes} icon={Target} color="green" />
          <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon={TrendingUp} color="yellow" />
          <StatCard title="Best Score" value={`${stats.bestScore}%`} icon={Star} color="purple" />
        </StatCardsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
             <QuickActionsContainer title="Quick Links">
              <QuickAction title="My Courses" icon={BookOpen} color="blue" onClick={() => onViewChange("courses")} />
              <QuickAction title="Assignments" icon={FileText} color="green" onClick={() => onViewChange("assignments")} />
              <QuickAction title="Messages" icon={Mail} color="indigo" onClick={() => onViewChange("messages")} />
              <QuickAction title="Announcements" icon={Megaphone} color="orange" onClick={() => onViewChange("announcements")} />
              <QuickAction title="Notifications" icon={Bell} color="pink" onClick={() => onViewChange("notifications")} />
            </QuickActionsContainer>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Featured Quizzes</h3>
                <p className="text-gray-600 mt-1">Recent quizzes available for you</p>
              </div>

              <div className="p-6">
                {quizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 mb-2">No Quizzes Available</h4>
                    <p className="text-gray-500">Check back later for new quizzes to take.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quizzes.slice(0, 5).map((quiz) => {
                      const attempt = getQuizAttempt(quiz.id)

                      return (
                        <div
                          key={quiz.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {quiz.title}
                                </h4>
                                {attempt && (
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {attempt.passed ? "Passed" : "Failed"}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3 text-sm line-clamp-1">{quiz.description}</p>

                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Target className="w-4 h-4 mr-1" />
                                  {quiz.questions.length} questions
                                </div>
                                {quiz.timeLimit && (
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {quiz.timeLimit} mins
                                  </div>
                                )}
                                {attempt && (
                                  <div className="flex items-center">
                                    <Trophy className="w-4 h-4 mr-1" />
                                    {attempt.percentage}%
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 ml-4">
                              <button
                                onClick={() => onViewChange("take-quiz", quiz)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                {attempt ? "Retake" : "Start"}
                              </button>

                              {attempt && (
                                <button
                                  onClick={() => onViewChange("results", quiz)}
                                  className="flex items-center px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                                >
                                  Results
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {quizzes.length > 5 && (
                  <button
                    onClick={() => onViewChange("quizzes")}
                    className="w-full mt-6 py-2 text-center text-blue-600 font-medium hover:underline"
                  >
                    View all quizzes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
