"use client"

import { useState, useEffect } from "react"
import type { User } from "./types"
import { AuthForm } from "./components/AuthForm"
import { Dashboard } from "./components/Dashboard"
import { getCurrentUser, logout as authLogout } from "./utils/auth"
import { db } from "./utils/database"

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      await db.init()
      const currentUser = getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Failed to initialize app:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    authLogout()
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Smart LMS...</p> {/* Updated loading text for LMS */}
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onLogin={handleLogin} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
