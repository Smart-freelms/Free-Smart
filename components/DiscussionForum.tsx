"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, Course, DiscussionPost } from "../types"
import { Plus, Search, MessageCircle } from "lucide-react"
import { db } from "../utils/database"
import { ThreadList } from "./discussions/ThreadList"
import { PostContent } from "./discussions/PostContent"
import { NewPostModal } from "./discussions/NewPostModal"

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [course.id])

  const loadPosts = async () => {
    try {
      const dbPosts = await db.getDiscussionPosts(course.id)
      setPosts(dbPosts)
      return dbPosts
    } catch (error) {
      console.error("Failed to load posts:", error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async (title: string, content: string) => {
    await db.createDiscussionPost({
      id: crypto.randomUUID(),
      courseId: course.id,
      authorId: user.id,
      title: title,
      content: content,
    })

    await loadPosts()
    setShowNewPostForm(false)
  }

  const handleReply = async (postId: string, content: string) => {
    if (!content.trim()) return

    await db.createDiscussionPost({
      id: crypto.randomUUID(),
      courseId: course.id,
      authorId: user.id,
      content: content,
      parentId: postId
    })

    await loadPosts()
    if (selectedPost?.id === postId) {
      const updatedPosts = await db.getDiscussionPosts(course.id)
      const updatedPost = updatedPosts.find(p => p.id === postId)
      if (updatedPost) setSelectedPost(updatedPost)
    }
  }

    const updatedPosts = await loadPosts()

    // If the selected post itself was the one replied to, refresh it
    // although for root posts, only the replies list (calculated from all posts) changes.
    if (selectedPost?.id === postId) {
      const updatedPost = updatedPosts.find(p => p.id === postId)
      if (updatedPost) setSelectedPost(updatedPost)
    }
  }

  const filteredThreads = posts
    .filter((p) => !p.parentId)
    .filter(
      (post) =>
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()),
    )

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
          <h1 className="text-2xl font-bold text-gray-900">Discussion Forum</h1>
          <p className="text-gray-600">Course: {course.title}</p>
        </div>
        <button
          onClick={() => setShowNewPostForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Thread
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search discussions..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">
        <div className="lg:col-span-1">
          <ThreadList
            posts={filteredThreads}
            selectedPostId={selectedPost?.id}
            onSelectPost={(post) => setSelectedPost(post)}
            onGetRepliesCount={(id) => posts.filter(p => p.parentId === id).length}
            currentUserId={user.id}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedPost ? (
            <PostContent
              post={selectedPost}
              allPosts={posts}
              onReply={handleReply}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center h-full flex flex-col justify-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Discussion</h3>
              <p className="text-gray-500">Choose a thread from the list to view the full discussion</p>
            </div>
          )}
        </div>
      </div>

      {showNewPostForm && (
        <NewPostModal
          onClose={() => setShowNewPostForm(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  )
}
