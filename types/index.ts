export interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher"
  createdAt: Date
  isActive: boolean // Added active status for account management
  profilePicture?: string // Added optional profile picture
  bio?: string // Added optional bio
}

export interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank"
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
  timeLimit?: number
}

export interface Quiz {
  id: string
  title: string
  description: string
  createdBy: string
  questions: Question[]
  timeLimit?: number
  allowRetry: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean
  passingScore: number
  createdAt: Date
  updatedAt: Date
  isPublished: boolean
  scheduledPublishDate?: string
  scheduledExpiryDate?: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  answers: Record<string, string | string[]>
  score: number
  totalPoints: number
  percentage: number
  startTime: Date
  endTime: Date
  timeSpent: number
  passed: boolean
}

export interface QuizResult {
  attempt: QuizAttempt
  quiz?: Quiz
  earnedPoints?: number
  totalPoints?: number
  percentage?: number
  passed?: boolean
  detailedResults: {
    questionId: string
    question: string
    userAnswer: string | string[]
    correctAnswer: string | string[]
    isCorrect: boolean
    points: number
    maxPoints: number
    explanation?: string
  }[]
}

export interface Course {
  id: string
  title: string
  description: string
  createdBy: string
  students: string[]
  quizzes: string[]
  assignments: string[]
  materials: CourseMaterial[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  scheduledPublishDate?: string
  scheduledExpiryDate?: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  createdBy: string
  dueDate: Date
  maxPoints: number
  allowLateSubmission: boolean
  submissionTypes: ("text" | "file" | "url")[]
  createdAt: Date
  updatedAt: Date
  scheduledPublishDate?: string
  scheduledExpiryDate?: string
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  content: string
  fileUrl?: string
  fileData?: {
    name: string
    size: number
    type: string
    content: ArrayBuffer | string
  }
  submittedAt: Date
  grade?: number
  feedback?: string
  gradedBy?: string
  gradedAt?: Date
}

export interface CourseMaterial {
  id: string
  title: string
  type: "document" | "video" | "link" | "image" | "file"
  url?: string // Optional for uploaded files
  fileData?: {
    name: string
    size: number
    type: string
    content: ArrayBuffer | string
    lastModified: number
  }
  description?: string
  uploadedAt: Date
  isSelected?: boolean // For bulk operations
  downloadCount?: number
  tags?: string[]
  scheduledPublishDate?: string
  scheduledExpiryDate?: string
}

export interface FileUploadProgress {
  id: string
  fileName: string
  progress: number
  status: "uploading" | "completed" | "error"
  error?: string
}

export interface BulkMaterialOperation {
  type: "download" | "delete" | "move"
  materialIds: string[]
  targetFolder?: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  createdAt: Date
}

export interface DiscussionPost {
  id: string
  courseId: string
  authorId: string
  title: string
  content: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface ScheduledEvent {
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

export interface NotificationSettings {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  assignmentReminders: boolean
  gradeNotifications: boolean
  messageNotifications: boolean
  announcementNotifications: boolean
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  subject: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  courseId?: string
  createdBy: string
  createdAt: string
  isPublished: boolean
  updatedAt?: string
}

export interface AuthLog {
  id: string
  userId: string
  event: string
  details?: Record<string, unknown>
  timestamp: string
  ip: string
}

export interface UserSession {
  id: string
  userId: string
  token: string
  createdAt: string
  expiresAt: string
  isActive: boolean
  deviceInfo?: string
}
