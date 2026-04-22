import { useState, useEffect } from "react"
import { db } from "../utils/database"

export const useUserNames = () => {
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const users = await db.getAllUsers()
        const names: Record<string, string> = {}
        const roles: Record<string, string> = {}
        users.forEach((u) => {
          names[u.id] = u.name
          roles[u.id] = u.role
        })
        setUserNames(names)
        setUserRoles(roles)
      } catch (error) {
        console.error("Failed to fetch user names:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNames()
  }, [])

  const getUserName = (userId: string) => {
    return userNames[userId] || `User ${userId.slice(0, 4)}`
  }

  const getUserRole = (userId: string) => {
    return userRoles[userId] || "student"
  }

  return { getUserName, getUserRole, isLoading, userNames, userRoles }
}
