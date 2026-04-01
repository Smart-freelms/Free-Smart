"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Assignment, AssignmentSubmission } from "../types"
import { ArrowLeft, Save, FileText, Calendar, Clock, CheckCircle, UserIcon } from "lucide-react"

interface GradingInterfaceProps {
  user: User
  assignment: Assignment
  onBack: () => void
}

export const GradingInterface: React.FC<GradingInterfaceProps> = ({ user, assignment, onBack }) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const [gradeData, setGradeData] = useState({
    grade: "",
    feedback: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadSubmissions()
  }, [assignment.id])

  const loadSubmissions = async () => {
    try {
      const dbSubmissions = await db.getSubmissionsByAssignment(assignment.id)
      setSubmissions(dbSubmissions)
      if (dbSubmissions.length > 0) {
        setSelectedSubmission(dbSubmissions[0])
        setGradeData({
          grade: dbSubmissions[0].grade?.toString() || "",
          feedback: dbSubmissions[0].feedback || "",
        })
      }
    } catch (error) {
      console.error("Failed to load submissions:", error)
      setError("Failed to load submissions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmissionSelect = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission)
    setGradeData({
      grade: submission.grade?.toString() || "",
      feedback: submission.feedback || "",
    })
    setError("")
    setSuccess("")
  }

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return

    const grade = Number.parseInt(gradeData.grade)
    if (isNaN(grade) || grade < 0 || grade > assignment.maxPoints) {
      setError(`Grade must be between 0 and ${assignment.maxPoints}`)
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const updatedSubmission: AssignmentSubmission = {
        ...selectedSubmission,
        grade,
        feedback: gradeData.feedback,
        gradedBy: user.id,
        gradedAt: new Date(),
      }

      await db.saveSubmission(updatedSubmission)

      // Update local state
      setSubmissions(submissions.map((s) => (s.id === selectedSubmission.id ? updatedSubmission : s)))
      setSelectedSubmission(updatedSubmission)
      setSuccess("Grade saved successfully!")
    } catch (error) {
      console.error("Failed to save grade:", error)
      setError("Failed to save grade")
    } finally {
      setIsSaving(false)
    }
  }

  const getSubmissionStatus = (submission: AssignmentSubmission) => {
    if (submission.grade !== undefined) {
      return { status: "graded", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle }
    }
    return { status: "pending", color: "text-yellow-600", bg: "bg-yellow-100", icon: Clock }
  }

  const getStudentName = (studentId: string) => {
    return `Student ${studentId.slice(0, 4)}`
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
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Assignment</h1>
            <p className="text-gray-600 mt-1">{assignment.title}</p>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submissions List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Submissions ({submissions.length})</h2>

            <div className="space-y-3">
              {submissions.map((submission) => {
                const status = getSubmissionStatus(submission)
                const StatusIcon = status.icon

                return (
                  <div
                    key={submission.id}
                    onClick={() => handleSubmissionSelect(submission)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedSubmission?.id === submission.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{getStudentName(submission.studentId)}</span>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.status}
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>

                    {submission.grade !== undefined && (
                      <div className="text-sm font-medium text-green-600">
                        Grade: {submission.grade}/{assignment.maxPoints}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {submissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No submissions yet</p>
              </div>
            )}
          </div>

          {/* Submission Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedSubmission ? (
              <>
                {/* Student Submission */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {getStudentName(selectedSubmission.studentId)}'s Submission
                    </h2>
                    <div className="text-sm text-gray-500">
                      Submitted {new Date(selectedSubmission.submittedAt).toLocaleDateString()} at{" "}
                      {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.content}</p>
                    </div>
                  </div>

                  {selectedSubmission.fileUrl && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Attached File:</h4>
                      <a
                        href={selectedSubmission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* Grading Panel */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Grade & Feedback</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade (out of {assignment.maxPoints} points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={assignment.maxPoints}
                        value={gradeData.grade}
                        onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter grade"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                      <textarea
                        value={gradeData.feedback}
                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Provide feedback to help the student improve..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        {selectedSubmission.gradedAt
                          ? `Last graded on ${new Date(selectedSubmission.gradedAt).toLocaleDateString()}`
                          : "Not graded yet"}
                      </div>
                      <button
                        onClick={handleSaveGrade}
                        disabled={isSaving}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Grade"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Submission</h3>
                <p className="text-gray-500">Choose a submission from the list to start grading</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
