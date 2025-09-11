"use client"

import { useEffect, useState } from "react"
import App from "../App"
import { db } from "../utils/database"

export default function Page() {
  const [isDbReady, setIsDbReady] = useState(false)

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await db.init()
        setIsDbReady(true)
      } catch (error) {
        console.error("Failed to initialize database:", error)
      }
    }

    initDatabase()
  }, [])

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return <App />
}
