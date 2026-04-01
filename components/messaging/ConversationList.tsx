import React from "react"
import { Search, MessageCircle } from "lucide-react"
import { User } from "@/types"
import { useUserNames } from "@/hooks/useUserNames"

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: {
    content: string
    sentAt: Date
    isRead: boolean
  }
  updatedAt: Date
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId?: string
  onSelectConversation: (conversation: Conversation) => void
  currentUserId: string
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
  searchTerm,
  onSearchChange,
}) => {
  const { getUserName } = useUserNames()

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p !== currentUserId)!
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversations</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation)
          const isSelected = selectedConversationId === conversation.id
          const hasUnread = conversation.lastMessage && !conversation.lastMessage.isRead

          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{getUserName(otherParticipant)}</h3>
                {hasUnread && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
              </div>
              {conversation.lastMessage && (
                <p className="text-sm text-gray-600 line-clamp-2">{conversation.lastMessage.content}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {conversation.lastMessage
                  ? new Date(conversation.lastMessage.sentAt).toLocaleDateString()
                  : "No messages yet"}
              </p>
            </div>
          )
        })}

        {conversations.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
