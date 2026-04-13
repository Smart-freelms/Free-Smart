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
import { supabase } from "./supabase"

class QuizDatabase {
  private dbName = "LMSAppDB"
  private version = 4
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (this.db) return
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "id" })
          userStore.createIndex("email", "email", { unique: true })
        }

        if (!db.objectStoreNames.contains("quizzes")) {
          const quizStore = db.createObjectStore("quizzes", { keyPath: "id" })
          quizStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        if (!db.objectStoreNames.contains("attempts")) {
          const attemptStore = db.createObjectStore("attempts", { keyPath: "id" })
          attemptStore.createIndex("userId", "userId", { unique: false })
          attemptStore.createIndex("quizId", "quizId", { unique: false })
        }

        if (!db.objectStoreNames.contains("courses")) {
          const courseStore = db.createObjectStore("courses", { keyPath: "id" })
          courseStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        if (!db.objectStoreNames.contains("assignments")) {
          const assignmentStore = db.createObjectStore("assignments", { keyPath: "id" })
          assignmentStore.createIndex("courseId", "courseId", { unique: false })
          assignmentStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        if (!db.objectStoreNames.contains("submissions")) {
          const submissionStore = db.createObjectStore("submissions", { keyPath: "id" })
          submissionStore.createIndex("assignmentId", "assignmentId", { unique: false })
          submissionStore.createIndex("studentId", "studentId", { unique: false })
        }

        if (!db.objectStoreNames.contains("notifications")) {
          const notificationStore = db.createObjectStore("notifications", { keyPath: "id" })
          notificationStore.createIndex("userId", "userId", { unique: false })
        }

        if (!db.objectStoreNames.contains("discussions")) {
          const discussionStore = db.createObjectStore("discussions", { keyPath: "id" })
          discussionStore.createIndex("courseId", "courseId", { unique: false })
          discussionStore.createIndex("authorId", "authorId", { unique: false })
        }

        if (!db.objectStoreNames.contains("scheduledEvents")) {
          const eventStore = db.createObjectStore("scheduledEvents", { keyPath: "id" })
          eventStore.createIndex("createdBy", "createdBy", { unique: false })
          eventStore.createIndex("scheduledDate", "scheduledDate", { unique: false })
        }

        if (!db.objectStoreNames.contains("notificationSettings")) {
          db.createObjectStore("notificationSettings", { keyPath: "userId" })
        }

        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", { keyPath: "id" })
          messageStore.createIndex("senderId", "senderId", { unique: false })
          messageStore.createIndex("receiverId", "receiverId", { unique: false })
        }

        if (!db.objectStoreNames.contains("announcements")) {
          const announcementStore = db.createObjectStore("announcements", { keyPath: "id" })
          announcementStore.createIndex("courseId", "courseId", { unique: false })
          announcementStore.createIndex("createdBy", "createdBy", { unique: false })
        }

        if (!db.objectStoreNames.contains("authLogs")) {
          const authLogStore = db.createObjectStore("authLogs", { keyPath: "id" })
          authLogStore.createIndex("userId", "userId", { unique: false })
          authLogStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("userSessions")) {
          const sessionStore = db.createObjectStore("userSessions", { keyPath: "id" })
          sessionStore.createIndex("userId", "userId", { unique: false })
          sessionStore.createIndex("token", "token", { unique: true })
        }

        if (!db.objectStoreNames.contains("quizSessions")) {
          const quizSessionStore = db.createObjectStore("quizSessions", { keyPath: "id" })
          quizSessionStore.createIndex("userId", "userId", { unique: false })
          quizSessionStore.createIndex("quizId", "quizId", { unique: false })
        }
      }
    })
  }

  // User methods
  async saveUser(user: User): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readwrite")
      const store = transaction.objectStore("users")
      const request = store.put(user)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Mirror to Supabase
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        bio: user.bio,
        profile_picture: user.profilePicture
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveUser:", e)
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Try Supabase first
    try {
      const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
      if (data) {
        const user: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          password: '',
          bio: data.bio,
          profilePicture: data.profile_picture
        }
        // Sync to local
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction(["users"], "readwrite")
          const store = transaction.objectStore("users")
          const request = store.put(user)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
        return user
      }
    } catch (e) {
      console.error("Supabase fetch error:", e)
    }

    // Fallback to local
    const transaction = this.db!.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const index = store.index("email")
    const request = index.get(email)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      if (data) {
        const user: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          password: '',
          bio: data.bio,
          profilePicture: data.profile_picture
        }
        const transaction = this.db!.transaction(["users"], "readwrite")
        transaction.objectStore("users").put(user)
        return user
      }
    } catch (e) {
       console.error("Supabase fetch error:", e)
    }

    const transaction = this.db!.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data } = await supabase.from('profiles').select('*')
      if (data) return data.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        role: d.role,
        isActive: d.is_active,
        createdAt: new Date(d.created_at),
        password: ''
      }))
    } catch (e) {}

    const transaction = this.db!.transaction(["users"], "readonly")
    const store = transaction.objectStore("users")
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Quiz methods
  async saveQuiz(quiz: Quiz): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["quizzes"], "readwrite")
      const store = transaction.objectStore("quizzes")
      const request = store.put(quiz)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('quizzes').upsert({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        created_by: quiz.createdBy,
        questions: quiz.questions,
        time_limit: quiz.timeLimit,
        allow_retry: quiz.allowRetry,
        shuffle_questions: quiz.shuffleQuestions,
        shuffle_options: quiz.shuffleOptions,
        passing_score: quiz.passingScore,
        is_published: quiz.isPublished,
        scheduled_publish_date: quiz.scheduledPublishDate,
        scheduled_expiry_date: quiz.scheduledExpiryDate,
        updated_at: new Date().toISOString()
      })
      if (error) throw error
    } catch (e) {
       console.error("Supabase sync error for saveQuiz:", e)
    }
  }

  async getQuizzes(createdBy?: string, userRole: "student" | "teacher" = "teacher"): Promise<Quiz[]> {
    try {
      let query = supabase.from('quizzes').select('*')
      if (createdBy) query = query.eq('created_by', createdBy)

      const { data } = await query
      if (data) {
        const quizzes: Quiz[] = data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          createdBy: d.created_by,
          questions: d.questions,
          timeLimit: d.time_limit,
          allowRetry: d.allow_retry,
          shuffleQuestions: d.shuffle_questions,
          shuffleOptions: d.shuffle_options,
          passingScore: d.passing_score,
          isPublished: d.is_published,
          createdAt: new Date(d.created_at),
          updatedAt: new Date(d.updated_at),
          scheduledPublishDate: d.scheduled_publish_date,
          scheduledExpiryDate: d.scheduled_expiry_date
        }))

        const filterQuizzes = (qs: Quiz[]) => {
          if (userRole === "teacher") return qs
          const now = new Date()
          return qs.filter((q) => {
            if (!q.isPublished) return false
            if (q.scheduledPublishDate && new Date(q.scheduledPublishDate) > now) return false
            if (q.scheduledExpiryDate && new Date(q.scheduledExpiryDate) < now) return false
            return true
          })
        }
        return filterQuizzes(quizzes)
      }
    } catch (e) {}

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
    try {
      const { data } = await supabase.from('quizzes').select('*').eq('id', id).maybeSingle()
      if (data) return {
        id: data.id,
        title: data.title,
        description: data.description,
        createdBy: data.created_by,
        questions: data.questions,
        timeLimit: data.time_limit,
        allowRetry: data.allow_retry,
        shuffleQuestions: data.shuffle_questions,
        shuffleOptions: data.shuffle_options,
        passingScore: data.passing_score,
        isPublished: data.is_published,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        scheduledPublishDate: data.scheduled_publish_date,
        scheduledExpiryDate: data.scheduled_expiry_date
      }
    } catch (e) {}

    const transaction = this.db!.transaction(["quizzes"], "readonly")
    const store = transaction.objectStore("quizzes")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteQuiz(id: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["quizzes"], "readwrite")
      const store = transaction.objectStore("quizzes")
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for deleteQuiz:", e)
    }
  }

  // Quiz attempt methods
  async saveAttempt(attempt: QuizAttempt): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["attempts"], "readwrite")
      const store = transaction.objectStore("attempts")
      const request = store.put(attempt)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('quiz_attempts').upsert({
        id: attempt.id,
        quiz_id: attempt.quizId,
        user_id: attempt.userId,
        answers: attempt.answers,
        score: attempt.score,
        total_points: attempt.totalPoints,
        percentage: attempt.percentage,
        start_time: attempt.startTime.toISOString(),
        end_time: attempt.endTime.toISOString(),
        time_spent: attempt.timeSpent,
        passed: attempt.passed
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveAttempt:", e)
    }
  }

  async getAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId)
      if (data) return data.map(d => ({
        id: d.id,
        quizId: d.quiz_id,
        userId: d.user_id,
        answers: d.answers,
        score: d.score,
        totalPoints: d.total_points,
        percentage: d.percentage,
        startTime: new Date(d.start_time),
        endTime: new Date(d.end_time),
        timeSpent: d.time_spent,
        passed: d.passed
      }))
    } catch (e) {}

    const transaction = this.db!.transaction(["attempts"], "readonly")
    const store = transaction.objectStore("attempts")
    const index = store.index("userId")
    const request = index.getAll(userId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getQuizAttemptsByStudent(quizId: string, studentId: string): Promise<QuizAttempt[]> {
    try {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('user_id', studentId)
      if (data) return data.map(d => ({
        id: d.id,
        quizId: d.quiz_id,
        userId: d.user_id,
        answers: d.answers,
        score: d.score,
        totalPoints: d.total_points,
        percentage: d.percentage,
        startTime: new Date(d.start_time),
        endTime: new Date(d.end_time),
        timeSpent: d.time_spent,
        passed: d.passed
      }))
    } catch (e) {}

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
    try {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId)
      if (data) return data.map(d => ({
        id: d.id,
        quizId: d.quiz_id,
        userId: d.user_id,
        answers: d.answers,
        score: d.score,
        totalPoints: d.total_points,
        percentage: d.percentage,
        startTime: new Date(d.start_time),
        endTime: new Date(d.end_time),
        timeSpent: d.time_spent,
        passed: d.passed
      }))
    } catch (e) {}

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
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["courses"], "readwrite")
      const store = transaction.objectStore("courses")
      const request = store.put(course)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('courses').upsert({
        id: course.id,
        title: course.title,
        description: course.description,
        created_by: course.createdBy,
        students: course.students,
        quizzes: course.quizzes,
        assignments: course.assignments,
        materials: course.materials,
        is_published: course.isPublished,
        scheduled_publish_date: course.scheduledPublishDate,
        scheduled_expiry_date: course.scheduledExpiryDate,
        updated_at: new Date().toISOString()
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveCourse:", e)
    }
  }

  async getCourses(createdBy?: string): Promise<Course[]> {
    try {
      let query = supabase.from('courses').select('*')
      if (createdBy) query = query.eq('created_by', createdBy)
      const { data } = await query
      if (data) return data.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        createdBy: d.created_by,
        students: d.students,
        quizzes: d.quizzes,
        assignments: d.assignments,
        materials: d.materials,
        isPublished: d.is_published,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
        scheduledPublishDate: d.scheduled_publish_date,
        scheduledExpiryDate: d.scheduled_expiry_date
      }))
    } catch (e) {}

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
    try {
      const { data } = await supabase.from('courses').select('*').eq('id', id).maybeSingle()
      if (data) {
        const course: Course = {
          id: data.id,
          title: data.title,
          description: data.description,
          createdBy: data.created_by,
          students: data.students,
          quizzes: data.quizzes,
          assignments: data.assignments,
          materials: data.materials,
          isPublished: data.is_published,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          scheduledPublishDate: data.scheduled_publish_date,
          scheduledExpiryDate: data.scheduled_expiry_date
        }
        if (userRole === "student") {
          const now = new Date()
          const filteredMaterials = (course.materials || []).filter(m => {
            if (m.scheduledPublishDate && new Date(m.scheduledPublishDate) > now) return false
            if (m.scheduledExpiryDate && new Date(m.scheduledExpiryDate) < now) return false
            return true
          })
          return { ...course, materials: filteredMaterials }
        }
        return course
      }
    } catch (e) {}

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
    try {
      const { data } = await supabase.from('courses').select('*')
      if (data) return data.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        createdBy: d.created_by,
        students: d.students,
        quizzes: d.quizzes,
        assignments: d.assignments,
        materials: d.materials,
        isPublished: d.is_published,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
        scheduledPublishDate: d.scheduled_publish_date,
        scheduledExpiryDate: d.scheduled_expiry_date
      }))
    } catch (e) {}

    const transaction = this.db!.transaction(["courses"], "readonly")
    const store = transaction.objectStore("courses")
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteCourse(id: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["courses"], "readwrite")
      const store = transaction.objectStore("courses")
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for deleteCourse:", e)
    }
  }

  // Assignment methods
  async saveAssignment(assignment: Assignment): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["assignments"], "readwrite")
      const store = transaction.objectStore("assignments")
      const request = store.put(assignment)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('assignments').upsert({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        course_id: assignment.courseId,
        created_by: assignment.createdBy,
        due_date: assignment.dueDate.toISOString(),
        max_points: assignment.maxPoints,
        allow_late_submission: assignment.allowLateSubmission,
        submission_types: assignment.submissionTypes,
        scheduled_publish_date: assignment.scheduledPublishDate,
        scheduled_expiry_date: assignment.scheduledExpiryDate,
        updated_at: new Date().toISOString()
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveAssignment:", e)
    }
  }

  async getAssignments(courseId?: string, userRole: "student" | "teacher" = "teacher"): Promise<Assignment[]> {
    try {
      let query = supabase.from('assignments').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      const { data } = await query
      if (data) {
        const assignments: Assignment[] = data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          courseId: d.course_id,
          createdBy: d.created_by,
          dueDate: new Date(d.due_date),
          maxPoints: d.max_points,
          allowLateSubmission: d.allow_late_submission,
          submissionTypes: d.submission_types,
          createdAt: new Date(d.created_at),
          updatedAt: new Date(d.updated_at),
          scheduledPublishDate: d.scheduled_publish_date,
          scheduledExpiryDate: d.scheduled_expiry_date
        }))
        const filterAssignments = (as: Assignment[]) => {
          if (userRole === "teacher") return as
          const now = new Date()
          return as.filter((a) => {
            if (a.scheduledPublishDate && new Date(a.scheduledPublishDate) > now) return false
            if (a.scheduledExpiryDate && new Date(a.scheduledExpiryDate) < now) return false
            return true
          })
        }
        return filterAssignments(assignments)
      }
    } catch (e) {}

    const transaction = this.db!.transaction(["assignments"], "readonly")
    const store = transaction.objectStore("assignments")

    if (courseId) {
      const index = store.index("courseId")
      const request = index.getAll(courseId)
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result)
      })
    }

    const request = store.getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const assignments = request.result as Assignment[]
        if (userRole === "teacher") {
          resolve(assignments)
        } else {
          const now = new Date()
          resolve(assignments.filter((a) => {
            if (a.scheduledPublishDate && new Date(a.scheduledPublishDate) > now) return false
            if (a.scheduledExpiryDate && new Date(a.scheduledExpiryDate) < now) return false
            return true
          }))
        }
      }
    })
  }

  async getAssignmentById(id: string): Promise<Assignment | null> {
    try {
      const { data } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle()
      if (data) return {
        id: data.id,
        title: data.title,
        description: data.description,
        courseId: data.course_id,
        createdBy: data.created_by,
        dueDate: new Date(data.due_date),
        maxPoints: data.max_points,
        allowLateSubmission: data.allow_late_submission,
        submissionTypes: data.submission_types,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(d.updated_at),
        scheduledPublishDate: d.scheduled_publish_date,
        scheduled_expiry_date: d.scheduled_expiry_date
      }
    } catch (e) {}

    const transaction = this.db!.transaction(["assignments"], "readonly")
    const store = transaction.objectStore("assignments")
    const request = store.get(id)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteAssignment(id: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["assignments"], "readwrite")
      const store = transaction.objectStore("assignments")
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for deleteAssignment:", e)
    }
  }

  // Submission methods
  async saveSubmission(submission: AssignmentSubmission): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["submissions"], "readwrite")
      const store = transaction.objectStore("submissions")
      const request = store.put(submission)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('submissions').upsert({
        id: submission.id,
        assignment_id: submission.assignmentId,
        student_id: submission.studentId,
        content: submission.content,
        file_url: submission.fileUrl,
        submitted_at: submission.submittedAt.toISOString(),
        grade: submission.grade,
        feedback: submission.feedback,
        graded_by: submission.gradedBy,
        graded_at: submission.gradedAt?.toISOString()
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveSubmission:", e)
    }
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const { data } = await supabase.from('submissions').select('*').eq('assignment_id', assignmentId)
      if (data) return data.map(d => ({
        id: d.id,
        assignmentId: d.assignment_id,
        studentId: d.student_id,
        content: d.content,
        fileUrl: d.file_url,
        submittedAt: new Date(d.submitted_at),
        grade: d.grade,
        feedback: d.feedback,
        gradedBy: d.graded_by,
        gradedAt: d.graded_at ? new Date(d.graded_at) : undefined
      }))
    } catch (e) {}

    const transaction = this.db!.transaction(["submissions"], "readonly")
    const store = transaction.objectStore("submissions")
    const index = store.index("assignmentId")
    const request = index.getAll(assignmentId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    try {
      const { data } = await supabase.from('submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', studentId).maybeSingle()
      if (data) return {
        id: data.id,
        assignmentId: data.assignment_id,
        studentId: data.student_id,
        content: data.content,
        fileUrl: data.file_url,
        submittedAt: new Date(data.submitted_at),
        grade: data.grade,
        feedback: data.feedback,
        gradedBy: data.graded_by,
        gradedAt: data.graded_at ? new Date(data.graded_at) : undefined
      }
    } catch (e) {}

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
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")
      const request = store.put(notification)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('notifications').upsert({
        id: notification.id,
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: notification.isRead,
        created_at: notification.createdAt.toISOString()
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveNotification:", e)
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId)
      if (data) return data.map(d => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        message: d.message,
        type: d.type,
        isRead: d.is_read,
        createdAt: new Date(d.created_at)
      }))
    } catch (e) {}

    const transaction = this.db!.transaction(["notifications"], "readonly")
    const store = transaction.objectStore("notifications")
    const index = store.index("userId")
    const request = index.getAll(userId)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")
      const getRequest = store.get(notificationId)

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

    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for markNotificationAsRead:", e)
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId)

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")

      let completed = 0
      const toUpdate = notifications.filter(n => !n.isRead)
      if (toUpdate.length === 0) {
        resolve()
        return
      }

      toUpdate.forEach(notification => {
        notification.isRead = true
        const request = store.put(notification)
        request.onsuccess = () => {
          completed++
          if (completed === toUpdate.length) resolve()
        }
        request.onerror = () => reject(request.error)
      })
    })

    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for markAllNotificationsAsRead:", e)
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")
      const request = store.delete(notificationId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for deleteNotification:", e)
    }
  }

  // Notification settings methods
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const { data } = await supabase.from('notification_settings').select('*').eq('user_id', userId).maybeSingle()
      if (data) return {
        userId: data.user_id,
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        assignmentReminders: data.assignment_reminders,
        gradeNotifications: data.grade_notifications,
        messageNotifications: data.message_notifications,
        announcementNotifications: data.announcement_notifications
      }
    } catch (e) {}

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

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["notificationSettings"], "readwrite")
      const store = transaction.objectStore("notificationSettings")
      const request = store.put(notificationSettings)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('notification_settings').upsert({
        user_id: userId,
        email_notifications: settings.emailNotifications,
        push_notifications: settings.pushNotifications,
        assignment_reminders: settings.assignmentReminders,
        grade_notifications: settings.gradeNotifications,
        message_notifications: settings.messageNotifications,
        announcement_notifications: settings.announcementNotifications
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for saveNotificationSettings:", e)
    }
  }

  // Message methods
  async sendMessage(messageData: Omit<Message, "id" | "createdAt" | "isRead">): Promise<void> {
    const message: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isRead: false,
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["messages"], "readwrite")
      const store = transaction.objectStore("messages")
      const request = store.put(message)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('messages').insert({
        id: message.id,
        sender_id: message.senderId,
        receiver_id: message.receiverId,
        subject: message.subject,
        content: message.content,
        is_read: message.isRead,
        created_at: message.createdAt
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for sendMessage:", e)
    }
  }

  async getMessages(userId: string): Promise<Message[]> {
    try {
      const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      if (data) return data.map(d => ({
        id: d.id,
        senderId: d.sender_id,
        receiverId: d.receiver_id,
        subject: d.subject,
        content: d.content,
        isRead: d.is_read,
        createdAt: d.created_at
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (e) {}

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

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["announcements"], "readwrite")
      const store = transaction.objectStore("announcements")
      const request = store.put(announcement)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('announcements').insert({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        course_id: announcement.courseId,
        created_by: announcement.createdBy,
        is_published: announcement.isPublished,
        created_at: announcement.createdAt
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for createAnnouncement:", e)
    }
  }

  async getAnnouncements(courseId?: string, userRole: "student" | "teacher" = "teacher"): Promise<Announcement[]> {
    try {
      let query = supabase.from('announcements').select('*')
      if (courseId) query = query.eq('course_id', courseId)
      const { data } = await query
      if (data) {
        const announcements: Announcement[] = data.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          courseId: d.course_id,
          createdBy: d.created_by,
          createdAt: d.created_at,
          isPublished: d.is_published,
          updatedAt: d.updated_at
        }))
        const filterAnnouncements = (as: Announcement[]) => {
          if (userRole === "teacher") return as
          return as.filter(a => a.isPublished)
        }
        return filterAnnouncements(announcements)
      }
    } catch (e) {}

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
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["announcements"], "readwrite")
      const store = transaction.objectStore("announcements")
      const getRequest = store.get(announcementId)

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

    try {
      const { error } = await supabase.from('announcements').update({
        title: updates.title,
        content: updates.content,
        is_published: updates.isPublished,
        updated_at: new Date().toISOString()
      }).eq('id', announcementId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for updateAnnouncement:", e)
    }
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["announcements"], "readwrite")
      const store = transaction.objectStore("announcements")
      const request = store.delete(announcementId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for deleteAnnouncement:", e)
    }
  }

  // Discussion post methods
  async createDiscussionPost(postData: any): Promise<void> {
    const post = {
      ...postData,
      id: postData.id || crypto.randomUUID(),
      createdAt: postData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["discussions"], "readwrite")
      const store = transaction.objectStore("discussions")
      const request = store.put(post)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('discussion_posts').upsert({
        id: post.id,
        course_id: post.courseId,
        author_id: post.authorId,
        title: post.title,
        content: post.content,
        parent_id: post.parentId,
        created_at: post.createdAt,
        updated_at: post.updatedAt
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for createDiscussionPost:", e)
    }
  }

  async getDiscussionPosts(courseId: string): Promise<any[]> {
    try {
      const { data } = await supabase.from('discussion_posts').select('*').eq('course_id', courseId)
      if (data) return data.map(d => ({
        id: d.id,
        courseId: d.course_id,
        authorId: d.author_id,
        title: d.title,
        content: d.content,
        parentId: d.parent_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }))
    } catch (e) {}

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

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["scheduledEvents"], "readwrite")
      const store = transaction.objectStore("scheduledEvents")
      const request = store.put(event)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('scheduled_events').insert({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        entity_id: event.entityId,
        scheduled_date: event.scheduledDate,
        action: event.action,
        is_completed: event.isCompleted,
        created_by: event.createdBy,
        created_at: event.createdAt
      })
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for createScheduledEvent:", e)
    }
  }

  async getScheduledEvents(createdBy: string): Promise<ScheduledEvent[]> {
    try {
      const { data } = await supabase.from('scheduled_events').select('*').eq('created_by', createdBy)
      if (data) return data.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        type: d.type,
        entityId: d.entity_id,
        scheduledDate: d.scheduled_date,
        action: d.action,
        isCompleted: d.is_completed,
        createdBy: d.created_by,
        createdAt: d.created_at
      }))
    } catch (e) {}

    const transaction = this.db!.transaction(["scheduledEvents"], "readonly")
    const store = transaction.objectStore("scheduledEvents")
    const index = store.index("createdBy")
    const request = index.getAll(createdBy)

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  }

  async updateScheduledEvent(eventId: string, updates: Partial<ScheduledEvent>): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["scheduledEvents"], "readwrite")
      const store = transaction.objectStore("scheduledEvents")
      const getRequest = store.get(eventId)

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

    try {
      const { error } = await supabase.from('scheduled_events').update({
        title: updates.title,
        description: updates.description,
        scheduled_date: updates.scheduledDate,
        is_completed: updates.isCompleted
      }).eq('id', eventId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for updateScheduledEvent:", e)
    }
  }

  async deleteScheduledEvent(eventId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["scheduledEvents"], "readwrite")
      const store = transaction.objectStore("scheduledEvents")
      const request = store.delete(eventId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    try {
      const { error } = await supabase.from('scheduled_events').delete().eq('id', eventId)
      if (error) throw error
    } catch (e) {
      console.error("Supabase sync error for deleteScheduledEvent:", e)
    }
  }

  // Auth log methods for security tracking
  async saveAuthLog(logEntry: AuthLog): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["authLogs"], "readwrite")
      const store = transaction.objectStore("authLogs")
      const request = store.put(logEntry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAuthLogs(userId: string): Promise<AuthLog[]> {
    try {
      const { data } = await supabase.from('auth_logs').select('*').eq('user_id', userId)
      if (data) return data.map(d => ({
        id: d.id,
        userId: d.user_id,
        event: d.event,
        details: d.details,
        timestamp: d.timestamp,
        ip: d.ip
      }))
    } catch (e) {}

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
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(["userSessions"], "readwrite")
      const store = transaction.objectStore("userSessions")
      const request = store.put(session)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
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

  // Quiz session persistence methods
  async saveQuizSession(session: any): Promise<void> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["quizSessions"], "readwrite")
      const store = transaction.objectStore("quizSessions")
      const request = store.put(session)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async getQuizSession(quizId: string, userId: string): Promise<any | null> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["quizSessions"], "readonly")
      const store = transaction.objectStore("quizSessions")
      const index = store.index("userId")
      const request = index.getAll(userId)
      request.onsuccess = () => {
        const sessions = request.result
        const session = sessions.find((s: any) => s.quizId === quizId)
        resolve(session || null)
      }
      request.onerror = () => reject(request.error)
    })
  }
  
  async deleteQuizSession(quizId: string, userId: string): Promise<void> {
    const session = await this.getQuizSession(quizId, userId)
    if (session) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["quizSessions"], "readwrite")
        const store = transaction.objectStore("quizSessions")
        const request = store.delete(session.id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async getQuizSession(quizId: string, userId: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["quizSessions"], "readonly")
      const store = transaction.objectStore("quizSessions")
      const index = store.index("userId")
      const request = index.getAll(userId)

      request.onsuccess = () => {
        const sessions = request.result as any[]
        const session = sessions.find(s => s.quizId === quizId)
        resolve(session || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteQuizSession(quizId: string, userId: string): Promise<void> {
    const session = await this.getQuizSession(quizId, userId)
    if (session) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["quizSessions"], "readwrite")
        const store = transaction.objectStore("quizSessions")
        const request = store.delete(session.id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }
}

export const db = new QuizDatabase()
