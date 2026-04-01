import React from 'react';
import { FileText, Upload, Link as LinkIcon } from 'lucide-react';

interface SubmissionTypeSelectorProps {
  selectedTypes: ("text" | "file" | "url")[];
  onToggle: (type: "text" | "file" | "url") => void;
}

export const SubmissionTypeSelector: React.FC<SubmissionTypeSelectorProps> = ({ selectedTypes, onToggle }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        onClick={() => onToggle("text")}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          selectedTypes.includes("text")
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-center mb-3">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-center font-medium text-gray-900">Text Submission</h3>
        <p className="text-center text-sm text-gray-600 mt-1">Students can type their response directly</p>
      </div>

      <div
        onClick={() => onToggle("file")}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          selectedTypes.includes("file")
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-center mb-3">
          <Upload className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-center font-medium text-gray-900">File Upload</h3>
        <p className="text-center text-sm text-gray-600 mt-1">Students can upload documents or files</p>
      </div>

      <div
        onClick={() => onToggle("url")}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          selectedTypes.includes("url")
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-center mb-3">
          <LinkIcon className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-center font-medium text-gray-900">URL Submission</h3>
        <p className="text-center text-sm text-gray-600 mt-1">Students can submit links to their work</p>
      </div>
    </div>
  );
};
