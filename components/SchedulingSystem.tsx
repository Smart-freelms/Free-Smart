"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "../types"
import { Calendar, Clock, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import { db } from "../utils/database"

interface ScheduledEvent {
  id: string
  title: string
  description: string
  type: "quiz" | "assignment" | "course" | "announcement"
  entityId: string
  scheduledDate: string
  action: "publish" | "unpublish" | "due" | "reminder"
  isCompleted: boolean
  createdBy: string
  createdAt: string
}

interface SchedulingSystemProps {
  user: User
  onBack: () => void
}

export const SchedulingSystem: React.FC<SchedulingSystemProps> = ({ user, onBack }) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "quiz" as const,
    entityId: "",
    scheduledDate: "",
    action: "publish" as const,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const scheduledEvents = await db.getScheduledEvents(user.id)
      setEvents(scheduledEvents)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const eventData: Omit<ScheduledEvent, "id" | "createdAt" | "isCompleted"> = {
        ...formData,
        createdBy: user.id,
      }

      if (editingEvent) {
        await db.updateScheduledEvent(editingEvent.id, eventData)
      } else {
        await db.createScheduledEvent(eventData)
      }

      await loadEvents()
      resetForm()
    } catch (error) {
      console.error("Failed to save event:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "quiz",
      entityId: "",
      scheduledDate: "",
      action: "publish",
    })
    setShowCreateForm(false)
    setEditingEvent(null)
  }

  const handleEdit = (event: ScheduledEvent) => {
    setFormData({
      title: event.title,
      description: event.description,
      type: event.type,
      entityId: event.entityId,
      scheduledDate: event.scheduledDate,
      action: event.action,
    })
    setEditingEvent(event)
    setShowCreateForm(true)
  }

  const handleDelete = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this scheduled event?")) {
      try {
        await db.deleteScheduledEvent(eventId)
        await loadEvents()
      } catch (error) {
        console.error("Failed to delete event:", error)
      }
    }
  }

  const markCompleted = async (eventId: string) => {
    try {
      await db.updateScheduledEvent(eventId, { isCompleted: true })
      await loadEvents()
    } catch (error) {
      console.error("Failed to mark event as completed:", error)
    }
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter((event) => !event.isCompleted && new Date(event.scheduledDate) > now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }

  const getPastEvents = () => {
    const now = new Date()
    return events
      .filter((event) => event.isCompleted || new Date(event.scheduledDate) <= now)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={onBack} className="text-purple-600 hover:text-purple-700 mb-4 flex items-center">
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Scheduling System</h1>
            <p className="text-gray-600">Manage automated publishing and notifications</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Event
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEvent ? "Edit Scheduled Event" : "Create Scheduled Event"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="course">Course</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="publish">Publish</option>
                    <option value="unpublish">Unpublish</option>
                    <option value="due">Due Date Reminder</option>
                    <option value="reminder">General Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity ID (Optional)</label>
                <input
                  type="text"
                  value={formData.entityId}
                  onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                  placeholder="ID of quiz, assignment, or course"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingEvent ? "Update Event" : "Schedule Event"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Upcoming Events
            </h3>
          </div>
          <div className="p-6">
            {getUpcomingEvents().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming scheduled events</p>
            ) : (
              <div className="space-y-4">
                {getUpcomingEvents().map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(event.scheduledDate).toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {event.type} - {event.action}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => markCompleted(event.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Past Events */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Past & Completed Events
            </h3>
          </div>
          <div className="p-6">
            {getPastEvents().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No past events</p>
            ) : (
              <div className="space-y-4">
                {getPastEvents()
                  .slice(0, 10)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-75"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(event.scheduledDate).toLocaleString()}
                          </span>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                            {event.type} - {event.action}
                          </span>
                          {event.isCompleted && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
