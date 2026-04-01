import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { CourseMaterial, FileUploadProgress } from '../../types';

interface MaterialFormProps {
  newMaterial: Partial<CourseMaterial>;
  uploadProgress: FileUploadProgress[];
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChange: (updates: Partial<CourseMaterial>) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({
  newMaterial,
  uploadProgress,
  onUpload,
  onChange,
  onAdd,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Material Title</label>
          <input
            type="text"
            value={newMaterial.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter material title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Material Type</label>
          <select
            value={newMaterial.type || "document"}
            onChange={(e) => onChange({ type: e.target.value as CourseMaterial["type"] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="document">Document</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="link">Link</option>
            <option value="file">File Upload</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-4 mb-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </button>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={newMaterial.url || ""}
              onChange={(e) => onChange({ url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter material URL"
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={onUpload}
          className="hidden"
          accept="*/*"
        />

        {uploadProgress.length > 0 && (
          <div className="space-y-2">
            {uploadProgress.map((progress) => (
              <div key={progress.id} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{progress.fileName}</span>
                  <span className="text-xs text-gray-500">
                    {progress.status === "completed" ? "Complete" : `${Math.round(progress.progress)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === "error"
                        ? "bg-red-500"
                        : progress.status === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && <p className="text-xs text-red-600 mt-1">{progress.error}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
          <textarea
            value={newMaterial.description || ""}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Brief description of the material"
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={newMaterial.scheduledPublishDate || ""}
              onChange={(e) => onChange({ scheduledPublishDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={newMaterial.scheduledExpiryDate || ""}
              onChange={(e) => onChange({ scheduledExpiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Add Material
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
