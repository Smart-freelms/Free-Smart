"use client"

import type React from "react"
import { useState } from "react"
import { BookOpen, GraduationCap, Eye, EyeOff } from "lucide-react"
import { signIn, signUp, verifyIdentityForReset, verifySecurityAnswer, completePasswordReset } from "../utils/auth"

interface AuthFormProps {
  onLogin: (user: any) => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null)
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
  })
  const [resetStep, setResetStep] = useState<"identity" | "security" | "newPassword" | "success">("identity")
  const [resetToken, setResetToken] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (authMode === "signup" && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!selectedRole && authMode !== "forgot") return

    setIsLoading(true)
    try {
      if (authMode === "signin") {
        const user = await signIn(formData.email, formData.password)
        onLogin(user)
      } else if (authMode === "signup") {
        const user = await signUp(formData.email, formData.password, formData.name, selectedRole!)
        onLogin(user)
      } else if (authMode === "forgot") {
        if (resetStep === "identity") {
          const token = await verifyIdentityForReset(formData.email, formData.name)
          setResetToken(token)
          setResetStep("security")
          setMessage("Identity verified. Please answer your security question.")
        } else if (resetStep === "security") {
          await verifySecurityAnswer(formData.email, formData.securityAnswer, resetToken)
          setResetStep("newPassword")
          setMessage("Security question verified. Please create a new password.")
        } else if (resetStep === "newPassword") {
          await completePasswordReset(formData.email, formData.password, formData.confirmPassword, resetToken)
          setResetStep("success")
          setMessage("Password reset successfully!")
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (authMode === "forgot") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">
              {resetStep === "identity" && "Verify your identity"}
              {resetStep === "security" && "Answer your security question"}
              {resetStep === "newPassword" && "Create a new password"}
              {resetStep === "success" && "Password reset successful"}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {["identity", "security", "newPassword", "success"].map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-all ${
                    resetStep === step
                      ? "bg-blue-500 scale-125"
                      : ["identity", "security", "newPassword", "success"].indexOf(resetStep) > index
                        ? "bg-green-500"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">{message}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {resetStep === "identity" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </>
            )}

            {resetStep === "security" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Security Question</label>
                <p className="text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">What was the name of your first pet?</p>
                <input
                  type="text"
                  required
                  value={formData.securityAnswer}
                  onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your answer"
                />
              </div>
            )}

            {resetStep === "newPassword" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}

            {resetStep === "success" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Complete</h3>
                <p className="text-gray-600 mb-6">Your password has been successfully updated.</p>
              </div>
            )}

            {resetStep !== "success" && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Processing..."
                  : resetStep === "identity"
                    ? "Verify Identity"
                    : resetStep === "security"
                      ? "Verify Answer"
                      : "Reset Password"}
              </button>
            )}

            {resetStep === "success" ? (
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl"
              >
                Sign In Now
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Sign In
              </button>
            )}
          </form>
        </div>
      </div>
    )
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Smart LMS
            </h1>
            <p className="text-xl text-gray-600">Choose your role to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div
              onClick={() => setSelectedRole("student")}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Student</h3>
                <p className="text-gray-600 mb-6">Take courses, complete assignments, and track your progress</p>
                <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              </div>
            </div>

            <div
              onClick={() => setSelectedRole("teacher")}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Teacher</h3>
                <p className="text-gray-600 mb-6">Create courses, manage students, and analyze performance</p>
                <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              selectedRole === "student"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                : "bg-gradient-to-r from-purple-500 to-pink-500"
            }`}
          >
            {selectedRole === "student" ? (
              <GraduationCap className="w-8 h-8 text-white" />
            ) : (
              <BookOpen className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {authMode === "signin" ? "Sign In" : "Sign Up"} as {selectedRole === "student" ? "Student" : "Teacher"}
          </h2>
          <button
            onClick={() => setSelectedRole(null)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to role selection
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {authMode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {authMode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              selectedRole === "student"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            } text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading
              ? authMode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : authMode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>

          <div className="text-center space-y-2">
            {authMode === "signin" ? (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Don't have an account? Sign up
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => setAuthMode("forgot")}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Forgot your password?
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
