"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course } from "../types"
import { ArrowLeft, Plus, Megaphone, Calendar, Pin, Edit, Trash2 } from "lucide-react"

interface Announcement {
  id: string
  courseId: string
  authorId: string
  title: string
  content: string
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

interface AnnouncementSystemProps {
  user: User
  course?: Course
  onBack: () => void
}

export const AnnouncementSystem: React.FC<AnnouncementSystemProps> = ({ user, course, onBack }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    isPinned: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [course])

  const loadAnnouncements = async () => {
    try {
      // Mock announcements - in a real app, you'd fetch from database
      const mockAnnouncements: Announcement[] = [
        {
          id: "1",
          courseId: course?.id || "general",
          authorId: "teacher1",
          title: "Welcome to the New Semester!",
          content:
            "Welcome everyone to our course! I'm excited to have you all here. Please make sure to check the syllabus and upcoming assignments. If you have any questions, feel free to reach out during office hours or through the discussion forum.",
          isPinned: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          courseId: course?.id || "general",
          authorId: "teacher1",
          title: "Assignment 1 Due Date Extended",
          content:
            "Due to the technical issues some students experienced, I'm extending the due date for Assignment 1 by 48 hours. The new due date is Friday, March 15th at 11:59 PM.",
          isPinned: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "3",
          courseId: course?.id || "general",
          authorId: "teacher1",
          title: "Office Hours This Week",
          content:
            "My office hours this week will be Tuesday and Thursday from 2-4 PM in room 301. You can also schedule a virtual meeting if needed.",
          isPinned: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ]
      setAnnouncements(mockAnnouncements)
    } catch (error) {
      console.error("Failed to load announcements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return

    const announcement: Announcement = {
      id: Date.now().toString(),
      courseId: course?.id || "general",
      authorId: user.id,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      isPinned: newAnnouncement.isPinned,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setAnnouncements([announcement, ...announcements])
    setNewAnnouncement({ title: "", content: "", isPinned: false })
    setShowCreateForm(false)
  }

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return

    const updatedAnnouncement: Announcement = {
      ...editingAnnouncement,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      isPinned: newAnnouncement.isPinned,
      updatedAt: new Date(),
    }

    setAnnouncements(announcements.map((a) => (a.id === editingAnnouncement.id ? updatedAnnouncement : a)))
    setEditingAnnouncement(null)
    setNewAnnouncement({ title: "", content: "", isPinned: false })
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setAnnouncements(announcements.filter((a) => a.id !== announcementId))
    }
  }

  const togglePin = async (announcementId: string) => {
    setAnnouncements(
      announcements.map((a) => (a.id === announcementId ? { ...a, isPinned: !a.isPinned, updatedAt: new Date() } : a)),
    )
  }

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
    })
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setEditingAnnouncement(null)
    setNewAnnouncement({ title: "", content: "", isPinned: false })
    setShowCreateForm(false)
  }

  const getUserName = (userId: string) => {
    // In a real app, you'd fetch user names from database
    return userId === user.id ? user.name : "Dr. Smith"
  }

  // Sort announcements: pinned first, then by creation date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
              <p className="text-gray-600 mt-1">{course ? course.title : "General Announcements"}</p>
            </div>
          </div>
          {user.role === "teacher" && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </button>
          )}
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {sortedAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
                announcement.isPinned ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        announcement.isPinned ? "bg-yellow-100" : "bg-blue-100"
                      }`}
                    >
                      {announcement.isPinned ? (
                        <Pin className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Megaphone className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{announcement.title}</h2>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                        <span className="font-medium">{getUserName(announcement.authorId)}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </div>
                        {announcement.isPinned && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-600 font-medium">Pinned</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.role === "teacher" && announcement.authorId === user.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => togglePin(announcement.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          announcement.isPinned
                            ? "text-yellow-600 hover:bg-yellow-100"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={announcement.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(announcement)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                </div>

                {announcement.updatedAt.getTime() !== announcement.createdAt.getTime() && (
                  <div className="mt-4 text-xs text-gray-400">
                    Last updated: {new Date(announcement.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Announcements</h3>
              <p className="text-gray-500">
                {user.role === "teacher"
                  ? "Create your first announcement to communicate with students."
                  : "No announcements have been posted yet."}
              </p>
            </div>
          )}
        </div>

        {/* Create/Edit Announcement Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your announcement content..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={newAnnouncement.isPinned}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPinned" className="ml-3 text-sm font-medium text-gray-700">
                    Pin this announcement (appears at the top)
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                  disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingAnnouncement ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
