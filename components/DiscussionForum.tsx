"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course, DiscussionPost, DiscussionReply } from "../types"
import { ArrowLeft, Plus, MessageCircle, Send, Search, Pin } from "lucide-react"

interface DiscussionForumProps {
  user: User
  course: Course
  onBack: () => void
}

export const DiscussionForum: React.FC<DiscussionForumProps> = ({ user, course, onBack }) => {
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null)
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newPost, setNewPost] = useState({ title: "", content: "" })
  const [newReply, setNewReply] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [course.id])

  const loadPosts = async () => {
    try {
      const dbPosts = await db.getDiscussionPosts(course.id)
      setPosts(dbPosts)
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return

    await db.createDiscussionPost({
      courseId: course.id,
      authorId: user.id,
      title: newPost.title,
      content: newPost.content,
      replies: []
    })

    loadPosts()
    setNewPost({ title: "", content: "" })
    setShowNewPostForm(false)
  }

  const handleReply = async (postId: string) => {
    if (!newReply.trim()) return

    const postToUpdate = posts.find(p => p.id === postId)
    if (!postToUpdate) return

    const updatedPost = {
      ...postToUpdate,
      replies: [
        ...postToUpdate.replies,
        {
          id: Date.now().toString(),
          postId,
          authorId: user.id,
          content: newReply,
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    }

    await db.createDiscussionPost(updatedPost)
    loadPosts()
    if (selectedPost?.id === postId) {
      setSelectedPost(updatedPost)
    }
    setNewReply("")
  }

  const getUserName = (userId: string) => {
    return `User ${userId.slice(0, 4)}`
  }

  const getUserRole = (userId: string) => {
    // In a real app, you'd fetch user roles from database
    return userId === "teacher1" || userId === user.id ? user.role : "student"
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()),
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
              <h1 className="text-3xl font-bold text-gray-900">Discussion Forum</h1>
              <p className="text-gray-600 mt-1">{course.title}</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewPostForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Discussions</h2>

            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`p-4 bg-white rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPost?.id === post.id ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                  {getUserRole(post.authorId) === "teacher" && (
                    <Pin className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                  )}
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">{getUserName(post.authorId)}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    <span>{post.replies.length}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No discussions found</p>
              </div>
            )}
          </div>

          {/* Post Detail */}
          <div className="lg:col-span-2">
            {selectedPost ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                {/* Post Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h1>
                    {getUserRole(selectedPost.authorId) === "teacher" && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Instructor
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="font-medium">{getUserName(selectedPost.authorId)}</span>
                    <span>•</span>
                    <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{selectedPost.replies.length} replies</span>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700">{selectedPost.content}</p>
                  </div>
                </div>

                {/* Replies */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Replies ({selectedPost.replies.length})</h3>

                  <div className="space-y-4 mb-6">
                    {selectedPost.replies.map((reply) => (
                      <div key={reply.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium text-gray-900">{getUserName(reply.authorId)}</span>
                          {getUserRole(reply.authorId) === "teacher" && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Instructor
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Add a Reply</h4>
                    <div className="space-y-4">
                      <textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Write your reply..."
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleReply(selectedPost.id)}
                          disabled={!newReply.trim()}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Post Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Discussion</h3>
                <p className="text-gray-500">Choose a post from the list to view the full discussion</p>
              </div>
            )}
          </div>
        </div>

        {/* New Post Modal */}
        {showNewPostForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Create New Discussion</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter discussion title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your discussion content..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewPostForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
