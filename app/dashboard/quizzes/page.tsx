"use client"

import { useAuth } from "@/components/AuthProvider"
import { QuizCreator } from "@/components/QuizCreator"
import { QuizTaker } from "@/components/QuizTaker"
import { QuizResults } from "@/components/QuizResults"
import { useState, useEffect, Suspense } from "react"
import type { Quiz } from "@/types"
import { db } from "@/utils/database"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

function QuizzesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [view, setView] = useState<"list" | "create" | "edit" | "take" | "results">("list")
  const [editQuizId, setEditQuizId] = useState<string | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    if (user) loadQuizzes()
  }, [user])

  useEffect(() => {
    const viewParam = searchParams.get('view')
    const idParam = searchParams.get('id')
    if (viewParam === 'take' && idParam) {
      db.getQuizById(idParam).then(q => {
        if (q) {
          setSelectedQuiz(q)
          setView('take')
        }
      })
    } else if (viewParam === 'results' && idParam) {
      db.getQuizById(idParam).then(q => {
        if (q) {
          setSelectedQuiz(q)
          setView('results')
        }
      })
    } else if (viewParam === 'create') {
      setView('create')
    } else if (viewParam === 'edit' && idParam) {
      setEditQuizId(idParam)
      setView('edit')
    }
  }, [searchParams])

  const loadQuizzes = async () => {
    try {
      const loadedQuizzes = user?.role === "teacher"
        ? await db.getQuizzes(user.id, "teacher")
        : await db.getQuizzes(undefined, "student")
      setQuizzes(loadedQuizzes)
    } catch (error) {
      console.error("Failed to load quizzes:", error)
    }
  }

  if (!user) return null

  if (view === "create" || view === "edit") {
    return <QuizCreator user={user} editQuizId={editQuizId} onBack={() => { setView("list"); loadQuizzes(); }} />
  }

  if (view === "take" && selectedQuiz) {
    return <QuizTaker quiz={selectedQuiz} user={user} onComplete={() => setView("list")} />
  }

  if (view === "results" && selectedQuiz) {
    return <QuizResults quiz={selectedQuiz} user={user} onBack={() => setView("list")} />
  }

  return (
    <DashboardLayout title="Quizzes" subtitle="Test your knowledge and track progress">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Available Quizzes</h1>
        {user.role === "teacher" && (
          <button
            onClick={() => { setEditQuizId(null); setView("create"); }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            Create New Quiz
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h2>
            <p className="text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
            <div className="flex space-x-2">
              {user.role === "student" ? (
                <button
                  onClick={() => { setSelectedQuiz(quiz); setView("take"); }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Quiz
                </button>
              ) : (
                <button
                  onClick={() => { setEditQuizId(quiz.id); setView("edit"); }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Quiz
                </button>
              )}
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No quizzes available at the moment.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizzesContent />
    </Suspense>
  )
}
