import type { User } from "../types"
import { db } from "./database"

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
  let user = await db.getUserByEmail(email)

  if (!user) {
    user = {
      id: Date.now().toString(),
      name,
      email,
      role,
      createdAt: new Date(),
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
  const existingUser = await db.getUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists with this email")
  }

  const hashedPassword = hashPassword(password)

  const user: User = {
    id: Date.now().toString(),
    name,
    email,
    role,
    password: hashedPassword,
    createdAt: new Date(),
    isActive: true,
  }

  await db.saveUser(user)
  setCurrentUser(user)
  return user
}

export const signIn = async (email: string, password: string): Promise<User> => {
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

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await db.getUserByEmail(email)
  if (!user) {
    throw new Error("No account found with this email")
  }

  // In a real app, this would send an email with reset link
  console.log(`Password reset link sent to ${email}`)
}

export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
  const user = await db.getUserByEmail(email)
  if (!user) {
    throw new Error("No account found with this email")
  }

  user.password = hashPassword(newPassword)
  await db.saveUser(user)
}

export const updateProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  const user = await db.getUserById(userId)
  if (!user) {
    throw new Error("User not found")
  }

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

export const logout = (): void => {
  setCurrentUser(null)
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
  const user = getCurrentUser()
  if (!user) return null

  // Refresh user data from database
  const freshUser = await db.getUserById(user.id)
  if (!freshUser || !freshUser.isActive) {
    logout()
    return null
  }

  setCurrentUser(freshUser)
  return freshUser
}

export const logAuthEvent = async (userId: string, event: string, details?: any): Promise<void> => {
  const logEntry = {
    id: Date.now().toString(),
    userId,
    event,
    details,
    timestamp: new Date(),
    ip: "127.0.0.1", // In production, get real IP
  }

  await db.saveAuthLog(logEntry)
}
