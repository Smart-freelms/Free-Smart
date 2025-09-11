"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "../types"
import { Bell, Check, Trash2, Settings, Calendar, Award, MessageSquare, X } from "lucide-react"
import { db } from "../utils/database"

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "assignment" | "grade" | "message" | "announcement" | "reminder" | "system"
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: Record<string, any>
}

interface NotificationCenterProps {
  user: User
  onBack: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, onBack }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
    messageNotifications: true,
    announcementNotifications: true,
  })

  useEffect(() => {
    loadNotifications()
    loadNotificationSettings()
  }, [])

  const loadNotifications = async () => {
    try {
      const userNotifications = await db.getNotifications(user.id)
      setNotifications(userNotifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const settings = await db.getNotificationSettings(user.id)
      if (settings) {
        setNotificationSettings(settings)
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await db.markNotificationAsRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await db.markAllNotificationsAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await db.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const saveNotificationSettings = async () => {
    try {
      await db.saveNotificationSettings(user.id, notificationSettings)
      setShowSettings(false)
    } catch (error) {
      console.error("Failed to save notification settings:", error)
    }
  }

  const getFilteredNotifications = () => {
    let filtered = notifications

    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.isRead)
    } else if (filter === "read") {
      filtered = filtered.filter((n) => n.isRead)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((n) => n.type === typeFilter)
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <Calendar className="w-5 h-5 text-blue-600" />
      case "grade":
        return <Award className="w-5 h-5 text-green-600" />
      case "message":
        return <MessageSquare className="w-5 h-5 text-purple-600" />
      case "announcement":
        return <Bell className="w-5 h-5 text-orange-600" />
      case "reminder":
        return <Calendar className="w-5 h-5 text-yellow-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={onBack} className="text-purple-600 hover:text-purple-700 mb-4 flex items-center">
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bell className="w-8 h-8 mr-3 text-purple-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded-full">{unreadCount}</span>
              )}
            </h1>
            <p className="text-gray-600">Stay updated with your learning activities</p>
          </div>
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="assignment">Assignments</option>
                <option value="grade">Grades</option>
                <option value="message">Messages</option>
                <option value="announcement">Announcements</option>
                <option value="reminder">Reminders</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            {getFilteredNotifications().length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.isRead ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${notification.isRead ? "text-gray-500" : "text-gray-700"}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                notification.type === "assignment"
                                  ? "bg-blue-100 text-blue-800"
                                  : notification.type === "grade"
                                    ? "bg-green-100 text-green-800"
                                    : notification.type === "message"
                                      ? "bg-purple-100 text-purple-800"
                                      : notification.type === "announcement"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {notification.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Assignment Reminders</label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.assignmentReminders}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        assignmentReminders: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Grade Notifications</label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.gradeNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        gradeNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Message Notifications</label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.messageNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        messageNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Announcement Notifications</label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.announcementNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        announcementNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex space-x-4">
                <button
                  onClick={saveNotificationSettings}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
