"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "../types"
import { ArrowLeft, Send, Search, MessageCircle } from "lucide-react"

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  sentAt: Date
  isRead: boolean
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  updatedAt: Date
}

interface MessagingSystemProps {
  user: User
  onBack: () => void
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ user, onBack }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConversations()
    loadAvailableUsers()
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      // Mock conversations - in a real app, you'd fetch from database
      const mockConversations: Conversation[] = [
        {
          id: "1",
          participants: [user.id, "teacher1"],
          lastMessage: {
            id: "m1",
            senderId: "teacher1",
            receiverId: user.id,
            content: "Great work on your latest assignment!",
            sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isRead: false,
          },
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: "2",
          participants: [user.id, "student1"],
          lastMessage: {
            id: "m2",
            senderId: user.id,
            receiverId: "student1",
            content: "Thanks for sharing those study notes!",
            sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            isRead: true,
          },
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ]
      setConversations(mockConversations)
    } catch (error) {
      console.error("Failed to load conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      // Mock users - in a real app, you'd fetch from database
      const mockUsers: User[] = [
        {
          id: "teacher1",
          name: "Dr. Smith",
          email: "dr.smith@university.edu",
          role: "teacher",
          password: "",
          createdAt: new Date(),
          isActive: true,
        },
        {
          id: "student1",
          name: "Alice Johnson",
          email: "alice@student.edu",
          role: "student",
          password: "",
          createdAt: new Date(),
          isActive: true,
        },
        {
          id: "student2",
          name: "Bob Wilson",
          email: "bob@student.edu",
          role: "student",
          password: "",
          createdAt: new Date(),
          isActive: true,
        },
      ]
      setAvailableUsers(mockUsers.filter((u) => u.id !== user.id))
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      // Mock messages - in a real app, you'd fetch from database
      const mockMessages: Message[] = [
        {
          id: "m1",
          senderId: "teacher1",
          receiverId: user.id,
          content: "Hi! I wanted to discuss your recent assignment submission.",
          sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          isRead: true,
        },
        {
          id: "m2",
          senderId: user.id,
          receiverId: "teacher1",
          content: "Thank you for reaching out! I'd be happy to discuss it.",
          sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          isRead: true,
        },
        {
          id: "m3",
          senderId: "teacher1",
          receiverId: user.id,
          content: "Great work on your latest assignment!",
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isRead: false,
        },
      ]
      setMessages(mockMessages)
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedConversation.participants.find((p) => p !== user.id)!,
      content: newMessage,
      sentAt: new Date(),
      isRead: false,
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Update conversation
    const updatedConversation = {
      ...selectedConversation,
      lastMessage: message,
      updatedAt: new Date(),
    }
    setConversations(conversations.map((c) => (c.id === selectedConversation.id ? updatedConversation : c)))
    setSelectedConversation(updatedConversation)
  }

  const startNewConversation = (userId: string) => {
    const existingConversation = conversations.find((c) => c.participants.includes(userId))
    if (existingConversation) {
      setSelectedConversation(existingConversation)
    } else {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        participants: [user.id, userId],
        updatedAt: new Date(),
      }
      setConversations([newConversation, ...conversations])
      setSelectedConversation(newConversation)
      setMessages([])
    }
    setShowNewConversation(false)
  }

  const getUserName = (userId: string) => {
    const foundUser = availableUsers.find((u) => u.id === userId)
    return foundUser?.name || `User ${userId}`
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p !== user.id)!
  }

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">Communicate with instructors and classmates</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            New Message
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversations</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation)
                const isSelected = selectedConversation?.id === conversation.id
                const hasUnread = conversation.lastMessage && !conversation.lastMessage.isRead

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
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

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getUserName(getOtherParticipant(selectedConversation))}
                  </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === user.id
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
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-500">Choose a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  {filteredUsers.map((availableUser) => (
                    <div
                      key={availableUser.id}
                      onClick={() => startNewConversation(availableUser.id)}
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
                  onClick={() => setShowNewConversation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
