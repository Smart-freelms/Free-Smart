import React from "react"
import { MessageCircle, Pin } from "lucide-react"
import { DiscussionPost } from "@/types"
import { useUserNames } from "@/hooks/useUserNames"

interface ThreadListProps {
  posts: DiscussionPost[]
  selectedPostId?: string
  onSelectPost: (post: DiscussionPost) => void
  onGetRepliesCount: (postId: string) => number
  currentUserId: string
}

export const ThreadList: React.FC<ThreadListProps> = ({
  posts,
  selectedPostId,
  onSelectPost,
  onGetRepliesCount,
  currentUserId,
}) => {
  const { getUserName, getUserRole } = useUserNames()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Discussions</h2>

      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => onSelectPost(post)}
          className={`p-4 bg-white rounded-lg border-2 cursor-pointer transition-all ${
            selectedPostId === post.id ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300"
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
              <span>{onGetRepliesCount(post.id)}</span>
            </div>
          </div>
        </div>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No discussions found</p>
        </div>
      )}
    </div>
  )
}
