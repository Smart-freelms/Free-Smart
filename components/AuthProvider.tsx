"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "../types"
import { getCurrentUser, logout as authLogout } from "../utils/auth"
import { db } from "../utils/database"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      try {
        await db.init()
        const currentUser = getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Auth init error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/auth") {
        router.push("/auth")
      } else if (user && pathname === "/auth") {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, pathname, router])

  const login = (loggedInUser: User) => {
    setUser(loggedInUser)
    router.push("/dashboard")
  }

  const logout = () => {
    authLogout()
    setUser(null)
    router.push("/auth")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
