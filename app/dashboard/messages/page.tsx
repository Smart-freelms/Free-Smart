"use client"

import { useAuth } from "@/components/AuthProvider"
import { MessagingSystem } from "@/components/MessagingSystem"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function MessagesPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout title="Messages" subtitle="Connect with your students and colleagues">
      <MessagingSystem user={user} onBack={() => {}} />
    </DashboardLayout>
  )
}
