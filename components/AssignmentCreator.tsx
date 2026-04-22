"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Assignment, Course } from "../types"
import { ArrowLeft, Save, Calendar } from "lucide-react"
import { db } from "../utils/database"
import { SubmissionTypeSelector } from "./assignments/SubmissionTypeSelector"

interface AssignmentCreatorProps {
  user: User
  courseId?: string
  editAssignmentId?: string | null
  onBack: () => void
}

export const AssignmentCreator: React.FC<AssignmentCreatorProps> = ({ user, courseId, editAssignmentId, onBack }) => {
  const [assignmentData, setAssignmentData] = useState<Partial<Assignment>>({
    title: "",
    description: "",
    courseId: courseId || "",
    createdBy: user.id,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    maxPoints: 100,
    allowLateSubmission: true,
    submissionTypes: ["text"],
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadCourses()
    if (editAssignmentId) {
      loadAssignment()
    }
  }, [editAssignmentId])

  const loadCourses = async () => {
    try {
      const loadedCourses = await db.getCourses(user.id)
      setCourses(loadedCourses)
    } catch (error) {
      console.error("Failed to load courses:", error)
    }
  }

  const loadAssignment = async () => {
    try {
      if (editAssignmentId) {
        const assignment = await db.getAssignmentById(editAssignmentId)
        if (assignment) {
          setAssignmentData({
            ...assignment,
            dueDate: new Date(assignment.dueDate)
          })
        }
      }
    } catch (error) {
      console.error("Failed to load assignment:", error)
      setError("Failed to load assignment")
    }
  }

  const handleSave = async () => {
    if (!assignmentData.title || !assignmentData.description || !assignmentData.courseId) {
      setError("Please fill in all required fields")
      return
    }

    if (!assignmentData.dueDate || new Date(assignmentData.dueDate) <= new Date()) {
      setError("Due date must be in the future")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const assignment: Assignment = {
        id: editAssignmentId || crypto.randomUUID(),
        title: assignmentData.title!,
        description: assignmentData.description!,
        courseId: assignmentData.courseId!,
        createdBy: user.id,
        dueDate: new Date(assignmentData.dueDate!),
        maxPoints: assignmentData.maxPoints || 100,
        allowLateSubmission: assignmentData.allowLateSubmission || false,
        submissionTypes: assignmentData.submissionTypes || ["text"],
        createdAt: assignmentData.createdAt || new Date(),
        updatedAt: new Date(),
        scheduledPublishDate: assignmentData.scheduledPublishDate,
        scheduledExpiryDate: assignmentData.scheduledExpiryDate,
      }

      await db.saveAssignment(assignment)
      onBack()
    } catch (error) {
      console.error("Failed to save assignment:", error)
      setError("Failed to save assignment")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubmissionType = (type: "text" | "file" | "url") => {
    const currentTypes = assignmentData.submissionTypes || []
    const newTypes = currentTypes.includes(type) ? currentTypes.filter((t) => t !== type) : [...currentTypes, type]

    if (newTypes.length === 0) {
      setError("At least one submission type must be selected")
      return
    }

    setAssignmentData({ ...assignmentData, submissionTypes: newTypes })
    setError("")
  }

  const formatDateForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {editAssignmentId ? "Edit Assignment" : "Create New Assignment"}
              </h1>
              <p className="text-gray-600 mt-1">Design engaging assignments for your students</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Assignment"}
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

        <div className="grid gap-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Assignment Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title *</label>
                <input
                  type="text"
                  value={assignmentData.title || ""}
                  onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter assignment title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                  <select
                    value={assignmentData.courseId || ""}
                    onChange={(e) => setAssignmentData({ ...assignmentData, courseId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Points</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={assignmentData.maxPoints || 100}
                    onChange={(e) =>
                      setAssignmentData({ ...assignmentData, maxPoints: Number.parseInt(e.target.value) || 100 })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={assignmentData.dueDate ? formatDateForInput(new Date(assignmentData.dueDate)) : ""}
                    onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: new Date(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Description *</label>
                <textarea
                  value={assignmentData.description || ""}
                  onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed instructions for the assignment..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Scheduling & Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={assignmentData.scheduledPublishDate || ""}
                  onChange={(e) => setAssignmentData({ ...assignmentData, scheduledPublishDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={assignmentData.scheduledExpiryDate || ""}
                  onChange={(e) => setAssignmentData({ ...assignmentData, scheduledExpiryDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Students will only see this assignment during the window specified above. If empty, it is visible immediately after publishing.</p>
          </div>

          {/* Submission Settings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Submission Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Allowed Submission Types *</label>
                <SubmissionTypeSelector
                  selectedTypes={assignmentData.submissionTypes || []}
                  onToggle={toggleSubmissionType}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowLate"
                  checked={assignmentData.allowLateSubmission || false}
                  onChange={(e) => setAssignmentData({ ...assignmentData, allowLateSubmission: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="allowLate" className="ml-3 text-sm font-medium text-gray-700">
                  Allow late submissions
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
