"use client"

import { useAuth } from "@/components/AuthProvider"
import { GradeBook } from "@/components/GradeBook"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function GradeBookPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout title="Gradebook" subtitle="Monitor and manage student performance">
      <GradeBook user={user} onBack={() => {}} />
    </DashboardLayout>
  )
}
