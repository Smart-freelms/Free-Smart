"use client"

import { useAuth } from "@/components/AuthProvider"
import { NotificationCenter } from "@/components/NotificationCenter"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function NotificationsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout title="Notifications" subtitle="Manage your alerts and preferences">
      <NotificationCenter user={user} onBack={() => {}} />
    </DashboardLayout>
  )
}
