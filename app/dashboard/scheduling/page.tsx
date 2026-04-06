"use client"

import { useAuth } from "@/components/AuthProvider"
import { SchedulingSystem } from "@/components/SchedulingSystem"
import { useRouter } from "next/navigation"

export default function SchedulingPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <div>
      <SchedulingSystem user={user} onBack={() => router.push('/dashboard')} />
    </div>
  )
}
