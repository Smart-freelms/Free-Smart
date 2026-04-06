"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { User, Course, CourseMaterial, FileUploadProgress } from "../types"
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Eye,
  EyeOff,
  Download,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react"
import { db } from "../utils/database"
import { MaterialForm } from "./courses/MaterialForm"
import { MaterialList } from "./courses/MaterialList"

interface CourseCreatorProps {
  user: User
  editCourseId?: string | null
  onBack: () => void
}

export const CourseCreator: React.FC<CourseCreatorProps> = ({ user, editCourseId, onBack }) => {
  const [courseData, setCourseData] = useState<Partial<Course>>({
    title: "",
    description: "",
    createdBy: user.id,
    students: [],
    quizzes: [],
    assignments: [],
    materials: [],
    isPublished: false,
  })
  const [newMaterial, setNewMaterial] = useState<Partial<CourseMaterial>>({
    title: "",
    type: "document",
    url: "",
    description: "",
    fileData: null,
  })
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([])
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editCourseId) {
      loadCourse()
    }
  }, [editCourseId])

  const loadCourse = async () => {
    try {
      const course = await db.getCourseById(editCourseId!)
      if (course) {
        setCourseData(course)
      }
    } catch (error) {
      console.error("Failed to load course:", error)
      setError("Failed to load course")
    }
  }

  const handleSave = async () => {
    if (!courseData.title || !courseData.description) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const course: Course = {
        id: editCourseId || crypto.randomUUID(),
        title: courseData.title!,
        description: courseData.description!,
        createdBy: user.id,
        students: courseData.students || [],
        quizzes: courseData.quizzes || [],
        assignments: courseData.assignments || [],
        materials: courseData.materials || [],
        isPublished: courseData.isPublished || false,
        createdAt: courseData.createdAt || new Date(),
        updatedAt: new Date(),
      }

      await db.saveCourse(course)
      onBack()
    } catch (error) {
      console.error("Failed to save course:", error)
      setError("Failed to save course")
    } finally {
      setIsLoading(false)
    }
  }

  const addMaterial = () => {
    if (!newMaterial.title) {
      setError("Please fill in material title")
      return
    }

    if (!newMaterial.url && !newMaterial.fileData) {
      setError("Please provide either a URL or upload a file")
      return
    }

    const material: CourseMaterial = {
      id: crypto.randomUUID(),
      title: newMaterial.title!,
      type: newMaterial.type!,
      url: newMaterial.url,
      fileData: newMaterial.fileData,
      description: newMaterial.description,
      uploadedAt: new Date(),
      downloadCount: 0,
      tags: [],
    }

    setCourseData({
      ...courseData,
      materials: [...(courseData.materials || []), material],
    })

    setNewMaterial({
      title: "",
      type: "document",
      url: "",
      description: "",
      fileData: null,
    })
    setShowMaterialForm(false)
    setError("")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const uploadId = crypto.randomUUID()

      // Add to upload progress
      setUploadProgress((prev) => [
        ...prev,
        {
          id: uploadId,
          fileName: file.name,
          progress: 0,
          status: "uploading",
        },
      ])

      // Simulate file reading and processing
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          content: e.target?.result as ArrayBuffer,
          lastModified: file.lastModified,
        }

        // Update material with file data
        setNewMaterial((prev) => ({
          ...prev,
          title: prev.title || file.name.split(".")[0],
          type: getFileType(file.type),
          fileData: fileData,
        }))

        // Update progress to completed
        setUploadProgress((prev) =>
          prev.map((p) => (p.id === uploadId ? { ...p, progress: 100, status: "completed" } : p)),
        )

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((p) => p.id !== uploadId))
        }, 2000)
      }

      reader.onerror = () => {
        setUploadProgress((prev) =>
          prev.map((p) => (p.id === uploadId ? { ...p, status: "error", error: "Failed to read file" } : p)),
        )
      }

      // Simulate progress
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 90) {
          clearInterval(progressInterval)
          reader.readAsArrayBuffer(file)
        } else {
          setUploadProgress((prev) => prev.map((p) => (p.id === uploadId ? { ...p, progress } : p)))
        }
      }, 200)
    })
  }

  const getFileType = (mimeType: string): CourseMaterial["type"] => {
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("image/")) return "image"
    return "file"
  }

  const toggleMaterialSelection = (materialId: string) => {
    const newSelected = new Set(selectedMaterials)
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId)
    } else {
      newSelected.add(materialId)
    }
    setSelectedMaterials(newSelected)
  }

  const selectAllMaterials = () => {
    if (selectedMaterials.size === courseData.materials?.length) {
      setSelectedMaterials(new Set())
    } else {
      setSelectedMaterials(new Set(courseData.materials?.map((m) => m.id) || []))
    }
  }

  const handleBulkDownload = () => {
    const materialsToDownload = courseData.materials?.filter((m) => selectedMaterials.has(m.id)) || []

    materialsToDownload.forEach((material) => {
      if (material.fileData) {
        // Create blob and download
        const blob = new Blob([material.fileData.content], { type: material.fileData.type })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = material.fileData.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (material.url) {
        // Open URL in new tab
        window.open(material.url, "_blank")
      }
    })

    // Update download counts
    setCourseData((prev) => ({
      ...prev,
      materials:
        prev.materials?.map((m) =>
          selectedMaterials.has(m.id) ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m,
        ) || [],
    }))

    setSelectedMaterials(new Set())
    setBulkSelectMode(false)
  }

  const handleBulkDelete = () => {
    setCourseData({
      ...courseData,
      materials: courseData.materials?.filter((m) => !selectedMaterials.has(m.id)) || [],
    })
    setSelectedMaterials(new Set())
    setBulkSelectMode(false)
  }

  const removeMaterial = (materialId: string) => {
    setCourseData({
      ...courseData,
      materials: courseData.materials?.filter((m) => m.id !== materialId) || [],
    })
  }

  const getMaterialIcon = (type: CourseMaterial["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "link":
        return <Link className="w-4 h-4" />
      case "file":
        return <FolderOpen className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{editCourseId ? "Edit Course" : "Create New Course"}</h1>
              <p className="text-gray-600 mt-1">Build engaging learning experiences for your students</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCourseData({ ...courseData, isPublished: !courseData.isPublished })}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                courseData.isPublished
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {courseData.isPublished ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {courseData.isPublished ? "Published" : "Draft"}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Course"}
            </button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

        <div className="grid gap-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
                <input
                  type="text"
                  value={courseData.title || ""}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter course title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Description *</label>
                <textarea
                  value={courseData.description || ""}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe what students will learn in this course"
                />
              </div>
            </div>
          </div>

          {/* Course Materials */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Course Materials</h2>
                <p className="text-gray-600 mt-1">Add documents, videos, links, and other resources</p>
              </div>
              <div className="flex items-center space-x-3">
                {courseData.materials && courseData.materials.length > 0 && (
                  <button
                    onClick={() => setBulkSelectMode(!bulkSelectMode)}
                    className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {bulkSelectMode ? <X className="w-4 h-4 mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                    {bulkSelectMode ? "Cancel" : "Bulk Select"}
                  </button>
                )}
                <button
                  onClick={() => setShowMaterialForm(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </button>
              </div>
            </div>

            {/* Bulk operation controls */}
            {bulkSelectMode && courseData.materials && courseData.materials.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={selectAllMaterials}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      {selectedMaterials.size === courseData.materials.length ? (
                        <CheckSquare className="w-4 h-4 mr-2" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      Select All ({courseData.materials.length})
                    </button>
                    <span className="text-sm text-gray-600">{selectedMaterials.size} selected</span>
                  </div>
                  {selectedMaterials.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleBulkDownload}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download ({selectedMaterials.size})
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete ({selectedMaterials.size})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showMaterialForm && (
              <MaterialForm
                newMaterial={newMaterial}
                uploadProgress={uploadProgress}
                onUpload={handleFileUpload}
                onChange={(updates) => setNewMaterial({ ...newMaterial, ...updates })}
                onAdd={addMaterial}
                onCancel={() => setShowMaterialForm(false)}
              />
            )}

            {courseData.materials && courseData.materials.length > 0 ? (
              <MaterialList
                materials={courseData.materials}
                bulkSelectMode={bulkSelectMode}
                selectedMaterials={selectedMaterials}
                onToggleSelection={toggleMaterialSelection}
                onRemove={removeMaterial}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p>No materials added yet. Click "Add Material" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
