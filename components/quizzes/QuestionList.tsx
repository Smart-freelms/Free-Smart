import React from 'react';
import { Question } from '../../types';
import { Trash2, HelpCircle } from 'lucide-react';

interface QuestionListProps {
  questions: Question[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({ questions, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Questions ({questions.length})
      </h3>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-purple-600">
                    Q{index + 1}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {question.type.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {question.points} point{question.points !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-gray-900 font-medium mb-2">{question.question}</p>

                {question.type === 'multiple-choice' && question.options && (
                  <div className="text-sm text-gray-600 space-y-1">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className={`flex items-center ${
                        option === question.correctAnswer ? 'text-green-600 font-medium' : ''
                      }`}>
                        <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                        {option}
                        {option === question.correctAnswer && (
                          <span className="ml-2 text-xs">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.type !== 'multiple-choice' && (
                  <div className="text-sm text-green-600 font-medium">
                    Answer: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEdit(index)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
