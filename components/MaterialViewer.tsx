"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { db } from '@/utils/database'
import type { User, Course, CourseMaterial } from "../types"
import {
  ArrowLeft,
  Download,
  FileText,
  Video,
  ImageIcon,
  Link,
  CheckSquare,
  Square,
  FolderOpen,
  Search,
} from "lucide-react"

interface MaterialViewerProps {
  user: User
  course: Course
  onBack: () => void
}

export const MaterialViewer: React.FC<MaterialViewerProps> = ({ user, course, onBack }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>(course.materials || [])
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set())
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<CourseMaterial["type"] | "all">("all")
  const [sortBy, setSortBy] = useState<"title" | "date" | "type" | "downloads">("date")

  const filteredMaterials = materials
    .filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === "all" || material.type === filterType
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "date":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        case "type":
          return a.type.localeCompare(b.type)
        case "downloads":
          return (b.downloadCount || 0) - (a.downloadCount || 0)
        default:
          return 0
      }
    })

  const toggleMaterialSelection = (materialId: string) => {
    const newSelected = new Set(selectedMaterials)
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId)
    } else {
      newSelected.add(materialId)
    }
    setSelectedMaterials(newSelected)
  }

  useEffect(() => {
    // Standardize role-based material access if needed,
    // but the course object passed from parent is already filtered for students.
    setIsLoading(false)
  }, [course.id])

  const selectAllMaterials = () => {
    if (selectedMaterials.size === filteredMaterials.length) {
      setSelectedMaterials(new Set())
    } else {
      setSelectedMaterials(new Set(filteredMaterials.map((m) => m.id)))
    }
  }

  const handleBulkDownload = () => {
    const materialsToDownload = materials.filter((m) => selectedMaterials.has(m.id))

    materialsToDownload.forEach((material) => {
      if (material.fileData) {
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
        window.open(material.url, "_blank")
      }
    })

    // Update download counts
    setMaterials((prev) =>
      prev.map((m) => (selectedMaterials.has(m.id) ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m)),
    )

    setSelectedMaterials(new Set())
    setBulkSelectMode(false)
  }

  const getMaterialIcon = (type: CourseMaterial["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />
      case "image":
        return <ImageIcon className="w-5 h-5" />
      case "link":
        return <Link className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 transition-colors mr-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title} - Materials</h1>
              <p className="text-gray-600 mt-1">{materials.length} materials available</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {materials.length > 0 && (
              <button
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {bulkSelectMode ? "Cancel Selection" : "Bulk Select"}
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Materials</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by title or description..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as CourseMaterial["type"] | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="document">Documents</option>
                <option value="video">Videos</option>
                <option value="image">Images</option>
                <option value="link">Links</option>
                <option value="file">Files</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "title" | "date" | "type" | "downloads")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Upload Date</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
                <option value="downloads">Downloads</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Selection Controls */}
        {bulkSelectMode && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={selectAllMaterials} className="flex items-center text-blue-600 hover:text-blue-800">
                  {selectedMaterials.size === filteredMaterials.length ? (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  Select All ({filteredMaterials.length})
                </button>
                <span className="text-sm text-gray-600">{selectedMaterials.size} selected</span>
              </div>
              {selectedMaterials.size > 0 && (
                <button
                  onClick={handleBulkDownload}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected ({selectedMaterials.size})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Materials Grid */}
        {filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className={`bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
                  bulkSelectMode && selectedMaterials.has(material.id)
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {bulkSelectMode && (
                        <button
                          onClick={() => toggleMaterialSelection(material.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedMaterials.has(material.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getMaterialIcon(material.type)}
                      </div>
                    </div>
                    {!bulkSelectMode && (
                      <button
                        onClick={() => {
                          if (material.fileData) {
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
                            window.open(material.url, "_blank")
                          }
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{material.title}</h3>

                  {material.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>
                  )}

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{material.type}</span>
                      {material.fileData && <span>{formatFileSize(material.fileData.size)}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{new Date(material.uploadedAt).toLocaleDateString()}</span>
                      {material.downloadCount !== undefined && material.downloadCount > 0 && (
                        <span className="bg-gray-100 px-2 py-1 rounded">{material.downloadCount} downloads</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No materials have been added to this course yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
