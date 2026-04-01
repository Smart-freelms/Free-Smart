"use client"

import { AuthForm } from "@/components/AuthForm"
import { useAuth } from "@/components/AuthProvider"

export default function AuthPage() {
  const { login } = useAuth()
  return <AuthForm onLogin={login} />
}
