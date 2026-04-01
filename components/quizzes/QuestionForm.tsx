import React from 'react';
import { Question } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionFormProps {
  currentQuestion: Partial<Question>;
  editingIndex: number | null;
  onSave: () => void;
  onCancel: () => void;
  onChange: (updates: Partial<Question>) => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  currentQuestion,
  editingIndex,
  onSave,
  onCancel,
  onChange,
}) => {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    onChange({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(currentQuestion.options || []), ''];
    onChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = currentQuestion.options?.filter((_, i) => i !== index) || [];
    onChange({ options: newOptions });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {editingIndex !== null ? 'Edit Question' : 'Add New Question'}
      </h3>

      <div className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
          <select
            value={currentQuestion.type}
            onChange={(e) => onChange({
              type: e.target.value as Question["type"],
              options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
            <option value="fill-blank">Fill in the Blank</option>
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
          <textarea
            value={currentQuestion.question}
            onChange={(e) => onChange({ question: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Enter your question here..."
          />
        </div>

        {/* Options for Multiple Choice */}
        {currentQuestion.type === 'multiple-choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                  />
                  {currentQuestion.options!.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center px-3 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </button>
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
          {currentQuestion.type === 'multiple-choice' ? (
            <select
              value={currentQuestion.correctAnswer as string}
              onChange={(e) => onChange({ correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select correct answer...</option>
              {currentQuestion.options?.map((option, index) => (
                option.trim() && (
                  <option key={index} value={option}>{option}</option>
                )
              ))}
            </select>
          ) : currentQuestion.type === 'true-false' ? (
            <select
              value={currentQuestion.correctAnswer as string}
              onChange={(e) => onChange({ correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select answer...</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          ) : (
            <input
              type="text"
              value={currentQuestion.correctAnswer as string}
              onChange={(e) => onChange({ correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter the correct answer..."
            />
          )}
        </div>

        {/* Points and Time Limit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
            <input
              type="number"
              min="1"
              value={currentQuestion.points}
              onChange={(e) => onChange({ points: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
            <input
              type="number"
              min="10"
              value={currentQuestion.timeLimit || ''}
              onChange={(e) => onChange({
                timeLimit: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
          <textarea
            value={currentQuestion.explanation}
            onChange={(e) => onChange({ explanation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            placeholder="Provide an explanation for the correct answer..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!currentQuestion.question?.trim() || !currentQuestion.correctAnswer}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingIndex !== null ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
};
