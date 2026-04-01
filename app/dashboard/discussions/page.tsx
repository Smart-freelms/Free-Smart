"use client"

import { useAuth } from "@/components/AuthProvider"
import { DiscussionForum } from "@/components/DiscussionForum"
import { useState, useEffect, Suspense } from "react"
import type { Course } from "@/types"
import { db } from "@/utils/database"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

function DiscussionsContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (user) {
      db.getCourses().then(setCourses)
    }
  }, [user])

  useEffect(() => {
    const courseId = searchParams.get('courseId')
    if (courseId) {
      db.getCourseById(courseId).then(setSelectedCourse)
    }
  }, [searchParams])

  if (!user) return null

  if (selectedCourse) {
    return (
      <DashboardLayout title="Discussions" subtitle={`Forum: ${selectedCourse.title}`}>
        <DiscussionForum user={user} course={selectedCourse} onBack={() => {}} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Discussions" subtitle="Connect and collaborate with others">
      <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Select a Course</h2>
        <p className="text-gray-600 mb-6">Please select a course to view its discussion forum.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
            >
              <h3 className="font-semibold text-gray-900">{course.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
            </button>
          ))}
          {courses.length === 0 && (
            <p className="col-span-full text-gray-500">No courses available.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscussionsContent />
    </Suspense>
  )
}
