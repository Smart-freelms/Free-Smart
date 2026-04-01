import React from "react"
import { Megaphone, Calendar, Pin, Edit, Trash2 } from "lucide-react"
import { useUserNames } from "@/hooks/useUserNames"

export interface Announcement {
  id: string
  title: string
  content: string
  courseId?: string
  createdBy: string
  createdAt: string
  isPublished: boolean
  isPinned: boolean
  updatedAt?: string
}

interface AnnouncementListProps {
  announcements: Announcement[]
  userRole: "student" | "teacher"
  currentUserId: string
  onTogglePin: (id: string) => void
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  userRole,
  currentUserId,
  onTogglePin,
  onEdit,
  onDelete,
}) => {
  const { getUserName } = useUserNames()

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Announcements</h3>
        <p className="text-gray-500">
          {userRole === "teacher"
            ? "Create your first announcement to communicate with students."
            : "No announcements have been posted yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
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
                    <span className="font-medium">{getUserName(announcement.createdBy)}</span>
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

              {userRole === "teacher" && announcement.createdBy === currentUserId && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onTogglePin(announcement.id)}
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
                    onClick={() => onEdit(announcement)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(announcement.id)}
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

            {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
              <div className="mt-4 text-xs text-gray-400">
                Last updated: {new Date(announcement.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
