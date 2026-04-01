import React from "react"
import { Search } from "lucide-react"
import { User } from "@/types"

interface NewConversationModalProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  users: User[]
  onSelectUser: (userId: string) => void
  onClose: () => void
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  searchTerm,
  onSearchChange,
  users,
  onSelectUser,
  onClose,
}) => {
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start New Conversation</h2>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            {filteredUsers.map((availableUser) => (
              <div
                key={availableUser.id}
                onClick={() => onSelectUser(availableUser.id)}
                className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{availableUser.name}</h3>
                    <p className="text-sm text-gray-600">{availableUser.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      availableUser.role === "teacher"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {availableUser.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
