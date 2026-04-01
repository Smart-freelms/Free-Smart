import type { User } from "../types"
import { db } from "./database"
import { supabase } from "./supabase"

// Simple hash function for demo - in production use bcrypt
const hashPassword = (password: string): string => {
  // Simple hash for demo - use bcrypt in production
  return btoa(password + "salt123")
}

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash
}

// JWT-like token generation for demo
const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  return btoa(JSON.stringify(payload))
}

const verifyToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp < Date.now()) {
      return null // Token expired
    }
    return payload
  } catch {
    return null
  }
}

export const getCurrentUser = (): User | null => {
  const token = localStorage.getItem("authToken")
  if (!token) return null

  const user = verifyToken(token)
  if (!user) {
    localStorage.removeItem("authToken")
    return null
  }

  return user
}

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    const token = generateToken(user)
    localStorage.setItem("authToken", token)
  } else {
    localStorage.removeItem("authToken")
  }
}

export const login = async (email: string, name: string, role: "student" | "teacher"): Promise<User> => {
  // Try Supabase first
  const { data: { session } } = await supabase.auth.getSession()

  let user = await db.getUserByEmail(email)

  if (!user) {
    user = {
      id: session?.user?.id || Date.now().toString(),
      name,
      email,
      role,
      createdAt: new Date(),
      isActive: true,
      password: "" // No local password needed if using Supabase
    }
    await db.saveUser(user)
  }

  setCurrentUser(user)
  return user
}

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: "student" | "teacher",
): Promise<User> => {
  // Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      }
    }
  })

  if (error) throw error
  if (!data.user) throw new Error("Sign up failed")

  const user: User = {
    id: data.user.id,
    name,
    email,
    role,
    password: hashPassword(password), // For local fallback
    createdAt: new Date(),
    isActive: true,
  }

  await db.saveUser(user)
  setCurrentUser(user)
  return user
}

export const signIn = async (email: string, password: string): Promise<User> => {
  // Sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Fallback to IndexedDB for offline support
    const user = await db.getUserByEmail(email)

    if (!user) {
      throw new Error("No account found with this email")
    }

    if (!verifyPassword(password, user.password)) {
      throw new Error("Invalid password")
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact administrator.")
    }

    setCurrentUser(user)
    return user
  }

  if (!data.user) throw new Error("Sign in failed")

  // Sync user data from Supabase to IndexedDB
  const user = await db.getUserById(data.user.id) || {
    id: data.user.id,
    email: data.user.email!,
    name: data.user.user_metadata.name || "",
    role: data.user.user_metadata.role || "student",
    password: hashPassword(password),
    createdAt: new Date(data.user.created_at),
    isActive: true,
  }

  await db.saveUser(user)
  setCurrentUser(user)
  return user
}

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut()
  setCurrentUser(null)
}

export const forgotPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error

  const user = await db.getUserByEmail(email)
  if (user) {
    user.password = hashPassword(newPassword)
    await db.saveUser(user)
  }
}

export const updateProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })

  if (error) {
    // Fallback to local update
    const user = await db.getUserById(userId)
    if (!user) throw new Error("User not found")
    const updatedUser = { ...user, ...updates }
    await db.saveUser(updatedUser)
    setCurrentUser(updatedUser)
    return updatedUser
  }

  const user = await db.getUserById(userId)
  if (!user) throw new Error("User not found")
  const updatedUser = { ...user, ...updates }
  await db.saveUser(updatedUser)
  setCurrentUser(updatedUser)
  return updatedUser
}

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}

export const hasRole = (requiredRole: "student" | "teacher"): boolean => {
  const user = getCurrentUser()
  return user?.role === requiredRole
}

export const verifyIdentityForReset = async (email: string, name: string): Promise<string> => {
  const user = await db.getUserByEmail(email)
  if (!user) {
    throw new Error("No account found with this email")
  }

  if (user.name.toLowerCase() !== name.toLowerCase()) {
    throw new Error("Name does not match our records")
  }

  // Generate a temporary reset token
  const resetToken = Math.random().toString(36).substring(2, 15)

  // In a real app, store this token with expiration
  localStorage.setItem(
    `resetToken_${email}`,
    JSON.stringify({
      token: resetToken,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      userId: user.id,
    }),
  )

  return resetToken
}

export const verifySecurityAnswer = async (email: string, answer: string, token: string): Promise<boolean> => {
  const user = await db.getUserByEmail(email)
  if (!user) {
    throw new Error("Invalid reset session")
  }

  const resetData = localStorage.getItem(`resetToken_${email}`)
  if (!resetData) {
    throw new Error("Reset session expired")
  }

  const { token: storedToken, expires } = JSON.parse(resetData)

  if (storedToken !== token || Date.now() > expires) {
    throw new Error("Reset session expired")
  }

  // For demo purposes, accept any non-empty answer
  // In production, this would verify against stored security answer
  if (!answer.trim()) {
    throw new Error("Security answer cannot be empty")
  }

  return true
}

export const completePasswordReset = async (
  email: string,
  newPassword: string,
  confirmPassword: string,
  token: string,
): Promise<void> => {
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match")
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long")
  }

  const user = await db.getUserByEmail(email)
  if (!user) {
    throw new Error("Invalid reset session")
  }

  const resetData = localStorage.getItem(`resetToken_${email}`)
  if (!resetData) {
    throw new Error("Reset session expired")
  }

  const { token: storedToken, expires } = JSON.parse(resetData)

  if (storedToken !== token || Date.now() > expires) {
    throw new Error("Reset session expired")
  }

  // Update password
  user.password = hashPassword(newPassword)
  await db.saveUser(user)

  // Clean up reset token
  localStorage.removeItem(`resetToken_${email}`)
}

export const refreshSession = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    const user = await db.getUserById(session.user.id)
    if (user && user.isActive) {
      setCurrentUser(user)
      return user
    }
  }

  const user = getCurrentUser()
  if (!user) return null

  // Refresh user data from database
  const freshUser = await db.getUserById(user.id)
  if (!freshUser || !freshUser.isActive) {
    await logout()
    return null
  }

  setCurrentUser(freshUser)
  return freshUser
}

export const logAuthEvent = async (userId: string, event: string, details?: Record<string, unknown>): Promise<void> => {
  const logEntry = {
    id: Date.now().toString(),
    userId,
    event,
    details,
    timestamp: new Date(),
    ip: "127.0.0.1", // In production, get real IP
  }

  await db.saveAuthLog(logEntry)

  // Sync log to Supabase
  await supabase.from('auth_logs').insert([logEntry])
}
