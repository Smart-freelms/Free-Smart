import { supabase } from "./supabase"
import type { User } from "../types"
import { db } from "./database"

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const user = await db.getUserById(session.user.id)
  if (!user) {
    // If user is in Supabase Auth but not in local DB, we should sync it
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile) {
      const newUser: User = {
        id: session.user.id,
        name: profile.name || session.user.user_metadata.name || 'User',
        email: session.user.email!,
        role: profile.role || session.user.user_metadata.role || 'student',
        createdAt: new Date(session.user.created_at),
        isActive: true,
      }
      await db.saveUser(newUser)
      return newUser
    }
  }

  return user
}

export const login = async (email: string, name: string, role: "student" | "teacher"): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { name, role }
    }
  })

  if (error) throw error

  // This is a simplified version for the demo. In a real app,
  // we would wait for the OTP verification.
  let user = await db.getUserByEmail(email)
  if (!user) {
    user = {
      id: Date.now().toString(), // Will be updated by Supabase ID on session change
      name,
      email,
      role,
      createdAt: new Date(),
      isActive: true,
    }
  }

  return user
}

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: "student" | "teacher",
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role }
    }
  })

  if (error) throw error
  if (!data.user) throw new Error("Sign up failed")

  const user: User = {
    id: data.user.id,
    name,
    email,
    role,
    createdAt: new Date(),
    isActive: true,
  }

  // Save to local IndexedDB for immediate availability/offline support
  await db.saveUser(user)

  return user
}

export const signIn = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  if (!data.user) throw new Error("Sign in failed")

  let user = await db.getUserById(data.user.id)
  if (!user) {
    // Sync with Supabase if not in local DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    user = {
      id: data.user.id,
      name: profile?.name || data.user.user_metadata.name || 'User',
      email: data.user.email!,
      role: profile?.role || data.user.user_metadata.role || 'student',
      createdAt: new Date(data.user.created_at),
      isActive: true,
    }
    await db.saveUser(user)
  }

  return user
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
}

export const updateProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  const user = await db.getUserById(userId)
  if (!user) throw new Error("User not found")

  const updatedUser = { ...user, ...updates }
  await db.saveUser(updatedUser)

  // Sync to Supabase
  await supabase.from('profiles').update({
    name: updates.name,
    role: updates.role,
    bio: updates.bio,
    profile_picture: updates.profilePicture
  }).eq('id', userId)

  return updatedUser
}

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut()
}

export const verifyIdentityForReset = async (email: string, name: string): Promise<string> => {
  await forgotPassword(email)
  return "email_sent"
}

export const verifySecurityAnswer = async (email: string, answer: string, token: string): Promise<boolean> => {
  return true
}

export const completePasswordReset = async (
  email: string,
  newPassword: string,
  confirmPassword: string,
  token: string,
): Promise<void> => {
  if (newPassword !== confirmPassword) throw new Error("Passwords do not match")
  await resetPassword(email, newPassword)
}

export const refreshSession = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.refreshSession()
  if (!session) return null
  return getCurrentUser()
}

export const logAuthEvent = async (userId: string, event: string, details?: Record<string, unknown>): Promise<void> => {
  const logEntry = {
    id: crypto.randomUUID(),
    userId,
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: "127.0.0.1",
  }

  await db.saveAuthLog(logEntry as any)

  try {
    await supabase.from('auth_logs').insert({
      user_id: userId,
      event,
      details,
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    console.error("Failed to log auth event to Supabase:", e)
  }
}
