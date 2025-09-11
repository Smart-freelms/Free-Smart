"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Quiz, Course, Assignment } from "../types"
import { StudentDashboard } from "./StudentDashboard"
import { TeacherDashboard } from "./TeacherDashboard"
import { QuizCreator } from "./QuizCreator"
import { QuizTaker } from "./QuizTaker"
import { QuizResults } from "./QuizResults"
import { CourseCreator } from "./CourseCreator"
import { CourseList } from "./CourseList"
import { AssignmentList } from "./AssignmentList"
import { AssignmentCreator } from "./AssignmentCreator"
import { AssignmentSubmission } from "./AssignmentSubmission"
import { GradingInterface } from "./GradingInterface"
import { AnalyticsDashboard } from "./AnalyticsDashboard"
import { GradeBook } from "./GradeBook"
import { DiscussionForum } from "./DiscussionForum"
import { MessagingSystem } from "./MessagingSystem"
import { AnnouncementSystem } from "./AnnouncementSystem"
import { SchedulingSystem } from "./SchedulingSystem"
import { NotificationCenter } from "./NotificationCenter"
import { db } from "../utils/database"
import { MaterialViewer } from "./MaterialViewer"

interface DashboardProps {
  user: User
  onLogout: () => void
}

export type View =
  | "dashboard"
  | "create-quiz"
  | "edit-quiz"
  | "take-quiz"
  | "results"
  | "courses"
  | "create-course"
  | "edit-course"
  | "view-course"
  | "view-materials"
  | "assignments"
  | "create-assignment"
  | "edit-assignment"
  | "view-assignment"
  | "submit-assignment"
  | "grade-assignment"
  | "analytics"
  | "gradebook"
  | "discussions"
  | "messages"
  | "announcements"
  | "scheduling"
  | "notifications"

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [editQuizId, setEditQuizId] = useState<string | null>(null)
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  const [editAssignmentId, setEditAssignmentId] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  useEffect(() => {
    loadQuizzes()
  }, [user])

  const loadQuizzes = async () => {
    try {
      const loadedQuizzes = user.role === "teacher" ? await db.getQuizzes(user.id) : await db.getQuizzes()
      setQuizzes(loadedQuizzes)
    } catch (error) {
      console.error("Failed to load quizzes:", error)
    }
  }

  const handleViewChange = (
    view: View,
    quiz?: Quiz,
    editId?: string,
    course?: Course,
    editCourseId?: string,
    assignment?: Assignment,
    editAssignmentId?: string,
  ) => {
    setCurrentView(view)
    setSelectedQuiz(quiz || null)
    setSelectedCourse(course || null)
    setSelectedAssignment(assignment || null)
    setEditQuizId(editId || null)
    setEditCourseId(editCourseId || null)
    setEditAssignmentId(editAssignmentId || null)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "scheduling":
        return <SchedulingSystem user={user} onBack={() => setCurrentView("dashboard")} />
      case "notifications":
        return <NotificationCenter user={user} onBack={() => setCurrentView("dashboard")} />
      case "create-quiz":
      case "edit-quiz":
        return (
          <QuizCreator
            user={user}
            editQuizId={editQuizId}
            onBack={() => {
              setCurrentView("dashboard")
              loadQuizzes()
            }}
          />
        )
      case "take-quiz":
        return selectedQuiz ? (
          <QuizTaker
            quiz={selectedQuiz}
            user={user}
            onComplete={() => {
              setCurrentView("dashboard")
            }}
          />
        ) : null
      case "results":
        return selectedQuiz ? (
          <QuizResults quiz={selectedQuiz} user={user} onBack={() => setCurrentView("dashboard")} />
        ) : null
      case "courses":
        return (
          <CourseList
            user={user}
            onCreateCourse={() => setCurrentView("create-course")}
            onEditCourse={(courseId) => {
              setEditCourseId(courseId)
              setCurrentView("edit-course")
            }}
            onViewCourse={(course) => {
              setSelectedCourse(course)
              setCurrentView("view-course")
            }}
          />
        )
      case "create-course":
      case "edit-course":
        return <CourseCreator user={user} editCourseId={editCourseId} onBack={() => setCurrentView("courses")} />
      case "view-course":
        return selectedCourse ? (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">{selectedCourse.title}</h1>
            <p className="text-gray-600 mb-6">{selectedCourse.description}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView("view-materials")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View Materials ({selectedCourse.materials?.length || 0})
              </button>
              <button
                onClick={() => setCurrentView("discussions")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Discussions
              </button>
              <button
                onClick={() => setCurrentView("courses")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Courses
              </button>
            </div>
          </div>
        ) : null
      case "view-materials":
        return selectedCourse ? (
          <MaterialViewer user={user} course={selectedCourse} onBack={() => setCurrentView("view-course")} />
        ) : null
      case "assignments":
        return (
          <AssignmentList
            user={user}
            onCreateAssignment={(courseId) => {
              setEditCourseId(courseId || null)
              setCurrentView("create-assignment")
            }}
            onEditAssignment={(assignmentId) => {
              setEditAssignmentId(assignmentId)
              setCurrentView("edit-assignment")
            }}
            onViewAssignment={(assignment) => {
              setSelectedAssignment(assignment)
              setCurrentView(user.role === "student" ? "submit-assignment" : "grade-assignment")
            }}
          />
        )
      case "create-assignment":
      case "edit-assignment":
        return (
          <AssignmentCreator
            user={user}
            courseId={editCourseId || undefined}
            editAssignmentId={editAssignmentId}
            onBack={() => setCurrentView("assignments")}
          />
        )
      case "submit-assignment":
        return selectedAssignment ? (
          <AssignmentSubmission
            user={user}
            assignment={selectedAssignment}
            onBack={() => setCurrentView("assignments")}
          />
        ) : null
      case "grade-assignment":
        return selectedAssignment ? (
          <GradingInterface user={user} assignment={selectedAssignment} onBack={() => setCurrentView("assignments")} />
        ) : null
      case "analytics":
        return <AnalyticsDashboard user={user} onBack={() => setCurrentView("dashboard")} />
      case "gradebook":
        return <GradeBook user={user} onBack={() => setCurrentView("dashboard")} />
      case "discussions":
        return selectedCourse ? (
          <DiscussionForum user={user} course={selectedCourse} onBack={() => setCurrentView("view-course")} />
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Select a Course</h2>
            <p className="text-gray-600 mb-6">Please select a course to view its discussion forum.</p>
            <button
              onClick={() => setCurrentView("courses")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )
      case "messages":
        return <MessagingSystem user={user} onBack={() => setCurrentView("dashboard")} />
      case "announcements":
        return (
          <AnnouncementSystem
            user={user}
            course={selectedCourse || undefined}
            onBack={() => setCurrentView("dashboard")}
          />
        )
      case "view-assignment":
        return selectedAssignment ? (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">{selectedAssignment.title}</h1>
            <p className="text-gray-600 mb-6">{selectedAssignment.description}</p>
            <button
              onClick={() => setCurrentView("assignments")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Assignments
            </button>
          </div>
        ) : null
      default:
        return user.role === "student" ? (
          <StudentDashboard user={user} quizzes={quizzes} onLogout={onLogout} onViewChange={handleViewChange} />
        ) : (
          <TeacherDashboard
            user={user}
            quizzes={quizzes}
            onLogout={onLogout}
            onViewChange={handleViewChange}
            onQuizzesUpdate={loadQuizzes}
          />
        )
    }
  }

  return <div className="min-h-screen bg-gray-50">{renderCurrentView()}</div>
}
