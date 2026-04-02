"use client"

import { useAuth } from "@/components/AuthProvider"
import { AnnouncementSystem } from "@/components/AnnouncementSystem"
import { useRouter } from "next/navigation"

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <div>
      <AnnouncementSystem user={user} onBack={() => router.push('/dashboard')} />
    </div>
  )
}
