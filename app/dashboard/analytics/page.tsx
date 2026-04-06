"use client"

import { useAuth } from "@/components/AuthProvider"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { useRouter } from "next/navigation"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <div>
      <AnalyticsDashboard user={user} onBack={() => router.push('/dashboard')} />
    </div>
  )
}
