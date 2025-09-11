import type React from "react"
import { getCurrentUser } from "../utils/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "student" | "teacher"
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, fallback }) => {
  const user = getCurrentUser()

  if (!user) {
    return fallback || <div className="text-center p-8">Please log in to access this page.</div>
  }

  if (requiredRole && user.role !== requiredRole) {
    return fallback || <div className="text-center p-8">You don't have permission to access this page.</div>
  }

  return <>{children}</>
}
