"use client"

import React from "react"
import { useAuth } from "@/components/AuthProvider"
import { DashboardHeader } from "./DashboardHeader"
import { useRouter, usePathname } from "next/navigation"
import {
  BookOpen,
  FileText,
  MessageCircle,
  Bell,
  BarChart3,
  Calendar,
  MessageSquare,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Book
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = "Smart LMS",
  subtitle
}) => {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: Book },
    { name: 'Gradebook', href: '/dashboard/gradebook', icon: GraduationCap },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle },
    { name: 'Discussions', href: '/dashboard/discussions', icon: MessageSquare },
    { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Scheduling', href: '/dashboard/scheduling', icon: Calendar },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ]

  const currentSubtitle = subtitle || (user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard')

  if (isLoading || !user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        title={title}
        subtitle={currentSubtitle}
        userName={user.name}
        userEmail={user.email}
        onLogout={logout}
      >
        <div className="hidden lg:flex items-center space-x-1 mr-4 overflow-x-auto">
          {navigation.slice(1, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`flex items-center px-3 py-1.5 rounded transition-colors text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {item.name}
              </button>
            )
          })}
        </div>
      </DashboardHeader>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for larger screens */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
