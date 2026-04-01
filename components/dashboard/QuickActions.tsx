import React from "react"
import { LucideIcon } from "lucide-react"

interface QuickActionProps {
  title: string
  icon: LucideIcon
  onClick: () => void
  color: string
}

const colorMap: Record<string, { bg: string; hoverBg: string; text: string }> = {
  blue: { bg: "bg-blue-50", hoverBg: "hover:bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-50", hoverBg: "hover:bg-green-100", text: "text-green-600" },
  yellow: { bg: "bg-yellow-50", hoverBg: "hover:bg-yellow-100", text: "text-yellow-600" },
  purple: { bg: "bg-purple-50", hoverBg: "hover:bg-purple-100", text: "text-purple-600" },
  orange: { bg: "bg-orange-50", hoverBg: "hover:bg-orange-100", text: "text-orange-600" },
  pink: { bg: "bg-pink-50", hoverBg: "hover:bg-pink-100", text: "text-pink-600" },
  teal: { bg: "bg-teal-50", hoverBg: "hover:bg-teal-100", text: "text-teal-600" },
  indigo: { bg: "bg-indigo-50", hoverBg: "hover:bg-indigo-100", text: "text-indigo-600" },
}

export const QuickAction: React.FC<QuickActionProps> = ({ title, icon: Icon, onClick, color }) => {
  const colors = colorMap[color] || colorMap.blue
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${colors.bg} ${colors.hoverBg}`}
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${colors.text}`} />
        <span className="font-medium text-gray-900">{title}</span>
      </div>
    </button>
  )
}

export const QuickActionsContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">
      {children}
    </div>
  </div>
)
