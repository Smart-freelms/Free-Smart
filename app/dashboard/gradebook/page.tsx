"use client"

import { useAuth } from "@/components/AuthProvider"
import { GradeBook } from "@/components/GradeBook"
import { useRouter } from "next/navigation"

export default function GradeBookPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <div>
      <GradeBook user={user} onBack={() => router.push('/dashboard')} />
    </div>
  )
}
