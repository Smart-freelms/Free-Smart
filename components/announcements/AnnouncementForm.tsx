import React from "react"
import { Plus, Edit } from "lucide-react"

interface AnnouncementFormProps {
  title: string
  content: string
  isPinned: boolean
  isEditing: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onPinnedChange: (value: boolean) => void
  onSubmit: () => void
  onCancel: () => void
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  title,
  content,
  isPinned,
  isEditing,
  onTitleChange,
  onContentChange,
  onPinnedChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Announcement" : "Create New Announcement"}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your announcement content..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => onPinnedChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPinned" className="ml-3 text-sm font-medium text-gray-700">
              Pin this announcement (appears at the top)
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!title.trim() || !content.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? (
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
  )
}
