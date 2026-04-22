"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course, Assignment, Quiz, QuizAttempt } from "../types"
import { BarChart3, TrendingUp, Users, BookOpen, Award, Target, Clock } from "lucide-react"
import { db } from "../utils/database"
import { useUserNames } from "../hooks/useUserNames"

interface AnalyticsDashboardProps {
  user: User
  onBack: () => void
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user, onBack }) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [user])

  const loadAnalyticsData = async () => {
    try {
      const [loadedCourses, loadedAssignments, loadedQuizzes] = await Promise.all([
        user.role === "teacher" ? db.getCourses(user.id) : db.getCourses(),
        db.getAssignments(),
        user.role === "teacher" ? db.getQuizzes(user.id) : db.getQuizzes(),
      ])

      setCourses(loadedCourses)
      setAssignments(loadedAssignments)
      setQuizzes(loadedQuizzes)

      // Load quiz attempts
      const allAttempts: QuizAttempt[] = []
      for (const quiz of loadedQuizzes) {
        const quizAttempts = await db.getQuizAttempts(quiz.id)
        allAttempts.push(...quizAttempts)
      }
      setAttempts(allAttempts)
    } catch (error) {
      console.error("Failed to load analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOverallStats = () => {
    let filteredAttempts = attempts
    if (selectedCourse !== "all") {
      const course = courses.find((c) => c.id === selectedCourse)
      if (course) {
        filteredAttempts = filteredAttempts.filter((a) => course.quizzes.includes(a.quizId))
      }
    }
    if (selectedStudent !== "all") {
      filteredAttempts = filteredAttempts.filter((a) => a.userId === selectedStudent)
    }

    const filteredCourses = selectedCourse === "all" ? courses : courses.filter((c) => c.id === selectedCourse)
    const filteredAssignments =
      selectedCourse === "all"
        ? assignments
        : assignments.filter((a) => filteredCourses.some((c) => c.id === a.courseId))
    const filteredQuizzes =
      selectedCourse === "all" ? quizzes : quizzes.filter((q) => filteredCourses.some((c) => c.quizzes.includes(q.id)))

    const totalStudents =
      selectedStudent !== "all" ? 1 : filteredCourses.reduce((sum, course) => sum + course.students.length, 0)
    const totalAttempts = filteredAttempts.length
    const avgScore =
      totalAttempts > 0 ? Math.round(filteredAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts) : 0

    return {
      totalCourses: filteredCourses.length,
      totalAssignments: filteredAssignments.length,
      totalQuizzes: filteredQuizzes.length,
      totalStudents,
      totalAttempts,
      avgScore,
    }
  }

  const getCoursePerformance = () => {
    return courses.map((course) => {
      const courseQuizzes = quizzes.filter((q) => course.quizzes.includes(q.id))
      const courseAttempts = attempts.filter((a) => courseQuizzes.some((q) => q.id === a.quizId))
      const avgScore =
        courseAttempts.length > 0
          ? Math.round(courseAttempts.reduce((sum, a) => sum + a.percentage, 0) / courseAttempts.length)
          : 0

      return {
        course,
        studentsEnrolled: course.students.length,
        totalAttempts: courseAttempts.length,
        avgScore,
        completionRate:
          courseAttempts.length > 0 ? Math.round((courseAttempts.length / course.students.length) * 100) : 0,
      }
    })
  }

  const getAllStudents = () => {
    const students = new Set<string>()
    courses.forEach((c) => c.students.forEach((s) => students.add(s)))
    return Array.from(students)
  }

  const getRecentActivity = () => {
    let filteredAttempts = attempts
    if (selectedStudent !== "all") {
      filteredAttempts = filteredAttempts.filter((a) => a.userId === selectedStudent)
    }
    if (selectedCourse !== "all") {
      const course = courses.find((c) => c.id === selectedCourse)
      if (course) {
        filteredAttempts = filteredAttempts.filter((a) => course.quizzes.includes(a.quizId))
      }
    }

    const recentAttempts = filteredAttempts
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 10)

    return recentAttempts.map((attempt) => {
      const quiz = quizzes.find((q) => q.id === attempt.quizId)
      return {
        attempt,
        quiz,
        studentName: getUserName(attempt.userId),
      }
    })
  }

  const { getUserName, userNames } = useUserNames()

  const stats = getOverallStats()
  const coursePerformance = getCoursePerformance()
  const recentActivity = getRecentActivity()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track performance and engagement across your courses</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Students</option>
              {getAllStudents().map((studentId) => (
                <option key={studentId} value={studentId}>
                  {userNames[studentId] || studentId}
                </option>
              ))}
            </select>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
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
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgScore}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Performance */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Course Performance</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {coursePerformance.map(({ course, studentsEnrolled, totalAttempts, avgScore, completionRate }) => (
                <div key={course.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <span className="text-sm text-gray-500">{studentsEnrolled} students</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Avg Score</p>
                      <p className="font-semibold text-gray-900">{avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Attempts</p>
                      <p className="font-semibold text-gray-900">{totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completion</p>
                      <p className="font-semibold text-gray-900">{completionRate}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(avgScore, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {coursePerformance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No course data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {recentActivity.map(({ attempt, quiz, studentName }) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium text-gray-900">{studentName}</span>
                      <span className="text-sm text-gray-500">completed</span>
                      <span className="font-medium text-blue-600">{quiz?.title}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Score: {attempt.percentage}%</span>
                      <span>•</span>
                      <span>{new Date(attempt.endTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attempt.passed ? "Passed" : "Failed"}
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Trends</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement Rate</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">78%</p>
              <p className="text-sm text-gray-600">+5% from last month</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pass Rate</h3>
              <p className="text-3xl font-bold text-green-600 mb-2">85%</p>
              <p className="text-sm text-gray-600">+3% from last month</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Students</h3>
              <p className="text-3xl font-bold text-purple-600 mb-2">{stats.totalStudents}</p>
              <p className="text-sm text-gray-600">+12% from last month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
