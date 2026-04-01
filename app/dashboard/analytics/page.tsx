"use client"

import { useAuth } from "@/components/AuthProvider"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function AnalyticsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout title="Analytics" subtitle="Track progress and performance metrics">
      <AnalyticsDashboard user={user} onBack={() => {}} />
    </DashboardLayout>
  )
}
