"use client"

import { useAuth } from "@/components/AuthProvider"
import { AnnouncementSystem } from "@/components/AnnouncementSystem"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"

export default function AnnouncementsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout title="Announcements" subtitle="Stay updated with the latest news">
      <AnnouncementSystem user={user} onBack={() => {}} />
    </DashboardLayout>
  )
}
