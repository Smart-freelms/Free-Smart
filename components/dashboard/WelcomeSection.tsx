import React from "react"

interface WelcomeSectionProps {
  userName: string
  message: string
  gradient: string
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName, message, gradient }) => (
  <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-8 text-white mb-8`}>
    <h2 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h2>
    <p className="text-opacity-90 text-lg">{message}</p>
  </div>
)
