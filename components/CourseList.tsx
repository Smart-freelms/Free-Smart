"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course } from "../types"
import { Book, Users, Calendar, Eye, Edit, Trash2, Plus, Search } from "lucide-react"
import { db } from "../utils/database"

interface CourseListProps {
  user: User
  onCreateCourse: () => void
  onEditCourse: (courseId: string) => void
  onViewCourse: (course: Course) => void
}

export const CourseList: React.FC<CourseListProps> = ({ user, onCreateCourse, onEditCourse, onViewCourse }) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [user])

  const loadCourses = async () => {
    try {
      const loadedCourses = user.role === "teacher" ? await db.getCourses(user.id) : await db.getCourses()
      setCourses(loadedCourses)
    } catch (error) {
      console.error("Failed to load courses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        // In a real app, you'd have a deleteCourse method
        console.log("Delete course:", courseId)
        loadCourses()
      } catch (error) {
        console.error("Failed to delete course:", error)
      }
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user.role === "teacher" ? "My Courses" : "Available Courses"}
          </h2>
          <p className="text-gray-600 mt-1">
            {user.role === "teacher" ? "Create and manage your course collection" : "Browse and enroll in courses"}
          </p>
        </div>
        {user.role === "teacher" && (
          <button
            onClick={onCreateCourse}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {courses.length === 0 ? "No Courses Available" : "No Courses Found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {courses.length === 0
              ? user.role === "teacher"
                ? "Start by creating your first course to engage your students."
                : "No courses are currently available for enrollment."
              : "Try adjusting your search terms."}
          </p>
          {user.role === "teacher" && courses.length === 0 && (
            <button
              onClick={onCreateCourse}
              className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">{course.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      course.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.students.length} students
                  </div>
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-1" />
                    {course.materials.length} materials
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-400 mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {new Date(course.createdAt).toLocaleDateString()}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onViewCourse(course)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {user.role === "teacher" ? "Manage" : "View"}
                  </button>

                  {user.role === "teacher" && course.createdBy === user.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEditCourse(course.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
