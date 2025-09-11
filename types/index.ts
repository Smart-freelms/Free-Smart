export interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher"
  password: string // Added password field for authentication
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
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  answers: Record<string, any>
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
  quiz: Quiz
  detailedResults: {
    questionId: string
    question: string
    userAnswer: any
    correctAnswer: any
    isCorrect: boolean
    points: number
    maxPoints: number
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
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  content: string
  fileUrl?: string
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
  replies: DiscussionReply[]
  createdAt: Date
  updatedAt: Date
}

export interface DiscussionReply {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: Date
}
