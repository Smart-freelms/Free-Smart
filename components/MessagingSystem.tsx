"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "../types"
import { MessageCircle } from "lucide-react"
import { db } from "../utils/database"
import { ConversationList, Conversation } from "./messaging/ConversationList"
import { ChatArea } from "./messaging/ChatArea"
import { NewConversationModal } from "./messaging/NewConversationModal"

interface MessagingSystemProps {
  user: User
  onBack: () => void
}

interface MessageInternal {
  id: string
  senderId: string
  receiverId: string
  content: string
  sentAt: Date
  isRead: boolean
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({ user, onBack }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageInternal[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConversations()
    loadAvailableUsers()
  }, [user.id])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      const dbMessages = await db.getMessages(user.id)
      const convMap = new Map<string, Conversation>()

      dbMessages.forEach(msg => {
        const otherId = msg.senderId === user.id ? msg.receiverId : msg.senderId
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            id: otherId,
            participants: [user.id, otherId],
            lastMessage: {
              id: msg.id,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: msg.content,
              sentAt: new Date(msg.createdAt),
              isRead: msg.isRead
            },
            updatedAt: new Date(msg.createdAt)
          })
        }
      })

      setConversations(Array.from(convMap.values()))
    } catch (error) {
      console.error("Failed to load conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const users = await db.getAllUsers()
      setAvailableUsers(users.filter((u) => u.id !== user.id))
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const dbMessages = await db.getMessages(user.id)
      const filtered = dbMessages
        .filter(m => m.senderId === conversationId || m.receiverId === conversationId)
        .map(m => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          content: m.content,
          sentAt: new Date(m.createdAt),
          isRead: m.isRead
        }))
      setMessages(filtered.reverse())
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const receiverId = selectedConversation.participants.find((p) => p !== user.id)!

    await db.sendMessage({
      senderId: user.id,
      receiverId,
      subject: "Direct Message",
      content: newMessage
    })

    setNewMessage("")
    loadMessages(selectedConversation.id)
    loadConversations()
  }

  const startNewConversation = (userId: string) => {
    const existingConversation = conversations.find((c) => c.participants.includes(userId))
    if (existingConversation) {
      setSelectedConversation(existingConversation)
    } else {
      const newConversation: Conversation = {
        id: userId, // Using userId as conversationId for simple direct messaging
        participants: [user.id, userId],
        updatedAt: new Date(),
      }
      setConversations([newConversation, ...conversations])
      setSelectedConversation(newConversation)
      setMessages([])
    }
    setShowNewConversation(false)
    setUserSearchTerm("")
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Direct Messages</h1>
          <p className="text-gray-600">Private communication with others</p>
        </div>
        <button
          onClick={() => setShowNewConversation(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          New Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        <div className="lg:col-span-1 h-full overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={setSelectedConversation}
            currentUserId={user.id}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <div className="lg:col-span-2 h-full overflow-hidden">
          <ChatArea
            messages={messages}
            currentUserId={user.id}
            receiverId={selectedConversation?.participants.find(p => p !== user.id)}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {showNewConversation && (
        <NewConversationModal
          searchTerm={userSearchTerm}
          onSearchChange={setUserSearchTerm}
          users={availableUsers}
          onSelectUser={startNewConversation}
          onClose={() => setShowNewConversation(false)}
        />
      )}
    </div>
  )
}
