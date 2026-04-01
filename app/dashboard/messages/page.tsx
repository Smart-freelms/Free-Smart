"use client"

import { useAuth } from "@/components/AuthProvider"
import { MessagingSystem } from "@/components/MessagingSystem"
import { useRouter } from "next/navigation"

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return <MessagingSystem user={user} onBack={() => router.push('/dashboard')} />
}
