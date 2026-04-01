"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course, Announcement as DBAnnouncement } from "../types"
import { Plus } from "lucide-react"
import { db } from "../utils/database"
import { AnnouncementList, Announcement } from "./announcements/AnnouncementList"
import { AnnouncementForm } from "./announcements/AnnouncementForm"

interface AnnouncementSystemProps {
  user: User
  course?: Course
  onBack: () => void
}

export const AnnouncementSystem: React.FC<AnnouncementSystemProps> = ({ user, course, onBack }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formState, setFormState] = useState({
    title: "",
    content: "",
    isPinned: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [course?.id])

  const loadAnnouncements = async () => {
    try {
      const dbAnnouncements = await db.getAnnouncements(course?.id, user.role)
      const formatted: Announcement[] = dbAnnouncements.map((a: DBAnnouncement) => ({
        ...a,
        isPinned: a.isPinned || false,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt || a.createdAt,
      }))
      setAnnouncements(formatted)
    } catch (error) {
      console.error("Failed to load announcements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formState.title.trim() || !formState.content.trim()) return

    if (editingAnnouncement) {
      await db.updateAnnouncement(editingAnnouncement.id, {
        title: formState.title,
        content: formState.content,
        isPinned: formState.isPinned
      })
    } else {
      const announcementData = {
        courseId: course?.id || "general",
        createdBy: user.id,
        title: formState.title,
        content: formState.content,
        isPublished: true,
        isPinned: formState.isPinned,
      }

      await db.createAnnouncement(announcementData)

      // Notify Students
      if (course) {
        for (const studentId of course.students) {
          await db.saveNotification({
            id: crypto.randomUUID(),
            userId: studentId,
            title: "New Course Announcement",
            message: `New announcement in ${course.title}: ${formState.title}`,
            type: "announcement",
            isRead: false,
            createdAt: new Date()
          })
        }
      }
    }

    loadAnnouncements()
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      await db.deleteAnnouncement(id)
      loadAnnouncements()
    }
  }

  const handleTogglePin = async (id: string) => {
    const announcement = announcements.find(a => a.id === id)
    if (announcement) {
      await db.updateAnnouncement(id, { isPinned: !announcement.isPinned })
      loadAnnouncements()
    }
  }

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormState({
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingAnnouncement(null)
    setFormState({ title: "", content: "", isPinned: false })
    setShowForm(false)
  }

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">{course ? course.title : "General System Announcements"}</p>
        </div>
        {user.role === "teacher" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </button>
        )}
      </div>

      <AnnouncementList
        announcements={sortedAnnouncements}
        userRole={user.role}
        currentUserId={user.id}
        onTogglePin={handleTogglePin}
        onEdit={startEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <AnnouncementForm
          title={formState.title}
          content={formState.content}
          isPinned={formState.isPinned}
          isEditing={!!editingAnnouncement}
          onTitleChange={(title) => setFormState({ ...formState, title })}
          onContentChange={(content) => setFormState({ ...formState, content })}
          onPinnedChange={(isPinned) => setFormState({ ...formState, isPinned })}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}
    </div>
  )
}
