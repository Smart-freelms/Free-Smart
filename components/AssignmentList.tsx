"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Assignment, Course } from "../types"
import { Calendar, Clock, FileText, Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { db } from "../utils/database"

interface AssignmentListProps {
  user: User
  courseId?: string
  onCreateAssignment: (courseId?: string) => void
  onEditAssignment: (assignmentId: string) => void
  onViewAssignment: (assignment: Assignment) => void
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  user,
  courseId,
  onCreateAssignment,
  onEditAssignment,
  onViewAssignment,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState(courseId || "all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAssignments()
    loadCourses()
  }, [user, courseId])

  const loadAssignments = async () => {
    try {
      const loadedAssignments = courseId
        ? await db.getAssignments(courseId, user.role)
        : await db.getAssignments(undefined, user.role)
      setAssignments(loadedAssignments)
    } catch (error) {
      console.error("Failed to load assignments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const loadedCourses = user.role === "teacher" ? await db.getCourses(user.id) : await db.getCourses()
      setCourses(loadedCourses)
    } catch (error) {
      console.error("Failed to load courses:", error)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      try {
        await db.deleteAssignment(assignmentId)
        loadAssignments()
      } catch (error) {
        console.error("Failed to delete assignment:", error)
      }
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = selectedCourse === "all" || assignment.courseId === selectedCourse
    return matchesSearch && matchesCourse
  })

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    const isOverdue = now > dueDate

    if (isOverdue) {
      return { status: "overdue", color: "text-red-600", bg: "bg-red-100" }
    } else if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: "due-soon", color: "text-yellow-600", bg: "bg-yellow-100" }
    } else {
      return { status: "active", color: "text-green-600", bg: "bg-green-100" }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user.role === "teacher" ? "Assignment Management" : "My Assignments"}
          </h2>
          <p className="text-gray-600 mt-1">
            {user.role === "teacher" ? "Create and manage assignments for your courses" : "View and submit assignments"}
          </p>
        </div>
        {user.role === "teacher" && (
          <button
            onClick={() => onCreateAssignment(courseId)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {!courseId && (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {assignments.length === 0 ? "No Assignments Available" : "No Assignments Found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {assignments.length === 0
              ? user.role === "teacher"
                ? "Start by creating your first assignment."
                : "No assignments have been created yet."
              : "Try adjusting your search terms or filters."}
          </p>
          {user.role === "teacher" && assignments.length === 0 && (
            <button
              onClick={() => onCreateAssignment(courseId)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment)
            const course = courses.find((c) => c.id === assignment.courseId)

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                        {status.status === "overdue" ? "Overdue" : status.status === "due-soon" ? "Due Soon" : "Active"}
                      </span>
                    </div>
                    {course && <p className="text-sm text-blue-600 font-medium mb-2">{course.title}</p>}
                    <p className="text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {assignment.maxPoints} points
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {assignment.submissionTypes.join(", ")}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Created {new Date(assignment.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewAssignment(assignment)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {user.role === "teacher" ? "Manage" : "View"}
                    </button>

                    {user.role === "teacher" && assignment.createdBy === user.id && (
                      <>
                        <button
                          onClick={() => onEditAssignment(assignment.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Assignment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
