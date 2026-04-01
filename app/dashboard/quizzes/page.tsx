"use client"

import { useAuth } from "@/components/AuthProvider"
import { QuizCreator } from "@/components/QuizCreator"
import { QuizTaker } from "@/components/QuizTaker"
import { QuizResults } from "@/components/QuizResults"
import { useState, useEffect, Suspense } from "react"
import { Quiz } from "@/types"
import { db } from "@/utils/database"
import { useRouter, useSearchParams } from "next/navigation"

function QuizzesContent() {
  const { user } = useAuth()
  const router = useRouter()
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
      const loadedQuizzes = user?.role === "teacher" ? await db.getQuizzes(user.id) : await db.getQuizzes()
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quizzes</h1>
      {user.role === "teacher" && (
        <button
          onClick={() => { setEditQuizId(null); setView("create"); }}
          className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Create New Quiz
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
            <p className="text-gray-600 mb-4">{quiz.description}</p>
            <div className="flex space-x-2">
              {user.role === "student" ? (
                <button
                  onClick={() => { setSelectedQuiz(quiz); setView("take"); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Take Quiz
                </button>
              ) : (
                <button
                  onClick={() => { setEditQuizId(quiz.id); setView("edit"); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizzesContent />
    </Suspense>
  )
}
