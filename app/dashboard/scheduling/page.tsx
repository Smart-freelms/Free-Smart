"use client"

import { useAuth } from "@/components/AuthProvider"
import { SchedulingSystem } from "@/components/SchedulingSystem"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function SchedulingPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout title="Scheduling" subtitle="Manage upcoming events and deadlines">
      <SchedulingSystem user={user} onBack={() => {}} />
    </DashboardLayout>
  )
}
