import type {
  Quiz,
  User,
  QuizAttempt,
  Course,
  Assignment,
  Notification,
  ScheduledEvent,
  NotificationSettings,
  Message,
  Announcement,
  DiscussionPost,
  AuthLog,
  UserSession,
  AssignmentSubmission,
} from "../types"

class QuizDatabase {
  private dbName = "LMSAppDB" // Updated database name for LMS
  private version = 4 // Incremented version for new scheduling and notification stores
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Users store
        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "id" })
          userStore.createIndex("email", "email", { unique: true })
        }

        // Quizzes store
        if (!db.objectStoreNames.contains("quizzes")) {
          const quizStore = db.createObjectStore("quizzes", { keyPath: "id" })
          quizStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        // Quiz attempts store
        if (!db.objectStoreNames.contains("attempts")) {
          const attemptStore = db.createObjectStore("attempts", { keyPath: "id" })
          attemptStore.createIndex("userId", "userId", { unique: false })
          attemptStore.createIndex("quizId", "quizId", { unique: false })
        }

        // Courses store
        if (!db.objectStoreNames.contains("courses")) {
          const courseStore = db.createObjectStore("courses", { keyPath: "id" })
          courseStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        // Assignments store
        if (!db.objectStoreNames.contains("assignments")) {
          const assignmentStore = db.createObjectStore("assignments", { keyPath: "id" })
          assignmentStore.createIndex("courseId", "courseId", { unique: false })
          assignmentStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        // Assignment submissions store
        if (!db.objectStoreNames.contains("submissions")) {
          const submissionStore = db.createObjectStore("submissions", { keyPath: "id" })
          submissionStore.createIndex("assignmentId", "assignmentId", { unique: false })
          submissionStore.createIndex("studentId", "studentId", { unique: false })
        }

        // Notifications store
        if (!db.objectStoreNames.contains("notifications")) {
          const notificationStore = db.createObjectStore("notifications", { keyPath: "id" })
          notificationStore.createIndex("userId", "userId", { unique: false })
        }

        // Discussion posts store
        if (!db.objectStoreNames.contains("discussions")) {
          const discussionStore = db.createObjectStore("discussions", { keyPath: "id" })
          discussionStore.createIndex("courseId", "courseId", { unique: false })
          discussionStore.createIndex("authorId", "authorId", { unique: false })
        }

        // Scheduled events store
        if (!db.objectStoreNames.contains("scheduledEvents")) {
          const eventStore = db.createObjectStore("scheduledEvents", { keyPath: "id" })
          eventStore.createIndex("createdBy", "createdBy", { unique: false })
          eventStore.createIndex("scheduledDate", "scheduledDate", { unique: false })
        }

        // Notification settings store
        if (!db.objectStoreNames.contains("notificationSettings")) {
          const settingsStore = db.createObjectStore("notificationSettings", { keyPath: "userId" })
        }

        // Messages store
        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", { keyPath: "id" })
          messageStore.createIndex("senderId", "senderId", { unique: false })
          messageStore.createIndex("receiverId", "receiverId", { unique: false })
        }

        // Announcements store
        if (!db.objectStoreNames.contains("announcements")) {
          const announcementStore = db.createObjectStore("announcements", { keyPath: "id" })
          announcementStore.createIndex("courseId", "courseId", { unique: false })
          announcementStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        // Auth logs store for security tracking
        if (!db.objectStoreNames.contains("authLogs")) {
          const authLogStore = db.createObjectStore("authLogs", { keyPath: "id" })
          authLogStore.createIndex("userId", "userId", { unique: false })
          authLogStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // User sessions store for better session management
        if (!db.objectStoreNames.contains("userSessions")) {
          const sessionStore = db.createObjectStore("userSessions", { keyPath: "id" })
          sessionStore.createIndex("userId", "userId", { unique: false })
          sessionStore.createIndex("token", "token", { unique: true })
        }
      }
    })
  }

  // User methods
  async saveUser(user: User): Promise<void> {
    const transaction = this.db!.transaction(["users"], "readwrite")
    const store = transaction.objectStore("users")
    await store.put(user)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const transaction = this.db!.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const index = store.index("email")
    const request = index.get(email)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getUserById(id: string): Promise<User | null> {
    const transaction = this.db!.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getAllUsers(): Promise<User[]> {
    const transaction = this.db!.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Quiz methods
  async saveQuiz(quiz: Quiz): Promise<void> {
    const transaction = this.db!.transaction(["quizzes"], "readwrite")
    const store = transaction.objectStore("quizzes")
    await store.put(quiz)
  }

  async getQuizzes(createdBy?: string, userRole: "student" | "teacher" = "teacher"): Promise<Quiz[]> {
    const transaction = this.db!.transaction(["quizzes"], "readonly")
    const store = transaction.objectStore("quizzes")

    const filterQuizzes = (quizzes: Quiz[]) => {
      if (userRole === "teacher") return quizzes
      const now = new Date()
      return quizzes.filter((quiz: Quiz) => {
        if (!quiz.isPublished) return false
        if (quiz.scheduledPublishDate && new Date(quiz.scheduledPublishDate) > now) return false
        if (quiz.scheduledExpiryDate && new Date(quiz.scheduledExpiryDate) < now) return false
        return true
      })
    }

    if (createdBy) {
      const index = store.index("createdBy")
      const request = index.getAll(createdBy)
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(filterQuizzes(request.result))
      })
    }

    const request = store.getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(filterQuizzes(request.result))
    })
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    const transaction = this.db!.transaction(["quizzes"], "readonly")
    const store = transaction.objectStore("quizzes")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteQuiz(id: string): Promise<void> {
    const transaction = this.db!.transaction(["quizzes"], "readwrite")
    const store = transaction.objectStore("quizzes")
    await store.delete(id)
  }

  // Quiz attempt methods
  async saveAttempt(attempt: QuizAttempt): Promise<void> {
    const transaction = this.db!.transaction(["attempts"], "readwrite")
    const store = transaction.objectStore("attempts")
    await store.put(attempt)
  }

  async getAttempts(userId: string): Promise<QuizAttempt[]> {
    const transaction = this.db!.transaction(["attempts"], "readonly")
    const store = transaction.objectStore("attempts")
    const index = store.index("userId")
    const request = index.getAll(userId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getQuizAttemptsByStudent(quizId: string, studentId: string): Promise<QuizAttempt[]> {
    const transaction = this.db!.transaction(["attempts"], "readonly")
    const store = transaction.objectStore("attempts")
    const index = store.index("userId")
    const request = index.getAll(studentId)

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const attempts = request.result as QuizAttempt[]
        resolve(attempts.filter((a) => a.quizId === quizId))
      }
    })
  }

  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const transaction = this.db!.transaction(["attempts"], "readonly")
    const store = transaction.objectStore("attempts")
    const index = store.index("quizId")
    const request = index.getAll(quizId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Course methods
  async saveCourse(course: Course): Promise<void> {
    const transaction = this.db!.transaction(["courses"], "readwrite")
    const store = transaction.objectStore("courses")
    await store.put(course)
  }

  async getCourses(createdBy?: string): Promise<Course[]> {
    const transaction = this.db!.transaction(["courses"], "readonly")
    const store = transaction.objectStore("courses")

    if (createdBy) {
      const index = store.index("createdBy")
      const request = index.getAll(createdBy)
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result)
      })
    }

    const request = store.getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result.filter((course) => course.isPublished))
    })
  }

  async getCourseById(id: string, userRole: "student" | "teacher" = "teacher"): Promise<Course | null> {
    const transaction = this.db!.transaction(["courses"], "readonly")
    const store = transaction.objectStore("courses")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const course = request.result as Course | null
        if (course && userRole === "student") {
          const now = new Date()
          const filteredMaterials = (course.materials || []).filter(m => {
            if (m.scheduledPublishDate && new Date(m.scheduledPublishDate) > now) return false
            if (m.scheduledExpiryDate && new Date(m.scheduledExpiryDate) < now) return false
            return true
          })
          resolve({ ...course, materials: filteredMaterials })
        } else {
          resolve(course || null)
        }
      }
    })
  }

  async getAllCourses(): Promise<Course[]> {
    const transaction = this.db!.transaction(["courses"], "readonly")
    const store = transaction.objectStore("courses")
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteCourse(id: string): Promise<void> {
    const transaction = this.db!.transaction(["courses"], "readwrite")
    const store = transaction.objectStore("courses")
    await store.delete(id)
  }

  // Assignment methods
  async saveAssignment(assignment: Assignment): Promise<void> {
    const transaction = this.db!.transaction(["assignments"], "readwrite")
    const store = transaction.objectStore("assignments")
    await store.put(assignment)
  }

  async getAssignments(courseId?: string, userRole: "student" | "teacher" = "teacher"): Promise<Assignment[]> {
    const transaction = this.db!.transaction(["assignments"], "readonly")
    const store = transaction.objectStore("assignments")

    const filterAssignments = (assignments: Assignment[]) => {
      if (userRole === "teacher") return assignments
      const now = new Date()
      return assignments.filter(a => {
        if (a.scheduledPublishDate && new Date(a.scheduledPublishDate) > now) return false
        if (a.scheduledExpiryDate && new Date(a.scheduledExpiryDate) < now) return false
        return true
      })
    }

    if (courseId) {
      const index = store.index("courseId")
      const request = index.getAll(courseId)
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(filterAssignments(request.result))
      })
    }

    const request = store.getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(filterAssignments(request.result))
    })
  }

  async getAssignmentById(id: string): Promise<Assignment | null> {
    const transaction = this.db!.transaction(["assignments"], "readonly")
    const store = transaction.objectStore("assignments")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteAssignment(id: string): Promise<void> {
    const transaction = this.db!.transaction(["assignments"], "readwrite")
    const store = transaction.objectStore("assignments")
    await store.delete(id)
  }

  // Submission methods
  async saveSubmission(submission: AssignmentSubmission): Promise<void> {
    const transaction = this.db!.transaction(["submissions"], "readwrite")
    const store = transaction.objectStore("submissions")
    await store.put(submission)
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    const transaction = this.db!.transaction(["submissions"], "readonly")
    const store = transaction.objectStore("submissions")
    const index = store.index("assignmentId")
    const request = index.getAll(assignmentId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    const transaction = this.db!.transaction(["submissions"], "readonly")
    const store = transaction.objectStore("submissions")
    const index = store.index("studentId")
    const request = index.getAll(studentId)

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const submissions = request.result as AssignmentSubmission[]
        const submission = submissions.find((s) => s.assignmentId === assignmentId)
        resolve(submission || null)
      }
    })
  }

  // Notification methods
  async saveNotification(notification: Notification): Promise<void> {
    const transaction = this.db!.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")
    await store.put(notification)
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const transaction = this.db!.transaction(["notifications"], "readonly")
    const store = transaction.objectStore("notifications")
    const index = store.index("userId")
    const request = index.getAll(userId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const transaction = this.db!.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")
    const getRequest = store.get(notificationId)

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const notification = getRequest.result
        if (notification) {
          notification.isRead = true
          const putRequest = store.put(notification)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error("Notification not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId)
    const transaction = this.db!.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")

    for (const notification of notifications) {
      if (!notification.isRead) {
        notification.isRead = true
        await store.put(notification)
      }
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const transaction = this.db!.transaction(["notifications"], "readwrite")
    const store = transaction.objectStore("notifications")
    await store.delete(notificationId)
  }

  // Notification settings methods
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    const transaction = this.db!.transaction(["notificationSettings"], "readonly")
    const store = transaction.objectStore("notificationSettings")
    const request = store.get(userId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async saveNotificationSettings(userId: string, settings: Omit<NotificationSettings, "userId">): Promise<void> {
    const notificationSettings: NotificationSettings = {
      userId,
      ...settings,
    }

    const transaction = this.db!.transaction(["notificationSettings"], "readwrite")
    const store = transaction.objectStore("notificationSettings")
    await store.put(notificationSettings)
  }

  // Message methods
  async sendMessage(messageData: Omit<Message, "id" | "createdAt" | "isRead">): Promise<void> {
    const message: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isRead: false,
    }

    const transaction = this.db!.transaction(["messages"], "readwrite")
    const store = transaction.objectStore("messages")
    await store.put(message)
  }

  async getMessages(userId: string): Promise<Message[]> {
    const transaction = this.db!.transaction(["messages"], "readonly")
    const store = transaction.objectStore("messages")
    const senderIndex = store.index("senderId")
    const receiverIndex = store.index("receiverId")

    const sentRequest = senderIndex.getAll(userId)
    const receivedRequest = receiverIndex.getAll(userId)

    return new Promise((resolve) => {
      let sentMessages: Message[] = []
      let receivedMessages: Message[] = []
      let completed = 0

      const checkComplete = () => {
        completed++
        if (completed === 2) {
          const allMessages = [...sentMessages, ...receivedMessages]
          allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          resolve(allMessages)
        }
      }

      sentRequest.onsuccess = () => {
        sentMessages = sentRequest.result
        checkComplete()
      }

      receivedRequest.onsuccess = () => {
        receivedMessages = receivedRequest.result
        checkComplete()
      }
    })
  }

  // Announcement methods
  async createAnnouncement(announcementData: Omit<Announcement, "id" | "createdAt">): Promise<void> {
    const announcement: Announcement = {
      ...announcementData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    const transaction = this.db!.transaction(["announcements"], "readwrite")
    const store = transaction.objectStore("announcements")
    await store.put(announcement)
  }

  async getAnnouncements(courseId?: string, userRole: "student" | "teacher" = "teacher"): Promise<Announcement[]> {
    const transaction = this.db!.transaction(["announcements"], "readonly")
    const store = transaction.objectStore("announcements")

    const filterAnnouncements = (announcements: Announcement[]) => {
      if (userRole === "teacher") return announcements
      return announcements.filter(a => a.isPublished)
    }

    if (courseId) {
      const index = store.index("courseId")
      const request = index.getAll(courseId)
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(filterAnnouncements(request.result))
      })
    }

    const request = store.getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(filterAnnouncements(request.result))
    })
  }

  async updateAnnouncement(announcementId: string, updates: Partial<Announcement>): Promise<void> {
    const transaction = this.db!.transaction(["announcements"], "readwrite")
    const store = transaction.objectStore("announcements")
    const getRequest = store.get(announcementId)

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const announcement = getRequest.result
        if (announcement) {
          const updatedAnnouncement = { ...announcement, ...updates, updatedAt: new Date().toISOString() }
          const putRequest = store.put(updatedAnnouncement)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error("Announcement not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    const transaction = this.db!.transaction(["announcements"], "readwrite")
    const store = transaction.objectStore("announcements")
    await store.delete(announcementId)
  }

  // Discussion post methods
  async createDiscussionPost(postData: Omit<DiscussionPost, "id" | "createdAt" | "updatedAt">): Promise<void> {
    const post: DiscussionPost = {
      ...postData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const transaction = this.db!.transaction(["discussions"], "readwrite")
    const store = transaction.objectStore("discussions")
    await store.put(post)
  }

  async getDiscussionPosts(courseId: string): Promise<DiscussionPost[]> {
    const transaction = this.db!.transaction(["discussions"], "readonly")
    const store = transaction.objectStore("discussions")
    const index = store.index("courseId")
    const request = index.getAll(courseId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Scheduled event methods
  async createScheduledEvent(eventData: Omit<ScheduledEvent, "id" | "createdAt" | "isCompleted">): Promise<void> {
    const event: ScheduledEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isCompleted: false,
    }

    const transaction = this.db!.transaction(["scheduledEvents"], "readwrite")
    const store = transaction.objectStore("scheduledEvents")
    await store.put(event)
  }

  async getScheduledEvents(createdBy: string): Promise<ScheduledEvent[]> {
    const transaction = this.db!.transaction(["scheduledEvents"], "readonly")
    const store = transaction.objectStore("scheduledEvents")
    const index = store.index("createdBy")
    const request = index.getAll(createdBy)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async updateScheduledEvent(eventId: string, updates: Partial<ScheduledEvent>): Promise<void> {
    const transaction = this.db!.transaction(["scheduledEvents"], "readwrite")
    const store = transaction.objectStore("scheduledEvents")
    const getRequest = store.get(eventId)

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const event = getRequest.result
        if (event) {
          const updatedEvent = { ...event, ...updates }
          const putRequest = store.put(updatedEvent)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error("Event not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteScheduledEvent(eventId: string): Promise<void> {
    const transaction = this.db!.transaction(["scheduledEvents"], "readwrite")
    const store = transaction.objectStore("scheduledEvents")
    await store.delete(eventId)
  }

  // Auth log methods for security tracking
  async saveAuthLog(logEntry: AuthLog): Promise<void> {
    const transaction = this.db!.transaction(["authLogs"], "readwrite")
    const store = transaction.objectStore("authLogs")
    await store.put(logEntry)
  }

  async getAuthLogs(userId: string): Promise<AuthLog[]> {
    const transaction = this.db!.transaction(["authLogs"], "readonly")
    const store = transaction.objectStore("authLogs")
    const index = store.index("userId")
    const request = index.getAll(userId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  // User session methods
  async saveUserSession(session: UserSession): Promise<void> {
    const transaction = this.db!.transaction(["userSessions"], "readwrite")
    const store = transaction.objectStore("userSessions")
    await store.put(session)
  }

  async getUserSession(token: string): Promise<UserSession | null> {
    const transaction = this.db!.transaction(["userSessions"], "readonly")
    const store = transaction.objectStore("userSessions")
    const index = store.index("token")
    const request = index.get(token)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async invalidateUserSession(token: string): Promise<void> {
    const session = await this.getUserSession(token)
    if (session) {
      session.isActive = false
      await this.saveUserSession(session)
    }
  }
}

export const db = new QuizDatabase()
