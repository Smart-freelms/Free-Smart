import React, { useState, useEffect } from 'react';
import { User, Quiz, Question } from '../types';
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, Settings, HelpCircle } from 'lucide-react';
import { db } from '../utils/database';

interface QuizCreatorProps {
  user: User;
  editQuizId: string | null;
  onBack: () => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ user, editQuizId, onBack }) => {
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: '',
    description: '',
    questions: [],
    timeLimit: undefined,
    allowRetry: true,
    shuffleQuestions: false,
    shuffleOptions: true,
    passingScore: 60,
    isPublished: false
  });

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
    timeLimit: undefined
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (editQuizId) {
      loadQuiz();
    }
  }, [editQuizId]);

  const loadQuiz = async () => {
    if (!editQuizId) return;
    
    try {
      const existingQuiz = await db.getQuizById(editQuizId);
      if (existingQuiz) {
        setQuiz(existingQuiz);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.question?.trim()) return;

    const newQuestion: Question = {
      id: editingIndex !== null ? quiz.questions![editingIndex].id : Date.now().toString(),
      type: currentQuestion.type as any,
      question: currentQuestion.question,
      options: currentQuestion.type === 'multiple-choice' ? currentQuestion.options?.filter(opt => opt.trim()) : undefined,
      correctAnswer: currentQuestion.correctAnswer!,
      explanation: currentQuestion.explanation || '',
      points: currentQuestion.points || 1,
      timeLimit: currentQuestion.timeLimit
    };

    const updatedQuestions = [...(quiz.questions || [])];
    if (editingIndex !== null) {
      updatedQuestions[editingIndex] = newQuestion;
    } else {
      updatedQuestions.push(newQuestion);
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    resetCurrentQuestion();
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
      timeLimit: undefined
    });
    setEditingIndex(null);
  };

  const handleEditQuestion = (index: number) => {
    const question = quiz.questions![index];
    setCurrentQuestion({ ...question });
    setEditingIndex(index);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = quiz.questions?.filter((_, i) => i !== index) || [];
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleSaveQuiz = async (publish: boolean = false) => {
    if (!quiz.title?.trim() || !quiz.questions?.length) return;

    setIsLoading(true);
    try {
      const quizToSave: Quiz = {
        id: editQuizId || Date.now().toString(),
        title: quiz.title,
        description: quiz.description || '',
        createdBy: user.id,
        questions: quiz.questions,
        timeLimit: quiz.timeLimit,
        allowRetry: quiz.allowRetry!,
        shuffleQuestions: quiz.shuffleQuestions!,
        shuffleOptions: quiz.shuffleOptions!,
        passingScore: quiz.passingScore!,
        createdAt: editQuizId ? quiz.createdAt! : new Date(),
        updatedAt: new Date(),
        isPublished: publish
      };

      await db.saveQuiz(quizToSave);
      onBack();
    } catch (error) {
      console.error('Failed to save quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(currentQuestion.options || []), ''];
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = currentQuestion.options?.filter((_, i) => i !== index) || [];
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const renderQuestionForm = () => {
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
              onChange={(e) => setCurrentQuestion({ 
                ...currentQuestion, 
                type: e.target.value as any,
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
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
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
                value={currentQuestion.correctAnswer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
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
                value={currentQuestion.correctAnswer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select answer...</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                type="text"
                value={currentQuestion.correctAnswer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
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
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
              <input
                type="number"
                min="10"
                value={currentQuestion.timeLimit || ''}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
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
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder="Provide an explanation for the correct answer..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={resetCurrentQuestion}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuestion}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {editQuizId ? 'Edit Quiz' : 'Create New Quiz'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button
                onClick={() => handleSaveQuiz(false)}
                disabled={isLoading || !quiz.title?.trim() || !quiz.questions?.length}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </button>
              <button
                onClick={() => handleSaveQuiz(true)}
                disabled={isLoading || !quiz.title?.trim() || !quiz.questions?.length}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quiz Settings */}
          <div className="lg:col-span-1">
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
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter quiz title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={quiz.description}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
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
                    onChange={(e) => setQuiz({ 
                      ...quiz, 
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
                    onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.allowRetry}
                      onChange={(e) => setQuiz({ ...quiz, allowRetry: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow retries</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.shuffleQuestions}
                      onChange={(e) => setQuiz({ ...quiz, shuffleQuestions: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Shuffle questions</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.shuffleOptions}
                      onChange={(e) => setQuiz({ ...quiz, shuffleOptions: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Shuffle answer options</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Form */}
            {renderQuestionForm()}

            {/* Questions List */}
            {quiz.questions && quiz.questions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Questions ({quiz.questions.length})
                </h3>

                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
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
                              Answer: {question.correctAnswer}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditQuestion(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(index)}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
