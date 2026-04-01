"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course, Assignment, Quiz } from "../types"
import { Download, Search, BookOpen, FileText, Users } from "lucide-react"
import { db } from "../utils/database"

interface GradeBookProps {
  user: User
  onBack: () => void
}

export const GradeBook: React.FC<GradeBookProps> = ({ user, onBack }) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [user])

  useEffect(() => {
    if (selectedCourse) {
      loadCourseData()
    }
  }, [selectedCourse])

  const loadCourses = async () => {
    try {
      const loadedCourses = await db.getCourses(user.id)
      setCourses(loadedCourses)
      if (loadedCourses.length > 0) {
        setSelectedCourse(loadedCourses[0].id)
      }
    } catch (error) {
      console.error("Failed to load courses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCourseData = async () => {
    try {
      const course = courses.find((c) => c.id === selectedCourse)
      if (!course) return

      // Load assignments and quizzes for the course
      const [courseAssignments, courseQuizzes] = await Promise.all([
        db.getAssignments(selectedCourse),
        Promise.all(course.quizzes.map((quizId) => db.getQuizById(quizId))).then(
          (results) => results.filter((quiz) => quiz !== null) as Quiz[],
        ),
      ])

      setAssignments(courseAssignments)
      setQuizzes(courseQuizzes)

      // Fetch actual students from database
      const allUsers = await db.getAllUsers()
      const courseStudents = allUsers.filter(u => course.students.includes(u.id))
      setStudents(courseStudents)

      // Fetch actual grades from database
      const dbGrades: Record<string, Record<string, number>> = {}
      for (const student of courseStudents) {
        dbGrades[student.id] = {}

        for (const assignment of courseAssignments) {
          const submission = await db.getSubmissionByAssignmentAndStudent(assignment.id, student.id)
          if (submission?.grade !== undefined) {
            dbGrades[student.id][`assignment-${assignment.id}`] = submission.grade
          }
        }

        for (const quiz of courseQuizzes) {
          const attempts = await db.getQuizAttemptsByStudent(quiz.id, student.id)
          if (attempts.length > 0) {
            const bestScore = Math.max(...attempts.map(a => a.percentage))
            dbGrades[student.id][`quiz-${quiz.id}`] = bestScore
          }
        }
      }
      setGrades(dbGrades)
    } catch (error) {
      console.error("Failed to load course data:", error)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const calculateStudentAverage = (studentId: string) => {
    const studentGrades = grades[studentId] || {}
    const gradeValues = Object.values(studentGrades)
    if (gradeValues.length === 0) return 0
    return Math.round(gradeValues.reduce((sum, grade) => sum + grade, 0) / gradeValues.length)
  }

  const exportGrades = () => {
    // In a real app, you'd generate and download a CSV/Excel file
    console.log("Exporting grades...")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Book</h1>
            <p className="text-gray-600 mt-1">Manage and track student grades across all assessments</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportGrades}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Course Selection and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grade Table */}
        {selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {courses.find((c) => c.id === selectedCourse)?.title} - Grades
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {filteredStudents.length} students
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {assignments.length} assignments
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {quizzes.length} quizzes
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Student
                    </th>
                    {assignments.map((assignment) => (
                      <th
                        key={assignment.id}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32"
                      >
                        <div className="flex flex-col items-center">
                          <FileText className="w-4 h-4 mb-1" />
                          <span className="truncate max-w-24">{assignment.title}</span>
                          <span className="text-gray-400">({assignment.maxPoints}pts)</span>
                        </div>
                      </th>
                    ))}
                    {quizzes.map((quiz) => (
                      <th
                        key={quiz.id}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32"
                      >
                        <div className="flex flex-col items-center">
                          <BookOpen className="w-4 h-4 mb-1" />
                          <span className="truncate max-w-24">{quiz.title}</span>
                          <span className="text-gray-400">(100pts)</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const average = calculateStudentAverage(student.id)
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        {assignments.map((assignment) => {
                          const grade = grades[student.id]?.[`assignment-${assignment.id}`]
                          const percentage = grade !== undefined ? Math.round((grade / assignment.maxPoints) * 100) : 0
                          return (
                            <td key={assignment.id} className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">
                                {grade !== undefined ? `${grade}/${assignment.maxPoints}` : "-"}
                              </div>
                              {grade !== undefined && (
                                <div
                                  className={`text-xs ${
                                    percentage >= 90
                                      ? "text-green-600"
                                      : percentage >= 80
                                        ? "text-blue-600"
                                        : percentage >= 70
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                  }`}
                                >
                                  {percentage}%
                                </div>
                              )}
                            </td>
                          )
                        })}
                        {quizzes.map((quiz) => {
                          const grade = grades[student.id]?.[`quiz-${quiz.id}`]
                          return (
                            <td key={quiz.id} className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">
                                {grade !== undefined ? `${grade}/100` : "-"}
                              </div>
                              {grade !== undefined && (
                                <div
                                  className={`text-xs ${
                                    grade >= 90
                                      ? "text-green-600"
                                      : grade >= 80
                                        ? "text-blue-600"
                                        : grade >= 70
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                  }`}
                                >
                                  {grade}%
                                </div>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div
                            className={`text-sm font-bold ${
                              average >= 90
                                ? "text-green-600"
                                : average >= 80
                                  ? "text-blue-600"
                                  : average >= 70
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                          >
                            {average}%
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">No students match your search criteria.</p>
              </div>
            )}
          </div>
        )}

        {!selectedCourse && courses.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Courses Available</h3>
            <p className="text-gray-500">Create a course first to start managing grades.</p>
          </div>
        )}
      </div>
    </div>
  )
}
