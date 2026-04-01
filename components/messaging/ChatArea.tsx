import React from "react"
import { Send, MessageCircle } from "lucide-react"
import { Message } from "@/types"
import { useUserNames } from "@/hooks/useUserNames"

interface ChatAreaProps {
  messages: {
    id: string
    senderId: string
    receiverId: string
    content: string
    sentAt: Date
    isRead: boolean
  }[]
  currentUserId: string
  receiverId?: string
  newMessage: string
  onNewMessageChange: (value: string) => void
  onSendMessage: () => void
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentUserId,
  receiverId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
}) => {
  const { getUserName } = useUserNames()

  if (!receiverId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Conversation</h3>
          <p className="text-gray-500">Choose a conversation to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {getUserName(receiverId)}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId
          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 border border-gray-200"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                  {new Date(message.sentAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
