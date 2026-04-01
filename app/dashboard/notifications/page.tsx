"use client"

import { useAuth } from "@/components/AuthProvider"
import { NotificationCenter } from "@/components/NotificationCenter"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return <NotificationCenter user={user} onBack={() => router.push('/dashboard')} />
}
