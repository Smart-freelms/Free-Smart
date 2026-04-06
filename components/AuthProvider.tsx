"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "../types"
import { getCurrentUser, logout as authLogout } from "../utils/auth"
import { db } from "../utils/database"
import { supabase } from "../utils/supabase"
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
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        // Supabase Auth Listener for synchronization
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const freshUser = await getCurrentUser()
            setUser(freshUser)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          } else if (event === 'USER_UPDATED' && session) {
            const freshUser = await getCurrentUser()
            setUser(freshUser)
          }
        })

        return () => subscription.unsubscribe()
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

  const logout = async () => {
    await authLogout()
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
