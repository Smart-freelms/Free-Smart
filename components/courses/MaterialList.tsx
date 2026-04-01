import React from 'react';
import { CourseMaterial } from '../../types';
import { Download, X, CheckSquare, Square, Video, ImageIcon, Link as LinkIcon, FolderOpen, FileText } from 'lucide-react';

interface MaterialListProps {
  materials: CourseMaterial[];
  bulkSelectMode: boolean;
  selectedMaterials: Set<string>;
  onToggleSelection: (id: string) => void;
  onRemove: (id: string) => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  bulkSelectMode,
  selectedMaterials,
  onToggleSelection,
  onRemove,
}) => {
  const getMaterialIcon = (type: CourseMaterial["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "link":
        return <LinkIcon className="w-4 h-4" />
      case "file":
        return <FolderOpen className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleDownload = (material: CourseMaterial) => {
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
  };

  return (
    <div className="space-y-3">
      {materials.map((material) => (
        <div
          key={material.id}
          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
            bulkSelectMode && selectedMaterials.has(material.id)
              ? "bg-blue-50 border-blue-300"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            {bulkSelectMode && (
              <button
                onClick={() => onToggleSelection(material.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                {selectedMaterials.has(material.id) ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              {getMaterialIcon(material.type)}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{material.title}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="truncate max-w-[200px]">{material.description || material.fileData?.name || material.url}</span>
                {material.downloadCount !== undefined && material.downloadCount > 0 && (
                  <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                    {material.downloadCount} downloads
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!bulkSelectMode && (
              <>
                {(material.fileData || material.url) && (
                  <button
                    onClick={() => handleDownload(material)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onRemove(material.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
