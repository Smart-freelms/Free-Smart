import React, { useState, useEffect } from "react"
import { db } from "../../utils/database"
import type { Course, QuizAttempt, AssignmentSubmission } from "../../types"
import { Target } from "lucide-react"

interface CourseProgressProps {
  course: Course
  studentId: string
}

export const CourseProgress: React.FC<CourseProgressProps> = ({ course, studentId }) => {
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateProgress()
  }, [course, studentId])

  const calculateProgress = async () => {
    try {
      const [attempts, submissions] = await Promise.all([
        db.getAttempts(studentId),
        Promise.all(
          course.assignments.map((id) => db.getSubmissionByAssignmentAndStudent(id, studentId))
        ).then((results) => results.filter((s) => s !== null) as AssignmentSubmission[])
      ])

      const completedQuizzes = course.quizzes.filter((quizId) =>
        attempts.some((a) => a.quizId === quizId)
      ).length

      const completedAssignments = submissions.length
      const totalItems = course.quizzes.length + course.assignments.length

      if (totalItems === 0) {
        setProgress(100)
      } else {
        setProgress(Math.round(((completedQuizzes + completedAssignments) / totalItems) * 100))
      }
    } catch (error) {
      console.error("Failed to calculate progress:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="h-2 w-full bg-gray-100 animate-pulse rounded-full" />
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <div className="flex items-center text-gray-600">
          <Target className="w-3 h-3 mr-1" />
          <span>Course Progress</span>
        </div>
        <span className={progress === 100 ? "text-green-600" : "text-blue-600"}>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            progress === 100 ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
