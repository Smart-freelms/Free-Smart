import React from 'react';
import { Quiz } from '../../types';
import { Settings } from 'lucide-react';

interface QuizSettingsProps {
  quiz: Partial<Quiz>;
  onChange: (updates: Partial<Quiz>) => void;
}

export const QuizSettings: React.FC<QuizSettingsProps> = ({ quiz, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
      <div className="flex items-center mb-4">
        <Settings className="w-5 h-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Quiz Settings</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter quiz title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={quiz.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Describe your quiz..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
          <input
            type="number"
            min="1"
            value={quiz.timeLimit || ''}
            onChange={(e) => onChange({
              timeLimit: e.target.value ? parseInt(e.target.value) : undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={quiz.passingScore}
            onChange={(e) => onChange({ passingScore: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={quiz.allowRetry}
              onChange={(e) => onChange({ allowRetry: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Allow retries</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={quiz.shuffleQuestions}
              onChange={(e) => onChange({ shuffleQuestions: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Shuffle questions</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={quiz.shuffleOptions}
              onChange={(e) => onChange({ shuffleOptions: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Shuffle answer options</span>
          </label>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Scheduling & Access</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Publish Date & Time</label>
              <input
                type="datetime-local"
                value={quiz.scheduledPublishDate || ''}
                onChange={(e) => onChange({ scheduledPublishDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Expiry Date & Time</label>
              <input
                type="datetime-local"
                value={quiz.scheduledExpiryDate || ''}
                onChange={(e) => onChange({ scheduledExpiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <p className="text-[10px] text-gray-400">If set, the quiz will only be accessible to students within this window.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
