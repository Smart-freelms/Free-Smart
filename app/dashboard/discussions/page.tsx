"use client"

import { useAuth } from "@/components/AuthProvider"
import { DiscussionForum } from "@/components/DiscussionForum"
import { useState, useEffect, Suspense } from "react"
import { Course } from "@/types"
import { db } from "@/utils/database"
import { useRouter, useSearchParams } from "next/navigation"

function DiscussionsContent() {
  const { user } = useAuth()
  const router = useRouter()
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
    return <DiscussionForum user={user} course={selectedCourse} onBack={() => router.push('/dashboard/courses')} />
  }

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold mb-4">Select a Course</h2>
      <p className="text-gray-600 mb-6">Please select a course to view its discussion forum.</p>
      <button
        onClick={() => router.push("/dashboard/courses")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Browse Courses
      </button>
    </div>
  )
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscussionsContent />
    </Suspense>
  )
}
