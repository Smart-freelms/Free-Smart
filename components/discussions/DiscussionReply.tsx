import React from "react"
import { DiscussionPost } from "@/types"
import { useUserNames } from "@/hooks/useUserNames"
import { Send } from "lucide-react"

interface DiscussionReplyProps {
  reply: DiscussionPost
  allPosts: DiscussionPost[]
  onReply: (postId: string, content: string) => void
  depth?: number
}

export const DiscussionReply: React.FC<DiscussionReplyProps> = ({
  reply,
  allPosts,
  onReply,
  depth = 0
}) => {
  const { getUserName } = useUserNames()
  const [showReplyForm, setShowReplyForm] = React.useState(false)
  const [replyContent, setReplyContent] = React.useState("")

  const childReplies = allPosts.filter(p => p.parentId === reply.id)

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return
    onReply(reply.id, replyContent)
    setReplyContent("")
    setShowReplyForm(false)
  }

  return (
    <div className={`mt-4 ${depth > 0 ? "ml-6" : ""}`}>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          <span className="font-medium text-gray-900">{getUserName(reply.authorId)}</span>
          <span className="text-sm text-gray-500">
            {new Date(reply.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-gray-700">{reply.content}</p>

        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Reply
        </button>

        {showReplyForm && (
          <div className="mt-3 flex space-x-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Write a reply..."
            />
            <button
              onClick={handleReplySubmit}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {childReplies.length > 0 && (
        <div className="border-l-2 border-gray-100 ml-2">
          {childReplies.map(child => (
            <DiscussionReply
              key={child.id}
              reply={child}
              allPosts={allPosts}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
