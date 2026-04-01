"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Assignment, AssignmentSubmission as AssignmentSubmissionType } from "../types"
import { ArrowLeft, Send, Upload, Link, FileText, Calendar, Clock, CheckCircle } from "lucide-react"

interface AssignmentSubmissionProps {
  user: User
  assignment: Assignment
  onBack: () => void
}

export const AssignmentSubmission: React.FC<AssignmentSubmissionProps> = ({ user, assignment, onBack }) => {
  const [submissionData, setSubmissionData] = useState<Partial<AssignmentSubmissionType>>({
    content: "",
    fileUrl: "",
  })
  const [existingSubmission, setExistingSubmission] = useState<AssignmentSubmissionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadExistingSubmission()
  }, [assignment.id, user.id])

  const loadExistingSubmission = async () => {
    try {
      const submission = await db.getSubmissionByAssignmentAndStudent(assignment.id, user.id)
      if (submission) {
        setExistingSubmission(submission)
        setSubmissionData({
          content: submission.content,
          fileUrl: submission.fileUrl
        })
      }
    } catch (error) {
      console.error("Failed to load existing submission:", error)
    }
  }

  const handleSubmit = async () => {
    if (!submissionData.content && !submissionData.fileUrl) {
      setError("Please provide your submission content")
      return
    }

    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    const isLate = now > dueDate

    if (isLate && !assignment.allowLateSubmission) {
      setError("This assignment is past due and late submissions are not allowed")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const submission: AssignmentSubmissionType = {
        id: existingSubmission?.id || Date.now().toString(),
        assignmentId: assignment.id,
        studentId: user.id,
        content: submissionData.content || "",
        fileUrl: submissionData.fileUrl,
        submittedAt: new Date(),
        grade: existingSubmission?.grade,
        feedback: existingSubmission?.feedback,
        gradedBy: existingSubmission?.gradedBy,
        gradedAt: existingSubmission?.gradedAt
      }

      await db.saveSubmission(submission)
      setSuccess("Assignment submitted successfully!")
      setExistingSubmission(submission)
    } catch (error) {
      console.error("Failed to submit assignment:", error)
      setError("Failed to submit assignment")
    } finally {
      setIsLoading(false)
    }
  }

  const isOverdue = new Date() > new Date(assignment.dueDate)
  const canSubmit = !isOverdue || assignment.allowLateSubmission

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-gray-600 mt-1">Submit your assignment</p>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid gap-8">
          {/* Assignment Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Details</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Due: {new Date(assignment.dueDate).toLocaleDateString()} at{" "}
                  {new Date(assignment.dueDate).toLocaleTimeString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {assignment.maxPoints} points
                </div>
                {isOverdue && (
                  <div className="flex items-center text-red-600 font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    Overdue
                  </div>
                )}
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">Submission types:</span>
                {assignment.submissionTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {type === "text" && <FileText className="w-3 h-3 mr-1" />}
                    {type === "file" && <Upload className="w-3 h-3 mr-1" />}
                    {type === "url" && <Link className="w-3 h-3 mr-1" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Form */}
          {canSubmit && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Submission</h2>

              <div className="space-y-6">
                {assignment.submissionTypes.includes("text") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Submission</label>
                    <textarea
                      value={submissionData.content || ""}
                      onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type your submission here..."
                    />
                  </div>
                )}

                {assignment.submissionTypes.includes("file") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Drag and drop your file here, or click to browse</p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          // In a real app, you'd handle file upload here
                          console.log("File selected:", e.target.files?.[0])
                        }}
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Choose File
                      </button>
                    </div>
                  </div>
                )}

                {assignment.submissionTypes.includes("url") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Submission</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={submissionData.fileUrl || ""}
                        onChange={(e) => setSubmissionData({ ...submissionData, fileUrl: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/your-work"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {existingSubmission ? "Update your submission" : "Submit your work"}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? "Submitting..." : existingSubmission ? "Update Submission" : "Submit Assignment"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Submission */}
          {existingSubmission && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900">Submission Received</h3>
              </div>
              <p className="text-green-700 mb-2">
                Submitted on {new Date(existingSubmission.submittedAt).toLocaleDateString()} at{" "}
                {new Date(existingSubmission.submittedAt).toLocaleTimeString()}
              </p>
              {existingSubmission.grade !== undefined && (
                <p className="text-green-700">
                  Grade: {existingSubmission.grade}/{assignment.maxPoints} points
                </p>
              )}
              {existingSubmission.feedback && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-2">Instructor Feedback:</h4>
                  <p className="text-gray-700">{existingSubmission.feedback}</p>
                </div>
              )}
            </div>
          )}

          {!canSubmit && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
              <Clock className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Assignment Overdue</h3>
              <p className="text-red-700">
                This assignment was due on {new Date(assignment.dueDate).toLocaleDateString()} and late submissions are
                not allowed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
