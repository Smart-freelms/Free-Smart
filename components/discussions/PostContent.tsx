import React from "react"
import { DiscussionPost } from "@/types"
import { useUserNames } from "@/hooks/useUserNames"
import { DiscussionReply } from "./DiscussionReply"

interface PostContentProps {
  post: DiscussionPost
  allPosts: DiscussionPost[]
  onReply: (postId: string, content: string) => void
}

export const PostContent: React.FC<PostContentProps> = ({
  post,
  allPosts,
  onReply,
}) => {
  const { getUserName } = useUserNames()
  const [newReply, setNewReply] = React.useState("")

  const rootReplies = allPosts.filter(p => p.parentId === post.id)

  const handleReplySubmit = () => {
    if (!newReply.trim()) return
    onReply(post.id, newReply)
    setNewReply("")
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <span className="font-medium">{getUserName(post.authorId)}</span>
          <span>•</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{rootReplies.length} primary replies</span>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700">{post.content}</p>
        </div>
      </div>

      {/* Replies */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Replies ({allPosts.filter(p => p.parentId).length})
        </h3>

        <div className="space-y-4 mb-6">
          {rootReplies.map((reply) => (
            <DiscussionReply
              key={reply.id}
              reply={reply}
              allPosts={allPosts}
              onReply={onReply}
            />
          ))}
        </div>

        {/* Root Reply Form */}
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
                onClick={handleReplySubmit}
                disabled={!newReply.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
